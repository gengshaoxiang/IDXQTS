"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ROLE_LABELS } from "@/lib/dimensions";

type Task = {
  relationId: string;
  subjectId: string;
  subjectName: string;
  positionTitle: string;
  departmentName: string;
  relationRole: string;
  taskStatus: string;
  biSnapshotSummary: Record<string, string> | null;
};

export default function TasksPage() {
  const [cycleName, setCycleName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/v1/evaluations/tasks")
      .then(async (r) => {
        const j = await r.json();
        if (!r.ok) throw new Error(j.message ?? "加载失败");
        setCycleName(j.data.cycleName);
        setDeadline(j.data.deadline);
        setTasks(j.data.tasks);
      })
      .catch((e) => setError(e.message));
  }, []);

  if (error) {
    return (
      <p className="rounded-md bg-amber-50 px-4 py-3 text-amber-900">
        {error}（请先在右上角选择演示身份）
      </p>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-4xl text-ink">我的评价待办</h1>
        <p className="mt-2 text-ink-soft">
          {cycleName}
          {deadline ? ` · 截止 ${new Date(deadline).toLocaleString("zh-CN", { timeZone: "Africa/Dar_es_Salaam" })}（东非时间）` : ""}
        </p>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 && (
          <p className="text-ink-soft">当前身份暂无待办评价任务。</p>
        )}
        {tasks.map((t) => (
          <div
            key={t.relationId}
            className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[var(--line)] bg-white/55 px-5 py-4"
          >
            <div>
              <p className="text-lg font-semibold">{t.subjectName}</p>
              <p className="text-sm text-ink-soft">
                {t.positionTitle} · {ROLE_LABELS[t.relationRole] ?? t.relationRole}
              </p>
              {t.biSnapshotSummary && (
                <p className="mt-1 text-xs text-sea">
                  营收达成 {t.biSnapshotSummary.revenueAchievementRate} · 净利{" "}
                  {t.biSnapshotSummary.netProfitAchievementRate}
                </p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span
                className={
                  t.taskStatus === "COMPLETED"
                    ? "text-sm text-sea"
                    : "text-sm text-copper"
                }
              >
                {t.taskStatus === "COMPLETED" ? "已提交" : "待评价"}
              </span>
              {t.taskStatus === "PENDING" ? (
                <Link
                  href={`/tasks/${t.relationId}`}
                  className="rounded-md bg-sea px-4 py-2 text-sm text-white hover:bg-sea-deep"
                >
                  开始评价
                </Link>
              ) : (
                <Link
                  href={`/reports/${t.subjectId}`}
                  className="rounded-md border border-[var(--line)] px-4 py-2 text-sm hover:bg-black/5"
                >
                  查看报告
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
