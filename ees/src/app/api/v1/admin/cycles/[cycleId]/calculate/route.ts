import {
  canTriggerCalculate,
  jsonPrivate,
  requirePrivilegedViewer,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCycleCalculation } from "@/lib/scoring/run-cycle";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ cycleId: string }> },
) {
  const user = await requirePrivilegedViewer(req);
  if (user instanceof Response) return user;
  if (!canTriggerCalculate(user.role)) {
    return jsonPrivate({ code: 403, message: "无权限" }, { status: 403 });
  }

  const { cycleId } = await ctx.params;
  const cycle = await prisma.evalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    return jsonPrivate({ code: 404, message: "周期不存在" }, { status: 404 });
  }

  const results = await runCycleCalculation(cycleId);

  await prisma.auditLog.create({
    data: {
      actorId: user.id,
      action: "CALCULATE_CYCLE",
      entityType: "EvalCycle",
      entityId: cycleId,
      afterJson: JSON.stringify({
        count: results.length,
        grades: results.map((r) => ({
          subjectId: r.subjectId,
          finalGrade: r.finalGrade,
          score: r.computedTotalScore,
        })),
      }),
    },
  });

  return jsonPrivate({ code: 200, data: { results } });
}
