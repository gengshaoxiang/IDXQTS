import {
  canViewCalibration,
  jsonPrivate,
  requirePrivilegedViewer,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const user = await requirePrivilegedViewer(req);
  if (user instanceof Response) return user;
  if (!canViewCalibration(user.role)) {
    return jsonPrivate({ code: 403, message: "无权限" }, { status: 403 });
  }

  const url = new URL(req.url);
  const cycleId = url.searchParams.get("cycleId");
  const cycle = cycleId
    ? await prisma.evalCycle.findUnique({ where: { id: cycleId } })
    : await prisma.evalCycle.findFirst({ orderBy: { createdAt: "desc" } });

  if (!cycle) {
    return jsonPrivate({ code: 404, message: "无周期" }, { status: 404 });
  }

  const results = await prisma.evalResult.findMany({
    where: { cycleId: cycle.id },
    include: { subject: true },
    orderBy: { computedTotalScore: "desc" },
  });

  const distribution = { S: 0, A: 0, B: 0, C: 0, D: 0 };
  for (const r of results) {
    const g = r.finalGrade as keyof typeof distribution;
    if (g in distribution) distribution[g] += 1;
  }

  return jsonPrivate({
    code: 200,
    data: {
      cycle: {
        id: cycle.id,
        cycleName: cycle.cycleName,
        status: cycle.status,
      },
      distribution,
      nineBox: results.map((r) => ({
        subjectId: r.subjectId,
        userName: r.subject.userName,
        positionTitle: r.subject.positionTitle,
        score: r.computedTotalScore,
        systemGrade: r.systemGrade,
        finalGrade: r.finalGrade,
        vetoApplied: r.vetoApplied,
        subordinatePooled: r.subordinatePooled,
        dimensionScores: JSON.parse(r.dimensionScores),
      })),
    },
  });
}
