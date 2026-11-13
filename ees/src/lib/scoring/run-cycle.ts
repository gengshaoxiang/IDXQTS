import { prisma } from "../prisma";
import { calculateSubjectResult, type DimensionWeights, type RoleWeights } from "./calculate";
import type { ScoreItem } from "./star-validation";

export async function runCycleCalculation(cycleId: string) {
  const cycle = await prisma.evalCycle.findUnique({ where: { id: cycleId } });
  if (!cycle) throw new Error("CYCLE_NOT_FOUND");

  const subjects = await prisma.evalSubject.findMany({
    where: { cycleId },
    include: { template: true, vetoes: { where: { isActive: true } } },
  });

  const results = [];

  for (const subject of subjects) {
    const ballots = await prisma.evalBallot.findMany({
      where: { cycleId, subjectId: subject.id },
    });

    const calc = calculateSubjectResult({
      subjectId: subject.id,
      dimensionWeights: JSON.parse(subject.template.dimensionWeights) as DimensionWeights,
      roleWeights: JSON.parse(subject.template.roleWeights) as RoleWeights,
      ballots: ballots.map((b) => ({
        id: b.id,
        evaluatorBlindToken: b.evaluatorBlindToken,
        relationRole: b.relationRole,
        scoresPayload: JSON.parse(b.scoresPayload) as ScoreItem[],
        rawWeightedScore: b.rawWeightedScore,
      })),
      vetoSeverities: subject.vetoes.map((v) => v.severityLevel),
    });

    for (const cb of calc.calibratedBallots) {
      await prisma.evalBallot.update({
        where: { id: cb.id },
        data: { calibratedScore: cb.calibratedScore },
      });
    }

    const saved = await prisma.evalResult.upsert({
      where: { subjectId: subject.id },
      create: {
        cycleId,
        subjectId: subject.id,
        dimensionScores: JSON.stringify(calc.dimensionScores),
        subordinatePooled: calc.subordinatePooled,
        computedTotalScore: calc.computedTotalScore,
        systemGrade: calc.systemGrade,
        vetoApplied: calc.vetoApplied,
        finalGrade: calc.finalGrade,
      },
      update: {
        dimensionScores: JSON.stringify(calc.dimensionScores),
        subordinatePooled: calc.subordinatePooled,
        computedTotalScore: calc.computedTotalScore,
        systemGrade: calc.systemGrade,
        vetoApplied: calc.vetoApplied,
        finalGrade: calc.finalGrade,
      },
    });

    results.push({
      userName: subject.userName,
      ...calc,
      resultId: saved.id,
    });
  }

  if (cycle.status === "ACTIVE" || cycle.status === "CALIBRATING") {
    await prisma.evalCycle.update({
      where: { id: cycleId },
      data: { status: "CALIBRATING" },
    });
  }

  return results;
}
