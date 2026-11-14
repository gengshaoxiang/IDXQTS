"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { RadarChart } from "@/components/RadarChart";
import { ROLE_LABELS } from "@/lib/dimensions";

type Report = {
  subject: {
    userName: string;
    positionTitle: string;
    departmentName: string;
    biKpiSnapshot: Record<string, string> | null;
  };
  result: {
    computedTotalScore: number;
    systemGrade: string;
    finalGrade: string;
    vetoApplied: boolean;
    dimensionScores: Record<string, number>;
  } | null;
  anonymity: {
    subordinateCount: number;
    subordinatePooled: boolean;
    hideSubordinateDimension: boolean;
  };
  roleAverages: Record<string, number>;
  vetoes: Array<{
    severityLevel: string;
    incidentCategory: string;
    evidenceRefNo: string;
    incidentSummary: string;
  }>;
};

export default function ReportPage() {
  const params = useParams<{ subjectId: string }>();
  const [data, setData] = useState<Report | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/v1/reports/${params.subjectId}`)
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        setData(j.data);
      })
      .catch((e) => setError(e.message));
  }, [params.subjectId]);

  if (error) return <p className="text-red-700">{error}</p>;
  if (!data) return <p className="text-ink-soft">加载中…</p>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">{data.subject.userName}</h1>
        <p className="mt-1 text-ink-soft">
          {data.subject.positionTitle} · {data.subject.departmentName}
        </p>
      </div>

      {data.result ? (
        <div className="grid gap-6 md:grid-cols-2">
          <div className="rounded-xl border border-[var(--line)] bg-white/55 p-5">
            <p className="text-sm text-ink-soft">综合得分 / 最终等级</p>
            <p className="mt-2 font-display text-5xl">
              {data.result.computedTotalScore.toFixed(2)}
              <span className="ml-3 text-3xl text-sea">{data.result.finalGrade}</span>
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              系统初评 {data.result.systemGrade}
              {data.result.vetoApplied ? " · 已应用风控熔断" : ""}
            </p>
            {data.anonymity.hideSubordinateDimension && (
              <p className="mt-4 rounded-md bg-copper/10 px-3 py-2 text-sm text-copper">
                下属有效提交 {data.anonymity.subordinateCount} 份（&lt;3），已隐藏「下属维度」独立栏位，并入平级/关联方池。
              </p>
            )}
          </div>
          <div className="rounded-xl border border-[var(--line)] bg-white/55 p-2">
            <RadarChart dimensionScores={data.result.dimensionScores} />
          </div>
        </div>
      ) : (
        <p className="text-ink-soft">尚未出分，请 HRD 在周期管理中触发校准计算。</p>
      )}

      <section>
        <h2 className="font-display text-2xl">角色池得分（脱敏）</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          {Object.entries(data.roleAverages).map(([role, score]) => {
            if (role === "SUBORDINATE" && data.anonymity.hideSubordinateDimension) {
              return null;
            }
            return (
              <div
                key={role}
                className="rounded-lg border border-[var(--line)] bg-white/50 px-4 py-3"
              >
                <p className="text-xs text-ink-soft">
                  {ROLE_LABELS[role] ?? role}
                </p>
                <p className="text-xl font-semibold tabular-nums">{score.toFixed(2)}</p>
              </div>
            );
          })}
        </div>
      </section>

      {data.vetoes.length > 0 && (
        <section>
          <h2 className="font-display text-2xl text-copper">风控记录</h2>
          <ul className="mt-3 space-y-2">
            {data.vetoes.map((v, i) => (
              <li
                key={i}
                className="rounded-lg border border-copper/30 bg-copper/5 px-4 py-3 text-sm"
              >
                <strong>{v.severityLevel}</strong> · {v.incidentCategory} ·{" "}
                {v.evidenceRefNo}
                <p className="mt-1 text-ink-soft">{v.incidentSummary}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
