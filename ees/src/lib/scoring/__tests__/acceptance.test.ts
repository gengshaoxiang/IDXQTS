import { describe, expect, it } from "vitest";
import { validateStarEvidence } from "../star-validation";
import { calibrateEvaluatorScores, mean, populationStd } from "../zscore";
import { applyVetoToGrade, scoreToGrade } from "../grade";
import {
  groupBallotsWithPooling,
  shouldHideSubordinateDimension,
} from "../pooling";
import { calculateSubjectResult } from "../calculate";
import { MU_GLOBAL, SIGMA_GLOBAL } from "../../dimensions";
import type { ScoreItem } from "../star-validation";
import { DIMENSIONS } from "../../dimensions";

function flatScores(score: number): ScoreItem[] {
  return DIMENSIONS.flatMap((d) =>
    d.items.map((i) => ({
      dimension_code: d.code,
      item_code: i.code,
      score,
      ...(score >= 4.5 || score <= 2.5
        ? {
            star_evidence: {
              situation_task: "2026年Q3某大区供应链突发断供危机需要紧急应对",
              action: "第一时间亲赴一线协调备用冷链仓连夜重构调拨方案",
              result: "48小时内恢复95%终端供货未造成核心客户流失",
            },
          }
        : {}),
    })),
  );
}

describe("UAT: STAR 拦截", () => {
  it("极端分无举证时失败", () => {
    const result = validateStarEvidence([
      {
        dimension_code: "LEADERSHIP_CULTURE",
        item_code: "ACCOUNTABILITY",
        score: 4.5,
      },
    ]);
    expect(result.ok).toBe(false);
  });

  it("极端分举证不足 50 字时失败", () => {
    const result = validateStarEvidence([
      {
        dimension_code: "LEADERSHIP_CULTURE",
        item_code: "ACCOUNTABILITY",
        score: 2.5,
        star_evidence: {
          situation_task: "短",
          action: "短",
          result: "短",
        },
      },
    ]);
    expect(result.ok).toBe(false);
  });

  it("极端分有效 STAR 通过", () => {
    const result = validateStarEvidence([
      {
        dimension_code: "LEADERSHIP_CULTURE",
        item_code: "ACCOUNTABILITY",
        score: 5.0,
        star_evidence: {
          situation_task: "2026年Q3某大区供应链突发断供危机",
          action: "第一时间亲赴一线协调备用冷链仓，连夜重构调拨方案",
          result: "48小时内恢复95%终端供货，未造成核心客户流失",
        },
      },
    ]);
    expect(result.ok).toBe(true);
  });
});

describe("UAT: Z-Score 校准一致性", () => {
  it("与离线公式误差 < 0.001", () => {
    const scores = [5.0, 4.5, 3.0, 2.5];
    const mu = mean(scores);
    const sigma = populationStd(scores, mu);
    const expected = scores.map((x) => {
      const z = (x - mu) / sigma;
      return Math.min(5, Math.max(1, MU_GLOBAL + z * SIGMA_GLOBAL));
    });
    const actual = calibrateEvaluatorScores(scores);
    actual.forEach((v, i) => {
      expect(Math.abs(v - expected[i]!)).toBeLessThan(0.001);
    });
  });

  it("n < 3 时跳过校准", () => {
    expect(calibrateEvaluatorScores([5, 1])).toEqual([5, 1]);
  });
});

describe("UAT: 下属池化匿名保护", () => {
  it("2 名下属时隐藏下属维度并入 PEER", () => {
    expect(shouldHideSubordinateDimension(2)).toBe(true);
    const grouped = groupBallotsWithPooling([
      { relationRole: "SUBORDINATE", calibratedScore: 4.5 },
      { relationRole: "SUBORDINATE", calibratedScore: 2.5 },
      { relationRole: "PEER", calibratedScore: 3.5 },
    ]);
    expect(grouped.subordinatePooled).toBe(true);
    expect(grouped.byRole.SUBORDINATE).toBeUndefined();
    expect(grouped.byRole.PEER?.length).toBe(3);
  });

  it("3 名下属时独立展示", () => {
    expect(shouldHideSubordinateDimension(3)).toBe(false);
  });
});

describe("UAT: 风控熔断优先级", () => {
  it("高分遇 CRITICAL_VETO 封顶 C", () => {
    expect(scoreToGrade(4.6)).toBe("S");
    const { finalGrade, vetoApplied } = applyVetoToGrade("S", ["CRITICAL_VETO"]);
    expect(vetoApplied).toBe(true);
    expect(finalGrade).toBe("C");
  });
});

describe("综合出分烟测", () => {
  it("可产出结果且池化标记正确", () => {
    const result = calculateSubjectResult({
      subjectId: "s1",
      dimensionWeights: {
        STRATEGY_BIZ: 0.5,
        ORG_TALENT: 0.2,
        FORESIGHT_CHANGE: 0.15,
        LEADERSHIP_CULTURE: 0.15,
      },
      roleWeights: {
        STRATEGY_BIZ: { CEO: 0.7, FIN_STRAT: 0.3 },
        ORG_TALENT: { CEO: 0.4, HRD: 0.3, SUBORDINATE: 0.3 },
        FORESIGHT_CHANGE: { CEO: 0.5, PEER: 0.3, BOARD: 0.2 },
        LEADERSHIP_CULTURE: { PEER: 0.4, SUBORDINATE: 0.4, CEO: 0.2 },
      },
      ballots: [
        {
          id: "b1",
          evaluatorBlindToken: "t1",
          relationRole: "CEO",
          scoresPayload: flatScores(4.5),
          rawWeightedScore: 4.5,
        },
        {
          id: "b2",
          evaluatorBlindToken: "t2",
          relationRole: "FIN_STRAT",
          scoresPayload: flatScores(4.0),
          rawWeightedScore: 4.0,
        },
        {
          id: "b3",
          evaluatorBlindToken: "t3",
          relationRole: "HRD",
          scoresPayload: flatScores(3.5),
          rawWeightedScore: 3.5,
        },
        {
          id: "b4",
          evaluatorBlindToken: "t4",
          relationRole: "PEER",
          scoresPayload: flatScores(3.5),
          rawWeightedScore: 3.5,
        },
        {
          id: "b5",
          evaluatorBlindToken: "t5",
          relationRole: "BOARD",
          scoresPayload: flatScores(4.0),
          rawWeightedScore: 4.0,
        },
        {
          id: "b6",
          evaluatorBlindToken: "t6",
          relationRole: "SUBORDINATE",
          scoresPayload: flatScores(4.5),
          rawWeightedScore: 4.5,
        },
        {
          id: "b7",
          evaluatorBlindToken: "t7",
          relationRole: "SUBORDINATE",
          scoresPayload: flatScores(2.5),
          rawWeightedScore: 2.5,
        },
      ],
      vetoSeverities: ["CRITICAL_VETO"],
    });

    expect(result.subordinatePooled).toBe(true);
    expect(result.systemGrade).toMatch(/^[SABCD]$/);
    expect(result.finalGrade).toBe("C");
    expect(result.vetoApplied).toBe(true);
  });
});
