import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ code: 401, message: "未登录" }, { status: 401 });
  }

  const cycleId = req.nextUrl.searchParams.get("cycleId");
  const cycle = cycleId
    ? await prisma.evalCycle.findUnique({ where: { id: cycleId } })
    : await prisma.evalCycle.findFirst({
        where: { status: { in: ["ACTIVE", "CALIBRATING"] } },
        orderBy: { createdAt: "desc" },
      });

  if (!cycle) {
    return NextResponse.json({ code: 404, message: "无评价周期" }, { status: 404 });
  }

  const relations = await prisma.evalRelation.findMany({
    where: { cycleId: cycle.id, evaluatorUserId: user.id },
    include: { subject: true },
    orderBy: { subject: { userName: "asc" } },
  });

  return NextResponse.json({
    code: 200,
    data: {
      cycleId: cycle.id,
      cycleName: cycle.cycleName,
      deadline: cycle.endTime.toISOString(),
      status: cycle.status,
      tasks: relations.map((r) => ({
        relationId: r.id,
        subjectId: r.subjectId,
        subjectName: r.subject.userName,
        positionTitle: r.subject.positionTitle,
        departmentName: r.subject.departmentName,
        relationRole: r.relationRole,
        taskStatus: r.taskStatus,
        biSnapshotSummary: r.subject.biKpiSnapshot
          ? JSON.parse(r.subject.biKpiSnapshot)
          : null,
      })),
    },
  });
}
