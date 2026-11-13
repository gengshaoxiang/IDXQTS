import {
  MU_GLOBAL,
  SCORE_MAX,
  SCORE_MIN,
  SIGMA_GLOBAL,
  ZSCORE_MIN_N,
  ZSCORE_MIN_SIGMA,
} from "../dimensions";

export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function mean(values: number[]): number {
  if (!values.length) return 0;
  return values.reduce((a, b) => a + b, 0) / values.length;
}

/** 总体标准差（文档公式除以 n，非样本 n-1） */
export function populationStd(values: number[], mu?: number): number {
  if (!values.length) return 0;
  const m = mu ?? mean(values);
  const variance =
    values.reduce((acc, x) => acc + (x - m) ** 2, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * 评价人宽严度 Z-Score 校准（文档 4.2）
 * 若 n < 3 或 sigma < 0.15，跳过变换，返回原始分。
 */
export function calibrateEvaluatorScores(
  scores: number[],
  muGlobal = MU_GLOBAL,
  sigmaGlobal = SIGMA_GLOBAL,
): number[] {
  const n = scores.length;
  if (n < ZSCORE_MIN_N) return [...scores];

  const mu = mean(scores);
  const sigma = populationStd(scores, mu);
  if (sigma < ZSCORE_MIN_SIGMA) return [...scores];

  return scores.map((x) => {
    const z = (x - mu) / sigma;
    return clamp(muGlobal + z * sigmaGlobal, SCORE_MIN, SCORE_MAX);
  });
}

export function calibrateSingleAgainstPool(
  target: number,
  allScoresByEvaluator: number[],
): number {
  const calibrated = calibrateEvaluatorScores(allScoresByEvaluator);
  const idx = allScoresByEvaluator.indexOf(target);
  // 若有重复分值，按首次匹配；调用方应传索引版 API
  if (idx < 0) return target;
  return calibrated[idx]!;
}

export function calibrateByIndex(
  allScoresByEvaluator: number[],
): number[] {
  return calibrateEvaluatorScores(allScoresByEvaluator);
}
