"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Row = {
  subjectId: string;
  userName: string;
  positionTitle: string;
  score: number;
  systemGrade: string;
  finalGrade: string;
  vetoApplied: boolean;
  subordinatePooled: boolean;
};

export default function CalibrationPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [distribution, setDistribution] = useState<Record<string, number>>({});
  const [cycleName, setCycleName] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/calibration")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message);
        setRows(j.data.nineBox);
        setDistribution(j.data.distribution);
        setCycleName(j.data.cycle.cycleName);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p className="rounded-md bg-amber-50 px-4 py-3 text-amber-900">
        {error}（需 HRD / CEO / 审计 / 管理员身份）
      </p>
    );
  }

  const maxCount = Math.max(1, ...Object.values(distribution));

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">校准委员会看板</h1>
        <p className="mt-2 text-ink-soft">{cycleName} · 九宫格/等级分布</p>
      </div>

      <section>
        <h2 className="mb-3 text-sm font-medium text-ink-soft">等级分布</h2>
        <div className="flex h-40 items-end gap-3">
          {["S", "A", "B", "C", "D"].map((g) => {
            const n = distribution[g] ?? 0;
            const h = `${Math.max(8, (n / maxCount) * 100)}%`;
            return (
              <div key={g} className="flex flex-1 flex-col items-center gap-2">
                <div
                  className="w-full rounded-t-md bg-sea/80 transition-all"
                  style={{ height: h }}
                  title={`${g}: ${n}`}
                />
                <span className="text-sm font-semibold">{g}</span>
                <span className="text-xs text-ink-soft">{n}</span>
              </div>
            );
          })}
        </div>
      </section>

      <div className="overflow-x-auto rounded-xl border border-[var(--line)] bg-white/55">
        <table className="min-w-full text-left text-sm">
          <thead className="border-b border-[var(--line)] text-ink-soft">
            <tr>
              <th className="px-4 py-3 font-medium">高管</th>
              <th className="px-4 py-3 font-medium">岗位</th>
              <th className="px-4 py-3 font-medium">得分</th>
              <th className="px-4 py-3 font-medium">系统/最终</th>
              <th className="px-4 py-3 font-medium">标记</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.subjectId} className="border-b border-[var(--line)]/70">
                <td className="px-4 py-3">
                  <Link className="text-sea hover:underline" href={`/reports/${r.subjectId}`}>
                    {r.userName}
                  </Link>
                </td>
                <td className="px-4 py-3 text-ink-soft">{r.positionTitle}</td>
                <td className="px-4 py-3 tabular-nums">{r.score.toFixed(2)}</td>
                <td className="px-4 py-3">
                  {r.systemGrade} → <strong>{r.finalGrade}</strong>
                </td>
                <td className="px-4 py-3 text-xs text-ink-soft">
                  {r.vetoApplied ? "风控熔断 " : ""}
                  {r.subordinatePooled ? "下属池化" : ""}
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-ink-soft">
                  暂无结果，请先在「周期管理」触发出分计算。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
