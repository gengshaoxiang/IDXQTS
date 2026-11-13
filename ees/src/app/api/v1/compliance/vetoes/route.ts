import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { canEnterVeto, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCycleCalculation } from "@/lib/scoring/run-cycle";

const bodySchema = z.object({
  cycleId: z.string(),
  subjectId: z.string(),
  severityLevel: z.enum(["MINOR_DOWNGRADE", "CRITICAL_VETO"]),
  incidentCategory: z.enum([
    "FINANCE_AUDIT",
    "INFO_SEC",
    "EHS_QUALITY",
    "LEGAL_TAX",
  ]),
  incidentSummary: z.string().min(10),
  evidenceRefNo: z.string().min(1),
  approvedBy: z.string().min(1),
});

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user || !canEnterVeto(user.role)) {
    return NextResponse.json({ code: 403, message: "仅审计风控角色可录入" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ code: 400, message: "参数错误" }, { status: 400 });
  }

  const data = parsed.data;
  if (data.approvedBy === user.id) {
    return NextResponse.json(
      { code: 422, message: "双人复核：核准人不能与提报人为同一人" },
      { status: 422 },
    );
  }

  const veto = await prisma.complianceVeto.create({
    data: {
      cycleId: data.cycleId,
      subjectId: data.subjectId,
      severityLevel: data.severityLevel,
      incidentCategory: data.incidentCategory,
      incidentSummary: data.incidentSummary,
      evidenceRefNo: data.evidenceRefNo,
      reportedBy: user.id,
      approvedBy: data.approvedBy,
      isActive: true,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CREATE_VETO",
      entityType: "ComplianceVeto",
      entityId: veto.id,
      afterJson: JSON.stringify(veto),
    },
  });

  const cycle = await prisma.evalCycle.findUnique({ where: { id: data.cycleId } });
  if (cycle && ["CALIBRATING", "PUBLISHED", "ACTIVE"].includes(cycle.status)) {
    await runCycleCalculation(data.cycleId);
  }

  return NextResponse.json({ code: 200, data: veto });
}

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }
  const cycleId = req.nextUrl.searchParams.get("cycleId");
  const vetoes = await prisma.complianceVeto.findMany({
    where: cycleId ? { cycleId } : undefined,
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ code: 200, data: vetoes });
}
