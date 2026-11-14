"use client";

import ReactECharts from "echarts-for-react";

const LABELS: Record<string, string> = {
  STRATEGY_BIZ: "战略与业绩",
  ORG_TALENT: "组织与梯队",
  FORESIGHT_CHANGE: "视野与变革",
  LEADERSHIP_CULTURE: "领导力与文化",
};

export function RadarChart({
  dimensionScores,
}: {
  dimensionScores: Record<string, number>;
}) {
  const keys = Object.keys(LABELS);
  const option = {
    color: ["#0f6b6d"],
    radar: {
      indicator: keys.map((k) => ({ name: LABELS[k], max: 5 })),
      splitArea: {
        areaStyle: {
          color: ["rgba(15,107,109,0.02)", "rgba(15,107,109,0.06)"],
        },
      },
      axisName: { color: "#3a4a58", fontSize: 12 },
    },
    series: [
      {
        type: "radar",
        data: [
          {
            value: keys.map((k) => Number((dimensionScores[k] ?? 0).toFixed(2))),
            name: "维度得分",
            areaStyle: { color: "rgba(15,107,109,0.22)" },
            lineStyle: { width: 2 },
          },
        ],
      },
    ],
  };

  return (
    <ReactECharts option={option} style={{ height: 320, width: "100%" }} />
  );
}
