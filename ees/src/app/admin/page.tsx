"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Cycle = {
  id: string;
  cycleName: string;
  cycleYear: number;
  status: string;
  endTime: string;
  counts: { subjects: number; relations: number; ballots: number };
};

export default function AdminPage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    const r = await fetch("/api/v1/admin/cycles");
    const j = await r.json();
    if (!r.ok) {
      setError(j.message);
      return;
    }
    setCycles(j.data);
  }

  useEffect(() => {
    load();
  }, []);

  async function calculate(cycleId: string) {
    setMessage(null);
    setError(null);
    const r = await fetch(`/api/v1/admin/cycles/${cycleId}/calculate`, {
      method: "POST",
    });
    const j = await r.json();
    if (!r.ok) {
      setError(j.message ?? "计算失败");
      return;
    }
    setMessage(
      `出分完成：${j.data.results.length} 人。示例：` +
        j.data.results
          .map(
            (x: { userName: string; computedTotalScore: number; finalGrade: string }) =>
              `${x.userName} ${x.computedTotalScore}/${x.finalGrade}`,
          )
          .join("；"),
    );
    await load();
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl">评价周期管理</h1>
        <p className="mt-2 text-ink-soft">
          HRD / 超管可触发 Z-Score 校准与全量出分（文档 API 6.4）。
        </p>
      </div>

      {error && <p className="text-red-700">{error}</p>}
      {message && <p className="rounded-md bg-sea/10 px-4 py-3 text-sm text-sea-deep">{message}</p>}

      <div className="space-y-3">
        {cycles.map((c) => (
          <div
            key={c.id}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white/55 px-5 py-4"
          >
            <div>
              <p className="text-lg font-semibold">{c.cycleName}</p>
              <p className="text-sm text-ink-soft">
                {c.status} · 对象 {c.counts.subjects} · 任务 {c.counts.relations} ·
                选票 {c.counts.ballots}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => calculate(c.id)}
                className="rounded-md bg-sea px-4 py-2 text-sm text-white hover:bg-sea-deep"
              >
                触发出分计算
              </button>
              <Link
                href="/calibration"
                className="rounded-md border border-[var(--line)] px-4 py-2 text-sm hover:bg-black/5"
              >
                查看校准看板
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
