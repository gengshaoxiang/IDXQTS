"use client";

import { useEffect, useState } from "react";

type Subject = { id: string; userName: string; positionTitle: string };
type Cycle = { id: string; cycleName: string };

export default function CompliancePage() {
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [cycleId, setCycleId] = useState("");
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [subjectId, setSubjectId] = useState("");
  const [severityLevel, setSeverityLevel] = useState("CRITICAL_VETO");
  const [incidentCategory, setIncidentCategory] = useState("FINANCE_AUDIT");
  const [incidentSummary, setIncidentSummary] = useState("");
  const [evidenceRefNo, setEvidenceRefNo] = useState("");
  const [approvedBy, setApprovedBy] = useState("U_HRD");
  const [message, setMessage] = useState<string | null>(null);
  const [vetoes, setVetoes] = useState<
    Array<{
      id: string;
      severityLevel: string;
      evidenceRefNo: string;
      subject: { userName: string };
    }>
  >([]);

  useEffect(() => {
    fetch("/api/v1/admin/cycles")
      .then((r) => r.json())
      .then((j) => {
        setCycles(j.data ?? []);
        if (j.data?.[0]) setCycleId(j.data[0].id);
      });
    fetch("/api/v1/compliance/vetoes")
      .then((r) => r.json())
      .then((j) => setVetoes(j.data ?? []));
  }, []);

  useEffect(() => {
    if (!cycleId) return;
    // 通过校准接口拿 subjects（若无权则用报告列表降级：种子固定）
    fetch(`/api/v1/calibration?cycleId=${cycleId}`)
      .then(async (r) => {
        if (!r.ok) {
          // fallback: seed subjects via calculate page not available — hardcode from tasks won't work
          setSubjects([]);
          return;
        }
        const j = await r.json();
        const rows = (j.data.nineBox ?? []).map(
          (x: { subjectId: string; userName: string; positionTitle: string }) => ({
            id: x.subjectId,
            userName: x.userName,
            positionTitle: x.positionTitle,
          }),
        );
        if (rows.length) {
          setSubjects(rows);
          setSubjectId(rows[0].id);
        } else {
          // 尚未出分时，从周期 subjects API 不存在——用 seed 后 calculate 前的途径
          const calcHint = await fetch("/api/v1/evaluations/tasks");
          // 额外：直接查一个轻量 subjects 列表
          void calcHint;
        }
      });
  }, [cycleId]);

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
        approvedBy,
      }),
    });
    const j = await res.json();
    if (!res.ok) {
      setMessage(j.message ?? "提交失败");
      return;
    }
    setMessage("风控熔断已录入并触发重算");
    const list = await fetch("/api/v1/compliance/vetoes").then((r) => r.json());
    setVetoes(list.data ?? []);
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-4xl">审计风控熔断</h1>
        <p className="mt-2 text-ink-soft">
          仅 ROLE_AUDIT_OFFICER 可录入；需双人复核（核准人 ≠ 提报人）。
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
          核准人（双人复核）
          <input
            className="mt-1 w-full rounded-md border border-[var(--line)] bg-white/80 px-3 py-2"
            value={approvedBy}
            onChange={(e) => setApprovedBy(e.target.value)}
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
          录入并熔断
        </button>
        {message && <p className="text-sm text-sea">{message}</p>}
      </div>

      <section>
        <h2 className="font-display text-2xl">已录入记录</h2>
        <ul className="mt-3 space-y-2">
          {vetoes.map((v) => (
            <li
              key={v.id}
              className="rounded-lg border border-[var(--line)] bg-white/50 px-4 py-3 text-sm"
            >
              {v.subject.userName} · {v.severityLevel} · {v.evidenceRefNo}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
