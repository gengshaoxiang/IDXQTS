import { Check, ChevronRight, Plus } from 'lucide-react'
import { useState } from 'react'
import type { DomainTag, HangyuState, StrategicProject } from '../types'

interface ProjectsModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

const STAGES: StrategicProject['stage'][] = [
  '经营战略锚定',
  '组织能力拆解',
  '方案与治理设计',
  '高密汇报打磨',
  '落地跟踪闭环',
]

export function ProjectsModule({ state, updateState }: ProjectsModuleProps) {
  const [activeId, setActiveId] = useState(state.projects[0]?.id ?? '')
  const [newTitle, setNewTitle] = useState('')
  const [newDomain, setNewDomain] = useState<DomainTag>('工作与治理')

  const active = state.projects.find((p) => p.id === activeId) ?? state.projects[0]

  const createProject = () => {
    if (!newTitle.trim()) return
    const id = `p-${Date.now()}`
    const next: StrategicProject = {
      id,
      title: newTitle.trim(),
      domain: newDomain,
      stage: '经营战略锚定',
      progress: 20,
      summary: '坚持从业务真实痛点出发，明确行动步骤、责任人、时间里程碑与可验收交付物。',
      deliverables: [
        { id: `d-${Date.now()}-1`, label: '问题诊断与核心架构大纲', done: false },
        { id: `d-${Date.now()}-2`, label: '高信息密度汇报材料与逐页讲稿', done: false },
      ],
      milestones: ['立项对焦', '中期评审', '正式落地闭环'],
    }
    updateState((prev) => ({ ...prev, projects: [next, ...prev.projects] }))
    setActiveId(id)
    setNewTitle('')
  }

  const toggleDeliverable = (delivId: string) => {
    if (!active) return
    updateState((prev) => ({
      ...prev,
      projects: prev.projects.map((p) => {
        if (p.id !== active.id) return p
        const deliverables = p.deliverables.map((d) =>
          d.id === delivId ? { ...d, done: !d.done } : d
        )
        const doneRatio = Math.round(
          (deliverables.filter((d) => d.done).length / Math.max(1, deliverables.length)) * 100
        )
        return { ...p, deliverables, progress: Math.max(15, doneRatio) }
      }),
    }))
  }

  return (
    <div className="grid min-h-[540px] grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left Project List */}
      <div className="glass-subcard flex flex-col justify-between rounded-3xl p-4 lg:col-span-4">
        <div>
          <div className="mb-3 flex items-center justify-between px-1">
            <span className="text-[13px] font-bold text-[var(--text-primary)]">战略航线舱</span>
            <span className="tabular-nums text-[12px] font-bold text-[var(--accent-primary)]">
              {state.projects.length}
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {state.projects.map((p) => {
              const selected = active?.id === p.id
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setActiveId(p.id)}
                  className={`cursor-pointer rounded-2xl p-3.5 text-left transition ${
                    selected
                      ? 'glass-card ring-2 ring-[var(--accent-primary)]/45'
                      : 'hover:bg-black/4 dark:hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10.5px] text-[var(--text-muted)]">
                    <span>{p.domain}</span>
                    <span className="tabular-nums font-bold text-[var(--accent-primary)]">
                      {p.progress}%
                    </span>
                  </div>
                  <div className="mt-1 line-clamp-2 text-[13px] font-bold text-[var(--text-primary)]">
                    {p.title}
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-[var(--action-teal)]"
                      style={{ width: `${p.progress}%` }}
                    />
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-4 border-t border-[var(--glass-inner-border)] pt-3">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="新项目航线名称..."
            className="glass-card mb-2 w-full rounded-xl px-3 py-2 text-[12px] outline-none"
          />
          <div className="flex gap-2">
            <select
              value={newDomain}
              onChange={(e) => setNewDomain(e.target.value as DomainTag)}
              className="glass-card flex-1 rounded-xl px-2.5 py-1.5 text-[11.5px] outline-none"
            >
              <option value="工作与治理">工作与治理</option>
              <option value="日知与学习">日知与学习</option>
              <option value="生活与家庭">生活与家庭</option>
              <option value="自媒体创作">自媒体创作</option>
            </select>
            <button
              type="button"
              onClick={createProject}
              className="btn-teal flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>立项</span>
            </button>
          </div>
        </div>
      </div>

      {/* Right Strategic Project Detail */}
      <div className="glass-subcard flex flex-col justify-between rounded-3xl p-6 lg:col-span-8">
        {active && (
          <div className="flex flex-col gap-5">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                  {active.domain}
                </span>
                <span className="tabular-nums text-[13px] font-bold text-[var(--action-teal)] dark:text-sky-300">
                  综合推进度 {active.progress}%
                </span>
              </div>
              <h3 className="m-0 mt-2 text-[20px] font-bold text-[var(--text-primary)]">
                {active.title}
              </h3>
              <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--text-secondary)]">
                {active.summary}
              </p>
            </div>

            {/* 5-Stage Strategic Derivation Chain */}
            <div>
              <div className="mb-2 text-[11.5px] font-semibold text-[var(--text-muted)]">
                五级战略反推与落地阶段（点击切换当前阶段）
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                {STAGES.map((st, idx) => {
                  const isCurrent = active.stage === st
                  return (
                    <div key={st} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            projects: prev.projects.map((p) =>
                              p.id === active.id ? { ...p, stage: st } : p
                            ),
                          }))
                        }
                        className={`cursor-pointer rounded-xl px-3 py-1.5 text-[11.5px] font-medium transition ${
                          isCurrent
                            ? 'btn-teal'
                            : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {idx + 1}. {st}
                      </button>
                      {idx < STAGES.length - 1 && (
                        <ChevronRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Deliverables Checklist */}
            <div>
              <div className="mb-2 text-[13px] font-bold text-[var(--text-primary)]">
                关键可验收交付物（PPT 与逐页讲稿分离交付标准）
              </div>
              <div className="flex flex-col gap-2">
                {active.deliverables.map((d) => (
                  <div
                    key={d.id}
                    onClick={() => toggleDeliverable(d.id)}
                    className="glass-card flex cursor-pointer items-center gap-3 rounded-2xl px-4 py-3"
                  >
                    <span
                      className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                        d.done
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-slate-400/60'
                      }`}
                    >
                      {d.done && <Check className="h-3.5 w-3.5" />}
                    </span>
                    <span
                      className={`text-[13px] font-medium ${
                        d.done
                          ? 'text-[var(--text-muted)] line-through'
                          : 'text-[var(--text-primary)]'
                      }`}
                    >
                      {d.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            <div>
              <div className="mb-2 text-[13px] font-bold text-[var(--text-primary)]">
                里程碑航标
              </div>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                {active.milestones.map((ms, i) => (
                  <div key={i} className="glass-card rounded-2xl p-3 text-[12px]">
                    <div className="text-[10px] font-bold text-[var(--accent-primary)]">
                      阶段 M{i + 1}
                    </div>
                    <div className="mt-1 font-medium text-[var(--text-primary)]">{ms}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
