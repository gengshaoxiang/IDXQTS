import {
  canViewPersonalReport,
  jsonPrivate,
  resolveSessionUser,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SUBORDINATE_POOL_THRESHOLD } from "@/lib/dimensions";

export const dynamic = "force-dynamic";

export async function GET(
  req: Request,
  ctx: { params: Promise<{ subjectId: string }> },
) {
  const user = await resolveSessionUser(req);
  if (user instanceof Response) return user;

  const { subjectId } = await ctx.params;
  const subject = await prisma.evalSubject.findUnique({
    where: { id: subjectId },
    include: {
      result: true,
      vetoes: { where: { isActive: true } },
      ballots: true,
      template: true,
    },
  });

  if (!subject) {
    return jsonPrivate({ code: 404, message: "对象不存在" }, { status: 404 });
  }

  if (!canViewPersonalReport(user.role, user.id, subject.userId)) {
    return jsonPrivate({ code: 403, message: "无权限查看报告" }, { status: 403 });
  }

  const subCount = subject.ballots.filter(
    (b) => b.relationRole === "SUBORDINATE",
  ).length;
  const pooled =
    subject.result?.subordinatePooled ?? subCount < SUBORDINATE_POOL_THRESHOLD;

  const dimensionScores = subject.result
    ? (JSON.parse(subject.result.dimensionScores) as Record<string, number>)
    : null;

  const rolePools: Record<string, number[]> = {};
  for (const b of subject.ballots) {
    let role = b.relationRole;
    if (role === "SUBORDINATE" && pooled) role = "PEER";
    const score = b.calibratedScore ?? b.rawWeightedScore;
    if (!rolePools[role]) rolePools[role] = [];
    rolePools[role].push(score);
  }
  const roleAverages = Object.fromEntries(
    Object.entries(rolePools).map(([k, v]) => [
      k,
      Number((v.reduce((a, b) => a + b, 0) / v.length).toFixed(2)),
    ]),
  );

  return jsonPrivate({
    code: 200,
    data: {
      subject: {
        id: subject.id,
        userName: subject.userName,
        positionTitle: subject.positionTitle,
        departmentName: subject.departmentName,
        biKpiSnapshot: subject.biKpiSnapshot
          ? JSON.parse(subject.biKpiSnapshot)
          : null,
      },
      result: subject.result
        ? {
            computedTotalScore: subject.result.computedTotalScore,
            systemGrade: subject.result.systemGrade,
            finalGrade: subject.result.finalGrade,
            vetoApplied: subject.result.vetoApplied,
            calibrationRemark: subject.result.calibrationRemark,
            dimensionScores,
          }
        : null,
      anonymity: {
        subordinateCount: subCount,
        subordinatePooled: pooled,
        hideSubordinateDimension: pooled,
      },
      roleAverages,
      vetoes: subject.vetoes.map((v) => ({
        severityLevel: v.severityLevel,
        incidentCategory: v.incidentCategory,
        evidenceRefNo: v.evidenceRefNo,
        incidentSummary: v.incidentSummary,
      })),
    },
  });
}
