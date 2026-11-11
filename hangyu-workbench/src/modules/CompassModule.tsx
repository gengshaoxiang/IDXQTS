import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { HangyuState } from '../types'

interface CompassModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

export function CompassModule({ state, updateState }: CompassModuleProps) {
  const [tab, setTab] = useState<'人生之轮8维雷达' | '每周三件重点复盘'>('人生之轮8维雷达')
  const [newHighlight, setNewHighlight] = useState('')
  const [newBlocker, setNewBlocker] = useState('')
  const [newDelegation, setNewDelegation] = useState('')

  const scores = state.wheel.map((w) => w.score)
  const avgScore = (scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length)).toFixed(1)
  const spread = Math.max(...scores) - Math.min(...scores)
  const balanceLabel = spread <= 2 ? '高度均衡' : spread <= 3.2 ? '稳健协调' : '存在短板待补齐'
  const lowestDim = [...state.wheel].sort((a, b) => a.score - b.score)[0]

  // SVG Radar geometry
  const cx = 170
  const cy = 165
  const maxR = 112
  const count = state.wheel.length

  const pointAt = (index: number, radiusRatio: number) => {
    const angle = -Math.PI / 2 + (index * 2 * Math.PI) / count
    return {
      x: cx + Math.cos(angle) * maxR * radiusRatio,
      y: cy + Math.sin(angle) * maxR * radiusRatio,
    }
  }

  const polygonPoints = state.wheel
    .map((w, i) => {
      const p = pointAt(i, w.score / 10)
      return `${p.x},${p.y}`
    })
    .join(' ')

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-2xl bg-black/5 p-1 dark:bg-white/5">
          {(['人生之轮8维雷达', '每周三件重点复盘'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-xl px-4 py-2 text-[12.5px] font-semibold transition ${
                tab === t
                  ? 'bg-white text-[var(--text-primary)] shadow-xs dark:bg-slate-800'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <span className="text-[12px] text-[var(--text-muted)]">{state.weeklyReview.weekLabel}</span>
      </div>

      {tab === '人生之轮8维雷达' ? (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Radar Chart */}
          <div className="glass-subcard flex flex-col items-center justify-between rounded-3xl p-5 lg:col-span-6">
            <div className="w-full">
              <div className="text-[11px] text-[var(--text-muted)]">WHEEL OF LIFE</div>
              <h3 className="m-0 mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                人生平衡八维动态雷达
              </h3>
            </div>

            <svg viewBox="0 0 340 330" className="my-2 h-[300px] w-full max-w-[340px]">
              {[0.25, 0.5, 0.75, 1].map((lvl) => (
                <polygon
                  key={lvl}
                  points={state.wheel
                    .map((_, i) => {
                      const p = pointAt(i, lvl)
                      return `${p.x},${p.y}`
                    })
                    .join(' ')}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-400/25"
                />
              ))}

              {state.wheel.map((w, i) => {
                const outer = pointAt(i, 1)
                const labelPos = pointAt(i, 1.2)
                return (
                  <g key={w.id}>
                    <line
                      x1={cx}
                      y1={cy}
                      x2={outer.x}
                      y2={outer.y}
                      stroke="currentColor"
                      strokeWidth="1"
                      className="text-slate-400/25"
                    />
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      className="fill-[var(--text-secondary)] text-[10px] font-semibold"
                    >
                      {w.label.slice(0, 4)}
                    </text>
                  </g>
                )
              })}

              <polygon
                points={polygonPoints}
                fill="var(--accent-primary)"
                fillOpacity="0.24"
                stroke="var(--accent-primary)"
                strokeWidth="2.4"
              />

              {state.wheel.map((w, i) => {
                const pt = pointAt(i, w.score / 10)
                return (
                  <circle
                    key={`pt-${w.id}`}
                    cx={pt.x}
                    cy={pt.y}
                    r="4"
                    fill="var(--glass-surface-strong)"
                    stroke="var(--accent-primary)"
                    strokeWidth="2.2"
                  />
                )
              })}
            </svg>

            <div className="grid w-full grid-cols-2 gap-3">
              <div className="glass-card rounded-2xl p-3.5 text-center">
                <div className="text-[11px] text-[var(--text-muted)]">综合平均分</div>
                <div className="tabular-nums mt-0.5 text-[22px] font-bold text-[var(--accent-primary)]">
                  {avgScore}
                </div>
              </div>
              <div className="glass-card rounded-2xl p-3.5 text-center">
                <div className="text-[11px] text-[var(--text-muted)]">维度均衡态</div>
                <div className="mt-1 text-[15px] font-bold text-emerald-500">{balanceLabel}</div>
              </div>
            </div>

            {lowestDim && (
              <div className="mt-3 w-full rounded-2xl bg-[var(--accent-soft)] px-3.5 py-2.5 text-[11.5px] text-[var(--text-secondary)]">
                航行校准提示：当前相对薄弱项为{' '}
                <strong className="text-[var(--text-primary)]">
                  {lowestDim.label}（{lowestDim.score} 分）
                </strong>
                —— {lowestDim.note}
              </div>
            )}
          </div>

          {/* Sliders */}
          <div className="glass-subcard flex flex-col gap-3 rounded-3xl p-5 lg:col-span-6">
            <div className="text-[14px] font-bold text-[var(--text-primary)]">
              拉动滑块实时自评（1 – 10 分）
            </div>
            {state.wheel.map((dim) => (
              <div key={dim.id} className="glass-card rounded-2xl px-3.5 py-2.5">
                <div className="flex items-center justify-between text-[12.5px]">
                  <span className="font-semibold text-[var(--text-primary)]">{dim.label}</span>
                  <span className="tabular-nums font-bold text-[var(--accent-primary)]">
                    {dim.score.toFixed(1)} 分
                  </span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={0.5}
                  value={dim.score}
                  onChange={(e) => {
                    const val = Number(e.target.value)
                    updateState((prev) => ({
                      ...prev,
                      wheel: prev.wheel.map((w) => (w.id === dim.id ? { ...w, score: val } : w)),
                    }))
                  }}
                  className="my-1.5 w-full accent-[var(--accent-primary)]"
                />
                <div className="text-[11px] text-[var(--text-muted)]">{dim.note}</div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl border border-amber-500/25 bg-amber-500/10 px-4 py-2.5 text-[12px] text-amber-800 dark:text-amber-200">
            复盘法则：每周只抓核心闭环，下周重点严格不超过 3 项，重复性检核全部下沉交代给数字助理。
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Completed Highlights */}
            <div className="glass-subcard rounded-3xl p-5">
              <h4 className="m-0 mb-3 text-[15px] font-bold text-[var(--text-primary)]">
                1. 本周做完了什么
              </h4>
              <ul className="m-0 mb-3 flex list-disc flex-col gap-2 pl-4 text-[12.5px] text-[var(--text-secondary)]">
                {state.weeklyReview.completedHighlights.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  value={newHighlight}
                  onChange={(e) => setNewHighlight(e.target.value)}
                  placeholder="补充本周关键成果..."
                  className="glass-card flex-1 rounded-xl px-3 py-1.5 text-[12px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newHighlight.trim()) return
                    updateState((prev) => ({
                      ...prev,
                      weeklyReview: {
                        ...prev.weeklyReview,
                        completedHighlights: [
                          ...prev.weeklyReview.completedHighlights,
                          newHighlight.trim(),
                        ],
                      },
                    }))
                    setNewHighlight('')
                  }}
                  className="btn-teal cursor-pointer rounded-xl px-3 py-1.5 text-[12px]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Blockers */}
            <div className="glass-subcard rounded-3xl p-5">
              <h4 className="m-0 mb-3 text-[15px] font-bold text-[var(--text-primary)]">
                2. 卡点与待确认事项
              </h4>
              <ul className="m-0 mb-3 flex list-disc flex-col gap-2 pl-4 text-[12.5px] text-[var(--text-secondary)]">
                {state.weeklyReview.blockersAndPending.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  value={newBlocker}
                  onChange={(e) => setNewBlocker(e.target.value)}
                  placeholder="补充待核实卡点..."
                  className="glass-card flex-1 rounded-xl px-3 py-1.5 text-[12px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newBlocker.trim()) return
                    updateState((prev) => ({
                      ...prev,
                      weeklyReview: {
                        ...prev.weeklyReview,
                        blockersAndPending: [
                          ...prev.weeklyReview.blockersAndPending,
                          newBlocker.trim(),
                        ],
                      },
                    }))
                    setNewBlocker('')
                  }}
                  className="btn-teal cursor-pointer rounded-xl px-3 py-1.5 text-[12px]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Next Week Top 3 */}
            <div className="glass-subcard rounded-3xl p-5">
              <h4 className="m-0 mb-3 text-[15px] font-bold text-[var(--text-primary)]">
                3. 下周重点（严格不超过 3 项）
              </h4>
              <div className="flex flex-col gap-2.5">
                {state.weeklyReview.nextWeekTopThree.map((val, idx) => (
                  <div key={idx} className="flex items-center gap-2.5">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[var(--action-teal)] text-[11.5px] font-bold text-white">
                      {idx + 1}
                    </span>
                    <input
                      value={val}
                      onChange={(e) => {
                        const updated = [...state.weeklyReview.nextWeekTopThree] as [
                          string,
                          string,
                          string,
                        ]
                        updated[idx] = e.target.value
                        updateState((prev) => ({
                          ...prev,
                          weeklyReview: { ...prev.weeklyReview, nextWeekTopThree: updated },
                        }))
                      }}
                      className="glass-card flex-1 rounded-xl px-3 py-2 text-[12.5px] text-[var(--text-primary)] outline-none"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Assistant Delegations */}
            <div className="glass-subcard rounded-3xl p-5">
              <h4 className="m-0 mb-3 text-[15px] font-bold text-[var(--text-primary)]">
                4. 交代给数字助理的自动化事项
              </h4>
              <ul className="m-0 mb-3 flex list-disc flex-col gap-2 pl-4 text-[12.5px] text-[var(--text-secondary)]">
                {state.weeklyReview.assistantDelegations.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
              <div className="flex gap-2">
                <input
                  value={newDelegation}
                  onChange={(e) => setNewDelegation(e.target.value)}
                  placeholder="新增定时或核验指令..."
                  className="glass-card flex-1 rounded-xl px-3 py-1.5 text-[12px] outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newDelegation.trim()) return
                    updateState((prev) => ({
                      ...prev,
                      weeklyReview: {
                        ...prev.weeklyReview,
                        assistantDelegations: [
                          ...prev.weeklyReview.assistantDelegations,
                          newDelegation.trim(),
                        ],
                      },
                    }))
                    setNewDelegation('')
                  }}
                  className="btn-teal cursor-pointer rounded-xl px-3 py-1.5 text-[12px]"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
