"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; userName: string; positionTitle: string };
type Cycle = { id: string; cycleName: string };
type Veto = {
  id: string;
  severityLevel: string;
  evidenceRefNo: string;
  isActive: boolean;
  reportedBy: string;
  approvedBy: string | null;
  subject: { userName: string };
};

export default function CompliancePage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [severityLevel, setSeverityLevel] = useState("CRITICAL_VETO");
  const [incidentCategory, setIncidentCategory] = useState("FINANCE_AUDIT");
  const [incidentSummary, setIncidentSummary] = useState("");
  const [evidenceRefNo, setEvidenceRefNo] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [vetoes, setVetoes] = useState<Veto[]>([]);
  const [meId, setMeId] = useState<string | null>(null);

  async function loadVetoes() {
    const list = await fetch("/api/v1/compliance/vetoes").then((r) => r.json());
    setVetoes(list.data ?? []);
  }

  useEffect(() => {
    fetch("/api/v1/session", { method: "POST" })
      .then((r) => r.json())
      .then((j) => setMeId(j.data?.user?.id ?? null));
    fetch("/api/v1/admin/cycles")
      .then((r) => r.json())
      .then((j) => {
        setCycles(j.data ?? []);
        if (j.data?.[0]) setCycleId(j.data[0].id);
      });
    loadVetoes();
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    fetch(`/api/v1/admin/cycles/${cycleId}/subjects`)
      .then(async (r) => {
        if (!r.ok) return;
        const j = await r.json();
        setSubjects(j.data ?? []);
        if (j.data?.[0]) setSubjectId(j.data[0].id);
      })
      .catch(() => undefined);
  }, [cycleId]);

  async function submit() {
    setMessage(null);
    const res = await fetch("/api/v1/compliance/vetoes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cycleId,
        subjectId,
        severityLevel,
        incidentCategory,
        incidentSummary,
        evidenceRefNo,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.message ?? "提交失败");
      return;
    }
    setMessage("已提交待复核：需另一 Cursor 登录用户核准后生效");
    await loadVetoes();
  }

  async function approve(id: string) {
    setMessage(null);
    const res = await fetch(`/api/v1/compliance/vetoes/${id}/approve`, {
      method: "POST",
    });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.message ?? "核准失败");
      return;
    }
    setMessage("已核准并触发重算");
    await loadVetoes();
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">审计风控熔断</h1>
        <p className="mt-2 text-ink-soft">
          提报后为待复核状态；必须由另一已登录用户核准，提报人不可自批。
        </p>
      </div>

      <div className="grid max-w-xl gap-3 rounded-xl border border-[var(--line)] bg-white/55 p-5">
        <label className="text-sm">
          评价周期
          <select
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={cycleId}
            onChange={(e) => setCycleId(e.target.value)}
          >
            {cycles.map((c) => (
              <option key={c.id} value={c.id}>
                {c.cycleName}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          被评价高管
          <select
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={subjectId}
            onChange={(e) => setSubjectId(e.target.value)}
          >
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.userName} · {s.positionTitle}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          严重级别
          <select
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={severityLevel}
            onChange={(e) => setSeverityLevel(e.target.value)}
          >
            <option value="MINOR_DOWNGRADE">一般违规（降一档）</option>
            <option value="CRITICAL_VETO">重大红线（封顶 C）</option>
          </select>
        </label>
        <label className="text-sm">
          类别
          <select
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={incidentCategory}
            onChange={(e) => setIncidentCategory(e.target.value)}
          >
            <option value="FINANCE_AUDIT">财务审计</option>
            <option value="INFO_SEC">信息安全</option>
            <option value="EHS_QUALITY">EHS/质量</option>
            <option value="LEGAL_TAX">法务税务</option>
          </select>
        </label>
        <label className="text-sm">
          案件编号
          <input
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={evidenceRefNo}
            onChange={(e) => setEvidenceRefNo(e.target.value)}
            placeholder="AUD-2026-001"
          />
        </label>
        <label className="text-sm">
          事件摘要
          <textarea
            className="mt-1 min-h-[90px] w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={incidentSummary}
            onChange={(e) => setIncidentSummary(e.target.value)}
          />
        </label>
        <button
          type="button"
          onClick={submit}
          className="rounded-md bg-copper px-4 py-2.5 text-white hover:opacity-90"
        >
          提报（待复核）
        </button>
        {message && <p className="text-sm text-sea">{message}</p>}
      </div>

      <section>
        <h2 className="font-display text-2xl">风控记录</h2>
        <ul className="mt-3 space-y-2">
          {vetoes.map((v) => (
            <li
              key={v.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[var(--line)] bg-white/50 px-4 py-3 text-sm"
            >
              <div>
                {v.subject.userName} · {v.severityLevel} · {v.evidenceRefNo}
                <p className="text-ink-soft">
                  {v.isActive ? "已生效" : "待复核"}
                  {v.approvedBy ? ` · 核准人已确认` : ""}
                </p>
              </div>
              {!v.isActive && meId && v.reportedBy !== meId && (
                <button
                  type="button"
                  onClick={() => approve(v.id)}
                  className="rounded-md bg-sea px-3 py-1.5 text-white"
                >
                  核准生效
                </button>
              )}
              {!v.isActive && meId && v.reportedBy === meId && (
                <span className="text-xs text-copper">需其他登录用户核准</span>
              )}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
