"use client";

import { useMemo, useState } from "react";
import {
  DIMENSIONS,
  EXTREME_HIGH,
  EXTREME_LOW,
  STAR_MIN_CHARS,
} from "@/lib/dimensions";
import { isExtremeScore } from "@/lib/scoring/star-validation";

type ScoreState = {
  score: number;
  situation_task: string;
  action: string;
  result: string;
};

function emptyScores(): Record<string, ScoreState> {
  const map: Record<string, ScoreState> = {};
  for (const dim of DIMENSIONS) {
    for (const item of dim.items) {
      map[item.code] = {
        score: 3.5,
        situation_task: "",
        action: "",
        result: "",
      };
    }
  }
  return map;
}

export function BallotForm({
  relationId,
  subjectName,
  positionTitle,
  onDone,
}: {
  relationId: string;
  subjectName: string;
  positionTitle: string;
  onDone: () => void;
}) {
  const [scores, setScores] = useState(emptyScores);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const blocked = useMemo(() => {
    for (const [code, s] of Object.entries(scores)) {
      if (!isExtremeScore(s.score)) continue;
      const len =
        s.situation_task.trim().length +
        s.action.trim().length +
        s.result.trim().length;
      if (
        !s.situation_task.trim() ||
        !s.action.trim() ||
        !s.result.trim() ||
        len < STAR_MIN_CHARS
      ) {
        return code;
      }
    }
    return null;
  }, [scores]);

  async function submit() {
    setSubmitting(true);
    setError(null);
    const payload = DIMENSIONS.flatMap((dim) =>
      dim.items.map((item) => {
        const s = scores[item.code]!;
        const entry: {
          dimension_code: string;
          item_code: string;
          score: number;
          star_evidence?: {
            situation_task: string;
            action: string;
            result: string;
          };
        } = {
          dimension_code: dim.code,
          item_code: item.code,
          score: s.score,
        };
        if (isExtremeScore(s.score)) {
          entry.star_evidence = {
            situation_task: s.situation_task,
            action: s.action,
            result: s.result,
          };
        }
        return entry;
      }),
    );

    const res = await fetch("/api/v1/evaluations/ballots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ relationId, scores: payload }),
    });
    const json = await res.json();
    setSubmitting(false);
    if (!res.ok) {
      setError(json.message ?? "提交失败");
      return;
    }
    onDone();
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-3xl text-ink">{subjectName}</h2>
        <p className="mt-1 text-ink-soft">{positionTitle}</p>
        <p className="mt-3 text-sm text-ink-soft">
          评分范围 1.0–5.0（步长 0.5）。当单项 ≥{EXTREME_HIGH} 或 ≤{EXTREME_LOW}{" "}
          时须填写 STAR 举证（合计 ≥{STAR_MIN_CHARS} 字）。
        </p>
      </div>

      {DIMENSIONS.map((dim) => (
        <section
          key={dim.code}
          className="rounded-xl border border-[var(--line)] bg-white/55 p-5 shadow-[0_10px_40px_-28px_rgba(18,32,44,0.45)]"
        >
          <h3 className="text-lg font-semibold text-sea-deep">{dim.name}</h3>
          <div className="mt-4 space-y-5">
            {dim.items.map((item) => {
              const s = scores[item.code]!;
              const extreme = isExtremeScore(s.score);
              const chars =
                s.situation_task.trim().length +
                s.action.trim().length +
                s.result.trim().length;
              return (
                <div key={item.code} className="border-t border-[var(--line)] pt-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <label className="font-medium" htmlFor={item.code}>
                      {item.name}
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        id={item.code}
                        type="range"
                        min={1}
                        max={5}
                        step={0.5}
                        value={s.score}
                        onChange={(e) =>
                          setScores((prev) => ({
                            ...prev,
                            [item.code]: {
                              ...prev[item.code]!,
                              score: Number(e.target.value),
                            },
                          }))
                        }
                        className="w-40 accent-sea"
                      />
                      <span className="w-10 text-right font-semibold tabular-nums">
                        {s.score.toFixed(1)}
                      </span>
                    </div>
                  </div>
                  {extreme && (
                    <div className="mt-3 grid gap-2 rounded-lg bg-[rgba(181,106,60,0.08)] p-3">
                      <p className="text-xs font-medium text-copper">
                        极端分数强制举证 · STAR（已填 {chars}/{STAR_MIN_CHARS}）
                      </p>
                      {(
                        [
                          ["situation_task", "Situation / Task"],
                          ["action", "Action"],
                          ["result", "Result"],
                        ] as const
                      ).map(([key, label]) => (
                        <textarea
                          key={key}
                          placeholder={label}
                          value={s[key]}
                          onChange={(e) =>
                            setScores((prev) => ({
                              ...prev,
                              [item.code]: {
                                ...prev[item.code]!,
                                [key]: e.target.value,
                              },
                            }))
                          }
                          className="min-h-[64px] w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sea/25"
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      {error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <button
        type="button"
        disabled={!!blocked || submitting}
        onClick={submit}
        className="rounded-md bg-sea px-5 py-2.5 text-white transition enabled:hover:bg-sea-deep disabled:cursor-not-allowed disabled:opacity-45"
      >
        {submitting
          ? "提交中…"
          : blocked
            ? "请先完成极端分数 STAR 举证"
            : "提交评价"}
      </button>
    </div>
  );
}
