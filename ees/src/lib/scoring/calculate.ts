import { mean } from "./zscore";
import { calibrateByIndex } from "./zscore";
import { groupBallotsWithPooling } from "./pooling";
import { applyVetoToGrade, scoreToGrade, type Grade } from "./grade";
import { DIMENSIONS } from "../dimensions";
import type { ScoreItem } from "./star-validation";

export type DimensionWeights = Record<string, number>;
export type RoleWeights = Record<string, Record<string, number>>;

export type RawBallotInput = {
  id: string;
  evaluatorBlindToken: string;
  relationRole: string;
  scoresPayload: ScoreItem[];
  rawWeightedScore: number;
};

export type SubjectCalcInput = {
  subjectId: string;
  dimensionWeights: DimensionWeights;
  roleWeights: RoleWeights;
  ballots: RawBallotInput[];
  vetoSeverities: string[];
};

export type SubjectCalcResult = {
  subjectId: string;
  dimensionScores: Record<string, number>;
  subordinatePooled: boolean;
  computedTotalScore: number;
  systemGrade: Grade;
  vetoApplied: boolean;
  finalGrade: Grade;
  calibratedBallots: {
    id: string;
    calibratedScore: number;
  }[];
};

function itemAverage(items: ScoreItem[]): number {
  if (!items.length) return 0;
  return mean(items.map((i) => i.score));
}

function ballotDimensionScore(
  items: ScoreItem[],
  dimensionCode: string,
): number {
  const dimItems = items.filter((i) => i.dimension_code === dimensionCode);
  return itemAverage(dimItems);
}

/**
 * 全量出分：Z-Score 校准 → 角色加权 → 下属池化 → 维度加权 → 风控熔断
 */
export function calculateSubjectResult(
  input: SubjectCalcInput,
): SubjectCalcResult {
  // 1) 按盲化令牌（评价人）聚合其在本周期所有选票原始均分，做 Z-Score
  const byEvaluator = new Map<string, { ballotIds: string[]; scores: number[] }>();
  for (const b of input.ballots) {
    const avg = itemAverage(b.scoresPayload);
    const bucket = byEvaluator.get(b.evaluatorBlindToken) ?? {
      ballotIds: [],
      scores: [],
    };
    bucket.ballotIds.push(b.id);
    bucket.scores.push(avg);
    byEvaluator.set(b.evaluatorBlindToken, bucket);
  }

  const calibratedMap = new Map<string, number>();
  for (const [, bucket] of byEvaluator) {
    const calibrated = calibrateByIndex(bucket.scores);
    bucket.ballotIds.forEach((id, idx) => {
      calibratedMap.set(id, calibrated[idx]!);
    });
  }

  const calibratedBallots = input.ballots.map((b) => ({
    id: b.id,
    calibratedScore: calibratedMap.get(b.id) ?? itemAverage(b.scoresPayload),
    relationRole: b.relationRole,
    scoresPayload: b.scoresPayload,
  }));

  // 2) 下属池化判定
  const pooled = groupBallotsWithPooling(
    calibratedBallots.map((b) => ({
      relationRole: b.relationRole,
      calibratedScore: b.calibratedScore,
    })),
  );

  // 3) 按维度：各角色有效池均分 × 角色权重，再 × 维度权重
  const dimensionScores: Record<string, number> = {};
  let total = 0;

  for (const dim of DIMENSIONS) {
    const roleWeightMap = input.roleWeights[dim.code] ?? {};
    const roleAvgs: Record<string, number[]> = {};

    for (const b of calibratedBallots) {
      const effectiveRole =
        b.relationRole === "SUBORDINATE" && pooled.subordinatePooled
          ? "PEER"
          : b.relationRole;
      const dimScore = ballotDimensionScore(b.scoresPayload, dim.code);
      // 用整体校准偏移应用到维度分：scale = calibrated / rawAvg
      const rawAvg = itemAverage(b.scoresPayload) || 1;
      const scale = b.calibratedScore / rawAvg;
      const adjusted = dimScore * scale;
      if (!roleAvgs[effectiveRole]) roleAvgs[effectiveRole] = [];
      roleAvgs[effectiveRole].push(adjusted);
    }

    let dimScore = 0;
    let weightSum = 0;
    for (const [role, weight] of Object.entries(roleWeightMap)) {
      const scores = roleAvgs[role];
      if (!scores?.length) continue;
      dimScore += weight * mean(scores);
      weightSum += weight;
    }
    // 若缺角色，按已有权重归一
    if (weightSum > 0 && Math.abs(weightSum - 1) > 0.001) {
      dimScore = dimScore / weightSum;
    }

    dimensionScores[dim.code] = Number(dimScore.toFixed(4));
    const dimWeight = input.dimensionWeights[dim.code] ?? 0;
    total += dimWeight * dimScore;
  }

  const computedTotalScore = Number(total.toFixed(2));
  const systemGrade = scoreToGrade(computedTotalScore);
  const { finalGrade, vetoApplied } = applyVetoToGrade(
    systemGrade,
    input.vetoSeverities,
  );

  return {
    subjectId: input.subjectId,
    dimensionScores,
    subordinatePooled: pooled.subordinatePooled,
    computedTotalScore,
    systemGrade,
    vetoApplied,
    finalGrade,
    calibratedBallots: calibratedBallots.map((b) => ({
      id: b.id,
      calibratedScore: Number(b.calibratedScore.toFixed(4)),
    })),
  };
}

/** 选票内简单加权均分（提交时写 rawWeightedScore） */
export function computeRawWeightedScore(items: ScoreItem[]): number {
  return Number(itemAverage(items).toFixed(2));
}
