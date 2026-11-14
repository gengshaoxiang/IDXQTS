/** 四大正向评价维度与二级评估项（文档 3.1） */

export const DIMENSIONS = [
  {
    code: "STRATEGY_BIZ",
    name: "战略解码与经营业绩",
    items: [
      { code: "KPI_ACHIEVEMENT", name: "核心经营指标达成" },
      { code: "STRATEGIC_CAMPAIGN", name: "战略战役落地" },
      { code: "OPERATING_EFFICIENCY", name: "人效与运营效率" },
    ],
  },
  {
    code: "ORG_TALENT",
    name: "组织建设与人才梯队",
    items: [
      { code: "SUCCESSION_DEPTH", name: "梯队厚度与继任者计划" },
      { code: "TEAM_RETENTION", name: "团队凝聚力与核心保留" },
      { code: "SOP_DIGITAL", name: "机制沉淀与数智化赋能" },
    ],
  },
  {
    code: "FORESIGHT_CHANGE",
    name: "战略视野与变革敏捷度",
    items: [
      { code: "MARKET_INSIGHT", name: "市场洞察与决策质量" },
      { code: "CHANGE_DRIVE", name: "变革推动力" },
      { code: "LOCAL_ADAPT", name: "全局观与本土适配" },
    ],
  },
  {
    code: "LEADERSHIP_CULTURE",
    name: "领导力风范与文化价值观",
    items: [
      { code: "ACCOUNTABILITY", name: "担当与主人翁精神" },
      { code: "FAIRNESS", name: "公正性与用人导向" },
      { code: "OPENNESS", name: "开放度与自我迭代" },
    ],
  },
] as const;

export type DimensionCode = (typeof DIMENSIONS)[number]["code"];
export type ItemCode = (typeof DIMENSIONS)[number]["items"][number]["code"];

export const ALL_ITEM_CODES = DIMENSIONS.flatMap((d) =>
  d.items.map((i) => i.code),
);

export const SCORE_MIN = 1.0;
export const SCORE_MAX = 5.0;
export const SCORE_STEP = 0.5;
export const EXTREME_HIGH = 4.5;
export const EXTREME_LOW = 2.5;
export const STAR_MIN_CHARS = 50;

export const MU_GLOBAL = 3.8;
export const SIGMA_GLOBAL = 0.45;
export const ZSCORE_MIN_N = 3;
export const ZSCORE_MIN_SIGMA = 0.15;
export const SUBORDINATE_POOL_THRESHOLD = 3;

export const ROLE_LABELS: Record<string, string> = {
  CEO: "总裁/CEO",
  FIN_STRAT: "财务/战略复核",
  HRD: "HRD",
  PEER: "平级高管",
  SUBORDINATE: "核心下属",
  BOARD: "董事会/外部视角",
};

export const GRADE_RULES = [
  { grade: "S", min: 4.4, label: "卓越", share: "前 10%" },
  { grade: "A", min: 4.0, label: "优秀", share: "约 25%" },
  { grade: "B", min: 3.4, label: "称职", share: "约 50%" },
  { grade: "C", min: 2.8, label: "待改进", share: "约 10%" },
  { grade: "D", min: 0, label: "不胜任", share: "约 5%" },
] as const;
