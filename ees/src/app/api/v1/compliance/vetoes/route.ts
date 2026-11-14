import { z } from "zod";
import {
  canEnterVeto,
  canViewCalibration,
  jsonPrivate,
  requirePrivilegedViewer,
  resolveSessionUser,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
});

/** Create a PENDING veto — not active until a different signed-in user approves. */
export async function POST(req: Request) {
  const user = await requirePrivilegedViewer(req);
  if (user instanceof Response) return user;
  if (!canEnterVeto(user.role)) {
    return jsonPrivate({ code: 403, message: "仅审计/HRD 可提报" }, { status: 403 });
  }

  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) {
    return jsonPrivate({ code: 400, message: "参数错误" }, { status: 400 });
  }

  const data = parsed.data;
  const veto = await prisma.complianceVeto.create({
    data: {
      cycleId: data.cycleId,
      subjectId: data.subjectId,
      severityLevel: data.severityLevel,
      incidentCategory: data.incidentCategory,
      incidentSummary: data.incidentSummary,
      evidenceRefNo: data.evidenceRefNo,
      reportedBy: user.id,
      approvedBy: null,
      isActive: false,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CREATE_VETO_PENDING",
      entityType: "ComplianceVeto",
      entityId: veto.id,
      afterJson: JSON.stringify({
        id: veto.id,
        severityLevel: veto.severityLevel,
        evidenceRefNo: veto.evidenceRefNo,
      }),
    },
  });

  return jsonPrivate({
    code: 200,
    data: veto,
    message: "已提交待复核；需另一登录用户核准后生效",
  });
}

export async function GET(req: Request) {
  const user = await resolveSessionUser(req);
  if (user instanceof Response) return user;
  if (!canViewCalibration(user.role) && !canEnterVeto(user.role)) {
    return jsonPrivate({ code: 403, message: "无权限" }, { status: 403 });
  }

  const url = new URL(req.url);
  const cycleId = url.searchParams.get("cycleId");
  const vetoes = await prisma.complianceVeto.findMany({
    where: cycleId ? { cycleId } : undefined,
    include: { subject: true },
    orderBy: { createdAt: "desc" },
  });
  return jsonPrivate({ code: 200, data: vetoes });
}
