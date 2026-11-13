import { NextRequest, NextResponse } from "next/server";
import { canTriggerCalculate, getSessionUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { runCycleCalculation } from "@/lib/scoring/run-cycle";

export async function POST(
  _req: NextRequest,
  ctx: { params: Promise<{ cycleId: string }> },
) {
  const user = await getSessionUser();
  if (!user || !canTriggerCalculate(user.role)) {
    return NextResponse.json({ code: 403, message: "无权限" }, { status: 403 });
  }

  const { cycleId } = await ctx.params;
  const cycle = await prisma.evalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) {
    return NextResponse.json({ code: 404, message: "周期不存在" }, { status: 404 });
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

  return NextResponse.json({ code: 200, data: { results } });
}
