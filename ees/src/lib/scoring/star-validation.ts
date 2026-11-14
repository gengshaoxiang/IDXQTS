import { EXTREME_HIGH, EXTREME_LOW, STAR_MIN_CHARS } from "../dimensions";

export type StarEvidence = {
  situation_task: string;
  action: string;
  result: string;
};

export type ScoreItem = {
  dimension_code: string;
  item_code: string;
  score: number;
  star_evidence?: StarEvidence | null;
};

export type StarValidationError = {
  item_code: string;
  score: number;
  reason: string;
};

function starCharCount(evidence?: StarEvidence | null): number {
  if (!evidence) return 0;
  return (
    (evidence.situation_task ?? "").trim().length +
    (evidence.action ?? "").trim().length +
    (evidence.result ?? "").trim().length
  );
}

export function isExtremeScore(score: number): boolean {
  return score >= EXTREME_HIGH || score <= EXTREME_LOW;
}

export function validateStarEvidence(
  items: ScoreItem[],
): { ok: true } | { ok: false; errors: StarValidationError[] } {
  const errors: StarValidationError[] = [];

  for (const item of items) {
    if (!isExtremeScore(item.score)) continue;

    const evidence = item.star_evidence;
    const fieldsFilled =
      !!evidence?.situation_task?.trim() &&
      !!evidence?.action?.trim() &&
      !!evidence?.result?.trim();
    const chars = starCharCount(evidence);

    if (!fieldsFilled || chars < STAR_MIN_CHARS) {
      errors.push({
        item_code: item.item_code,
        score: item.score,
        reason: `极端分数 ${item.score} 须填写完整 STAR 举证且合计不少于 ${STAR_MIN_CHARS} 字（当前 ${chars}）`,
      });
    }
  }

  return errors.length ? { ok: false, errors } : { ok: true };
}
