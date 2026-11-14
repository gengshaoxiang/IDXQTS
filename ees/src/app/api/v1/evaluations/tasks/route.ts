import { jsonPrivate, resolveSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await resolveSessionUser(req);
  if (user instanceof Response) return user;

  const url = new URL(req.url);
  const cycleId = url.searchParams.get("cycleId");
  const cycle = cycleId
    ? await prisma.evalCycle.findUnique({ where: { id: cycleId } })
    : await prisma.evalCycle.findFirst({
        where: { status: { in: ["ACTIVE", "CALIBRATING"] } },
        orderBy: { createdAt: "desc" },
      });

  if (!cycle) {
    return jsonPrivate({ code: 404, message: "无评价周期" }, { status: 404 });
  }

  const relations = await prisma.evalRelation.findMany({
    where: { cycleId: cycle.id, evaluatorUserId: user.id },
    include: { subject: true },
    orderBy: { subject: { userName: "asc" } },
  });

  return jsonPrivate({
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
