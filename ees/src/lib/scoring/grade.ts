import { GRADE_RULES } from "../dimensions";

export type Grade = "S" | "A" | "B" | "C" | "D";

export function scoreToGrade(totalScore: number): Grade {
  for (const rule of GRADE_RULES) {
    if (totalScore >= rule.min) return rule.grade as Grade;
  }
  return "D";
}

const GRADE_ORDER: Grade[] = ["S", "A", "B", "C", "D"];

export function downgradeOne(grade: Grade): Grade {
  const idx = GRADE_ORDER.indexOf(grade);
  return GRADE_ORDER[Math.min(idx + 1, GRADE_ORDER.length - 1)]!;
}

/**
 * 风控熔断：
 * - MINOR_DOWNGRADE: 降一档
 * - CRITICAL_VETO: 封顶 C（若更差则保持）
 */
export function applyVetoToGrade(
  systemGrade: Grade,
  severityLevels: string[],
): { finalGrade: Grade; vetoApplied: boolean } {
  let grade = systemGrade;
  let vetoApplied = false;

  const hasCritical = severityLevels.includes("CRITICAL_VETO");
  const hasMinor = severityLevels.includes("MINOR_DOWNGRADE");

  if (hasMinor) {
    grade = downgradeOne(grade);
    vetoApplied = true;
  }

  if (hasCritical) {
    const capIdx = GRADE_ORDER.indexOf("C");
    const currentIdx = GRADE_ORDER.indexOf(grade);
    grade = GRADE_ORDER[Math.max(currentIdx, capIdx)] as Grade;
    vetoApplied = true;
  }

  return { finalGrade: grade, vetoApplied };
}
