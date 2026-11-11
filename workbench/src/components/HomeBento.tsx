import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  GripHorizontal,
  Minus,
  Plus,
} from 'lucide-react'
import { useState } from 'react'
import { CITY_WEATHER_PRESETS } from '../data/seedData'
import type {
  BentoCardId,
  DomainTag,
  HangyuState,
  ModuleId,
  PriorityLevel,
} from '../types'

interface HomeBentoProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
  onOpenModule: (moduleId: ModuleId) => void
  lastSavedAt: string
}

function parseQuickTodoInput(raw: string): {
  title: string
  domain: DomainTag
  priority: PriorityLevel
  dueText: string
} {
  let text = raw.trim()
  let domain: DomainTag = '工作与治理'
  let priority: PriorityLevel = '中'
  let dueText = '今天 待安排'

  if (text.includes('#学习') || text.includes('#日知')) {
    domain = '日知与学习'
    text = text.replace(/#(学习|日知)/g, '').trim()
  } else if (text.includes('#生活') || text.includes('#家庭')) {
    domain = '生活与家庭'
    text = text.replace(/#(生活|家庭)/g, '').trim()
  } else if (text.includes('#自媒体') || text.includes('#写作')) {
    domain = '自媒体创作'
    text = text.replace(/#(自媒体|写作)/g, '').trim()
  } else if (text.includes('#工作') || text.includes('#战略')) {
    domain = '工作与治理'
    text = text.replace(/#(工作|战略)/g, '').trim()
  }

  if (text.includes('!高') || text.includes('！高')) {
    priority = '高'
    text = text.replace(/[!！]高/g, '').trim()
  } else if (text.includes('!低') || text.includes('！低')) {
    priority = '低'
    text = text.replace(/[!！]低/g, '').trim()
  }

  if (text.includes('明天')) dueText = '明天'
  else if (text.includes('周五')) dueText = '周五'
  else if (text.includes('周末')) dueText = '周末'

  return { title: text || raw.trim(), domain, priority, dueText }
}

export function HomeBento({ state, updateState, onOpenModule, lastSavedAt }: HomeBentoProps) {
  const [quickTodo, setQuickTodo] = useState('')
  const [selectedDay, setSelectedDay] = useState(11)
  const [quickScratch, setQuickScratch] = useState('')

  const visibleCards = state.bentoCards.filter((c) => c.visible)
  const cityPreset = CITY_WEATHER_PRESETS[state.settings.activeCity]

  const moveCard = (id: BentoCardId, dir: -1 | 1) => {
    updateState((prev) => {
      const idx = prev.bentoCards.findIndex((c) => c.id === id)
      const target = idx + dir
      if (idx < 0 || target < 0 || target >= prev.bentoCards.length) return prev
      const next = [...prev.bentoCards]
      const [item] = next.splice(idx, 1)
      next.splice(target, 0, item)
      return { ...prev, bentoCards: next }
    })
  }

  const resizeCard = (id: BentoCardId, delta: -1 | 1) => {
    const spans: (4 | 6 | 8 | 12)[] = [4, 6, 8, 12]
    updateState((prev) => ({
      ...prev,
      bentoCards: prev.bentoCards.map((c) => {
        if (c.id !== id) return c
        const nextIdx = Math.min(
          spans.length - 1,
          Math.max(0, spans.indexOf(c.colSpan) + delta)
        )
        return { ...c, colSpan: spans[nextIdx] }
      }),
    }))
  }

  const cycleCity = () => {
    const cities: HangyuState['settings']['activeCity'][] = [
      '雅加达',
      '达累斯萨拉姆',
      '北京',
      '圣保罗',
      '常州',
    ]
    const next = cities[(cities.indexOf(state.settings.activeCity) + 1) % cities.length]
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, activeCity: next },
    }))
  }

  const handleAddQuickTodo = () => {
    if (!quickTodo.trim()) return
    const parsed = parseQuickTodoInput(quickTodo)
    updateState((prev) => ({
      ...prev,
      todos: [
        {
          id: `t-${Date.now()}`,
          title: parsed.title,
          domain: parsed.domain,
          priority: parsed.priority,
          dueText: parsed.dueText,
          repeat: '不重复',
          tags: [parsed.domain.slice(0, 2)],
          completed: false,
          quadrant: parsed.priority === '高' ? 'q1' : 'q2',
          createdAt: '2026-11-11',
        },
        ...prev.todos,
      ],
    }))
    setQuickTodo('')
  }

  const toggleTodo = (id: string) => {
    updateState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }))
  }

  const toggleHabit = (id: string) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const nextDone = !h.completedToday
        return {
          ...h,
          completedToday: nextDone,
          streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
        }
      }),
    }))
  }

  const addQuickSticky = () => {
    const content = quickScratch.trim() || '新灵感便签：把关键思考沉淀进 [[从业务经营战略反推组织与人才体系]]'
    const colors: ('amber' | 'emerald' | 'sky' | 'violet')[] = ['amber', 'emerald', 'sky', 'violet']
    updateState((prev) => ({
      ...prev,
      stickies: [
        {
          id: `st-${Date.now()}`,
          content,
          color: colors[prev.stickies.length % colors.length],
          updatedAt: '刚刚',
        },
        ...prev.stickies,
      ],
    }))
    setQuickScratch('')
  }

  const spanClass = (span: 4 | 6 | 8 | 12) => {
    if (span === 12) return 'col-span-12'
    if (span === 8) return 'col-span-12 xl:col-span-8'
    if (span === 6) return 'col-span-12 lg:col-span-6'
    return 'col-span-12 lg:col-span-6 xl:col-span-4'
  }

  const renderCardControls = (cardId: BentoCardId, targetModule: ModuleId) => (
    <div className="flex items-center gap-1 text-[var(--text-muted)]">
      <button
        type="button"
        onClick={() => moveCard(cardId, -1)}
        title="前移卡片"
        className="cursor-pointer rounded-lg p-1 hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => moveCard(cardId, 1)}
        title="后移卡片"
        className="cursor-pointer rounded-lg p-1 hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
      >
        <ArrowRight className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => resizeCard(cardId, -1)}
        title="缩小卡片宽度"
        className="cursor-pointer rounded-lg p-1 hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
      >
        <Minus className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        onClick={() => resizeCard(cardId, 1)}
        title="加宽卡片宽度"
        className="cursor-pointer rounded-lg p-1 hover:bg-black/5 hover:text-[var(--text-primary)] dark:hover:bg-white/10"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
      <GripHorizontal className="mx-0.5 h-3.5 w-3.5 opacity-55" />
      <button
        type="button"
        onClick={() => onOpenModule(targetModule)}
        title="打开完整舱室"
        className="cursor-pointer rounded-lg p-1 hover:bg-black/5 hover:text-[var(--accent-primary)] dark:hover:bg-white/10"
      >
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
  )

  // SVG coordinates for 24h temperature curve
  const temps = cityPreset.hourly.map((h) => h.temp)
  const minT = Math.min(...temps) - 2
  const maxT = Math.max(...temps) + 2
  const chartW = 460
  const chartH = 82
  const points = cityPreset.hourly.map((h, i) => {
    const x = 24 + (i * (chartW - 48)) / (cityPreset.hourly.length - 1)
    const y = chartH - 16 - ((h.temp - minT) / Math.max(1, maxT - minT)) * (chartH - 34)
    return { x, y, ...h }
  })
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${chartH} L ${points[0].x} ${chartH} Z`

  // Todo completion stats
  const doneTodos = state.todos.filter((t) => t.completed).length
  const totalTodos = state.todos.length
  const todoRate = totalTodos ? Math.round((doneTodos / totalTodos) * 100) : 0
  const pendingTodos = totalTodos - doneTodos

  // Rizhi stats
  const rizhiDone = state.rizhiColumns.filter((r) => r.todayDone).length
  const habitsDone = state.habits.filter((h) => h.completedToday).length

  // Nov 2026 starts on Sunday (Nov 1, 2026 is Sunday! Monday-first grid -> 6 leading blanks)
  const novDays = Array.from({ length: 30 }, (_, i) => i + 1)
  const leadingBlanks = 6

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-end justify-between px-1 pt-1">
        <div>
          <div className="text-[11px] font-semibold tracking-wider text-[var(--text-muted)] uppercase">
            HOME / 今日航迹
          </div>
          <h1 className="m-0 mt-0.5 text-[28px] font-bold tracking-tight text-[var(--text-primary)]">
            我的一天
          </h1>
        </div>
        <div className="text-[11.5px] text-[var(--text-muted)]">
          方向按钮排序 · 右上角调整尺寸与展开舱室
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {visibleCards.map((card) => {
          if (card.id === 'weather') {
            return (
              <section
                key={card.id}
                className={`glass-card flex flex-col justify-between rounded-[26px] p-5 ${spanClass(card.colSpan)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11.5px] text-[var(--text-muted)]">{card.subtitle}</div>
                    <div className="mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                      {state.settings.activeCity} · {cityPreset.condition}
                    </div>
                  </div>
                  {renderCardControls('weather', 'settings')}
                </div>

                <div className="my-4 grid grid-cols-1 gap-5 lg:grid-cols-12">
                  <div className="flex flex-col justify-between border-b border-[var(--glass-inner-border)] pb-4 lg:col-span-5 lg:border-b-0 lg:border-r lg:pb-0 lg:pr-5">
                    <div className="flex items-center justify-between py-2">
                      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-amber-200 via-amber-300 to-orange-300 text-[16px] font-bold text-amber-900 shadow-inner">
                        {cityPreset.condition.slice(0, 1)}
                      </div>
                      <div className="text-right">
                        <div className="tabular-nums text-[52px] font-light leading-none tracking-tight text-[var(--text-primary)]">
                          {cityPreset.temp}°
                        </div>
                        <div className="mt-1 text-[12px] text-[var(--text-muted)]">
                          体感 {cityPreset.feelsLike}°
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="glass-subcard rounded-2xl px-3 py-2">
                        <div className="text-[11px] text-[var(--text-muted)]">湿度</div>
                        <div className="tabular-nums mt-0.5 text-[13.5px] font-semibold">
                          {cityPreset.humidity}
                        </div>
                      </div>
                      <div className="glass-subcard rounded-2xl px-3 py-2">
                        <div className="text-[11px] text-[var(--text-muted)]">风速</div>
                        <div className="tabular-nums mt-0.5 text-[13.5px] font-semibold">
                          {cityPreset.wind}
                        </div>
                      </div>
                      <div className="glass-subcard rounded-2xl px-3 py-2">
                        <div className="text-[11px] text-[var(--text-muted)]">空气</div>
                        <div className="mt-0.5 text-[13px] font-semibold text-emerald-600 dark:text-emerald-400">
                          {cityPreset.aqiLabel} {cityPreset.aqiValue}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col justify-between lg:col-span-7">
                    <div className="flex items-center justify-between text-[11.5px] text-[var(--text-muted)]">
                      <span>24 小时温度航线</span>
                      <span>实时校准 · {lastSavedAt}</span>
                    </div>

                    <div className="my-1 overflow-hidden">
                      <svg viewBox={`0 0 ${chartW} ${chartH + 16}`} className="h-[104px] w-full">
                        <defs>
                          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="var(--accent-primary)" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="var(--accent-primary)" stopOpacity="0.01" />
                          </linearGradient>
                        </defs>
                        <path d={areaPath} fill="url(#tempFill)" />
                        <path
                          d={linePath}
                          fill="none"
                          stroke="var(--accent-primary)"
                          strokeWidth="2.2"
                          strokeLinecap="round"
                        />
                        {points.map((p) => (
                          <g key={p.label}>
                            <text
                              x={p.x}
                              y={p.y - 8}
                              textAnchor="middle"
                              className="fill-[var(--text-secondary)] text-[10px] font-medium"
                            >
                              {p.temp}°
                            </text>
                            <circle
                              cx={p.x}
                              cy={p.y}
                              r="3"
                              fill="var(--glass-surface-strong)"
                              stroke="var(--accent-primary)"
                              strokeWidth="2"
                            />
                            <text
                              x={p.x}
                              y={chartH + 11}
                              textAnchor="middle"
                              className="fill-[var(--text-muted)] text-[9.5px]"
                            >
                              {p.label}
                            </text>
                          </g>
                        ))}
                      </svg>
                    </div>

                    <div className="grid grid-cols-7 gap-1.5">
                      {cityPreset.daily.map((d, idx) => (
                        <div
                          key={d.day}
                          className={`rounded-xl px-1.5 py-1.5 text-center ${
                            idx === 0
                              ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                              : 'glass-subcard text-[var(--text-secondary)]'
                          }`}
                        >
                          <div className="text-[10px] text-[var(--text-muted)]">{d.day}</div>
                          <div className="my-0.5 text-[11.5px] font-semibold">{d.icon}</div>
                          <div className="tabular-nums text-[10px]">
                            {d.high}° {d.low}°
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-inner-border)] pt-3 text-[11.5px]">
                  <div>
                    <span className="text-[var(--text-muted)]">紫外线 </span>
                    <strong className="text-[var(--text-primary)]">{cityPreset.uv}</strong>
                    <div className="text-[10.5px] text-[var(--text-muted)]">{cityPreset.uvTip}</div>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">穿衣 </span>
                    <strong className="text-[var(--text-primary)]">{cityPreset.cloth}</strong>
                    <div className="text-[10.5px] text-[var(--text-muted)]">{cityPreset.clothTip}</div>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">户外与路亚 </span>
                    <strong className="text-[var(--text-primary)]">{cityPreset.outdoor}</strong>
                    <div className="text-[10.5px] text-[var(--text-muted)]">{cityPreset.outdoorTip}</div>
                  </div>
                  <div>
                    <span className="text-[var(--text-muted)]">意式磨豆 </span>
                    <strong className="text-[var(--text-primary)]">{cityPreset.espresso}</strong>
                    <div className="text-[10.5px] text-[var(--text-muted)]">
                      {cityPreset.espressoTip}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={cycleCity}
                    className="glass-subcard cursor-pointer rounded-xl px-3 py-1.5 text-[11.5px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
                  >
                    {state.settings.activeCity} ▾
                  </button>
                </div>
              </section>
            )
          }

          if (card.id === 'calendar') {
            return (
              <section
                key={card.id}
                className={`glass-card flex flex-col justify-between rounded-[26px] p-5 ${spanClass(card.colSpan)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11.5px] text-[var(--text-muted)]">{card.subtitle}</div>
                    <div className="mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                      2026 年 11 月
                    </div>
                  </div>
                  {renderCardControls('calendar', 'schedule')}
                </div>

                <div className="my-3 grid grid-cols-1 gap-4 sm:grid-cols-12">
                  <div className="sm:col-span-7">
                    <div className="mb-1.5 grid grid-cols-7 text-center text-[10.5px] text-[var(--text-muted)]">
                      {['一', '二', '三', '四', '五', '六', '日'].map((w) => (
                        <span key={w}>{w}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-y-1 text-center text-[12px]">
                      {Array.from({ length: leadingBlanks }).map((_, idx) => (
                        <span key={`b-${idx}`} />
                      ))}
                      {novDays.map((d) => {
                        const isSelected = d === selectedDay
                        const hasEvent = d === 11 || d === 12 || d === 15 || d === 23
                        return (
                          <button
                            key={d}
                            type="button"
                            onClick={() => setSelectedDay(d)}
                            className={`tabular-nums relative mx-auto flex h-7 w-7 cursor-pointer items-center justify-center rounded-xl font-medium transition ${
                              isSelected
                                ? 'nav-pill-active font-bold text-white'
                                : 'text-[var(--text-primary)] hover:bg-black/5 dark:hover:bg-white/10'
                            }`}
                          >
                            {d}
                            {hasEvent && !isSelected && (
                              <span className="absolute bottom-0.5 h-1 w-1 rounded-full bg-[var(--accent-primary)]" />
                            )}
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  <div className="flex flex-col justify-between border-t border-[var(--glass-inner-border)] pt-3 sm:col-span-5 sm:border-l sm:border-t-0 sm:pl-3.5 sm:pt-0">
                    <div className="flex items-center justify-between text-[11.5px]">
                      <span className="font-semibold text-[var(--text-primary)]">接下来</span>
                      <button
                        type="button"
                        onClick={() => onOpenModule('schedule')}
                        className="cursor-pointer text-[var(--accent-primary)] hover:underline"
                      >
                        查看全部
                      </button>
                    </div>

                    <div className="my-2 flex flex-col gap-2">
                      {state.schedules.slice(0, 3).map((s) => (
                        <div key={s.id} className="glass-subcard rounded-xl px-2.5 py-1.5">
                          <div className="tabular-nums text-[10px] text-[var(--accent-primary)]">
                            {s.startTime} – {s.endTime}
                          </div>
                          <div className="truncate text-[11.5px] font-medium text-[var(--text-primary)]">
                            {s.title}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="glass-subcard flex items-center justify-between rounded-2xl px-3.5 py-2 text-[11.5px]">
                  <span className="text-[var(--text-secondary)]">
                    距离 2027 战略开局{' '}
                    <strong className="tabular-nums text-[14px] text-[var(--text-primary)]">
                      51
                    </strong>{' '}
                    天
                  </span>
                  <span className="truncate text-[var(--text-muted)]">企微日历外手动航标</span>
                </div>
              </section>
            )
          }

          if (card.id === 'system') {
            return (
              <section
                key={card.id}
                className={`glass-card flex flex-col justify-between rounded-[26px] p-5 ${spanClass(card.colSpan)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11.5px] text-[var(--text-muted)]">{card.subtitle}</div>
                    <div className="mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                      {card.title}
                    </div>
                  </div>
                  {renderCardControls('system', 'toolbox')}
                </div>

                <div className="my-3 grid grid-cols-12 gap-3">
                  <div className="col-span-4 flex flex-col justify-between gap-2.5 border-r border-[var(--glass-inner-border)] pr-3">
                    {[
                      { label: '日知同步', val: `${rizhiDone}/14`, pct: Math.round((rizhiDone / 14) * 100) },
                      { label: '战略专注', val: '82%', pct: 82 },
                      { label: '双链归档', val: '518篇', pct: 74 },
                      { label: '精力储备', val: '88%', pct: 88 },
                    ].map((m) => (
                      <div key={m.label}>
                        <div className="flex justify-between text-[10.5px]">
                          <span className="text-[var(--text-muted)]">{m.label}</span>
                          <span className="tabular-nums font-semibold text-[var(--text-primary)]">
                            {m.val}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
                          <div
                            className="h-full rounded-full bg-[var(--action-teal)]"
                            style={{ width: `${m.pct}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="col-span-4 border-r border-[var(--glass-inner-border)] pr-3">
                    <div className="mb-2 flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-[var(--text-primary)]">快捷甲板</span>
                      <span className="text-[10px] text-[var(--text-muted)]">直达</span>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      {state.quickLinks.map((q) => (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => onOpenModule(q.targetModule)}
                          className="glass-subcard flex cursor-pointer flex-col items-center justify-center rounded-xl py-2 transition hover:border-[var(--accent-primary)]/50 hover:text-[var(--accent-primary)]"
                        >
                          <span className="text-[13px] font-bold text-[var(--text-primary)]">
                            {q.char}
                          </span>
                          <span className="mt-0.5 scale-90 text-[10px] text-[var(--text-muted)]">
                            {q.label.slice(0, 3)}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="col-span-4 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-[var(--text-primary)]">早间调度</span>
                        <span className="text-[10px] text-emerald-500">双轮正常</span>
                      </div>
                      <div className="glass-subcard mt-1.5 rounded-xl p-2 text-[10.5px] text-[var(--text-secondary)]">
                        <div>07:05 首轮站点同步</div>
                        <div className="mt-0.5">08:00 查漏全文回读</div>
                      </div>
                    </div>

                    <div className="mt-2">
                      <div className="mb-1 text-[11px] font-semibold text-[var(--text-primary)]">
                        速记剪贴箱
                      </div>
                      <div className="flex gap-1">
                        <input
                          value={quickScratch}
                          onChange={(e) => setQuickScratch(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && addQuickSticky()}
                          placeholder="记一句灵感..."
                          className="glass-subcard min-w-0 flex-1 rounded-xl px-2 py-1.5 text-[11px] outline-none"
                        />
                        <button
                          type="button"
                          onClick={addQuickSticky}
                          className="btn-teal cursor-pointer rounded-xl px-2 text-[11px]"
                        >
                          贴
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            )
          }

          if (card.id === 'todos') {
            const radius = 20
            const circumference = 2 * Math.PI * radius
            const dashOffset = circumference - (todoRate / 100) * circumference

            return (
              <section
                key={card.id}
                className={`glass-card flex flex-col justify-between rounded-[26px] p-5 ${spanClass(card.colSpan)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="text-[11.5px] text-[var(--text-muted)]">{card.subtitle}</div>
                    <div className="mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                      {card.title}
                    </div>
                  </div>
                  {renderCardControls('todos', 'todos')}
                </div>

                <div className="my-3 flex items-center gap-3.5">
                  <div className="relative flex h-13 w-13 shrink-0 items-center justify-center">
                    <svg className="h-13 w-13 -rotate-90" viewBox="0 0 50 50">
                      <circle
                        cx="25"
                        cy="25"
                        r={radius}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4"
                        className="text-black/8 dark:text-white/10"
                      />
                      <circle
                        cx="25"
                        cy="25"
                        r={radius}
                        fill="none"
                        stroke="var(--accent-primary)"
                        strokeWidth="4"
                        strokeDasharray={circumference}
                        strokeDashoffset={dashOffset}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className="tabular-nums absolute text-[11px] font-bold text-[var(--text-primary)]">
                      {todoRate}%
                    </span>
                  </div>
                  <div>
                    <div className="text-[14.5px] font-bold text-[var(--text-primary)]">
                      {pendingTodos} 项要事待拍板
                    </div>
                    <div className="text-[11.5px] text-[var(--text-muted)]">
                      已完成 {doneTodos}/{totalTodos} · 聚焦高杠杆决策闭环
                    </div>
                  </div>
                </div>

                <div className="mb-3 flex max-h-[126px] flex-col gap-1.5 overflow-y-auto pr-1">
                  {state.todos.slice(0, 4).map((todo) => (
                    <div
                      key={todo.id}
                      onClick={() => toggleTodo(todo.id)}
                      className="glass-subcard flex cursor-pointer items-center justify-between rounded-xl px-3 py-2 transition hover:border-[var(--accent-primary)]/40"
                    >
                      <div className="flex min-w-0 items-center gap-2.5">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-md border ${
                            todo.completed
                              ? 'border-[var(--action-teal)] bg-[var(--action-teal)] text-white'
                              : 'border-slate-400/60'
                          }`}
                        >
                          {todo.completed && <Check className="h-3 w-3" />}
                        </span>
                        <span
                          className={`rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            todo.priority === '高'
                              ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400'
                              : todo.priority === '中'
                                ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
                                : 'bg-slate-500/15 text-slate-600 dark:text-slate-300'
                          }`}
                        >
                          {todo.priority}
                        </span>
                        <span
                          className={`truncate text-[12.5px] font-medium ${
                            todo.completed
                              ? 'text-[var(--text-muted)] line-through'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {todo.title}
                        </span>
                      </div>
                      <span className="ml-2 shrink-0 text-[10.5px] text-[var(--text-muted)]">
                        {todo.dueText}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 rounded-2xl border border-dashed border-[var(--glass-inner-border)] px-3 py-1.5">
                  <span className="text-[var(--text-muted)]">+</span>
                  <input
                    value={quickTodo}
                    onChange={(e) => setQuickTodo(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddQuickTodo()}
                    placeholder='试试输入“明天审阅产销协同讲稿 #工作 !高”'
                    className="min-w-0 flex-1 bg-transparent text-[12px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
                  />
                  <button
                    type="button"
                    onClick={handleAddQuickTodo}
                    className="btn-teal cursor-pointer rounded-xl px-3 py-1 text-[11.5px] font-medium"
                  >
                    添加
                  </button>
                </div>
              </section>
            )
          }

          return (
            <section
              key={card.id}
              className={`glass-card flex flex-col justify-between rounded-[26px] p-5 ${spanClass(card.colSpan)}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[11.5px] text-[var(--text-muted)]">{card.subtitle}</div>
                  <div className="mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                    {card.title}
                  </div>
                </div>
                {renderCardControls('stream', 'compass')}
              </div>

              <div className="mt-3 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                {/* Col 1: Sticky Wall */}
                <div className="flex flex-col justify-between">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--text-primary)]">便签墙</span>
                    <button
                      type="button"
                      onClick={() => onOpenModule('notes')}
                      className="cursor-pointer text-[10px] text-[var(--accent-primary)]"
                    >
                      双链库
                    </button>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {state.stickies.slice(0, 2).map((st, idx) => (
                      <div
                        key={st.id}
                        onClick={() => onOpenModule('notes')}
                        className={`cursor-pointer rounded-2xl p-2.5 text-[11px] leading-snug shadow-sm transition hover:-translate-y-0.5 ${
                          idx === 0
                            ? 'bg-amber-200/85 text-amber-950 dark:bg-amber-300/90 dark:text-slate-900'
                            : 'bg-emerald-200/75 text-emerald-950 dark:bg-emerald-300/85 dark:text-slate-900'
                        }`}
                      >
                        <div className="line-clamp-4 font-medium">{st.content}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Col 2: Today Habits */}
                <div className="flex flex-col justify-between border-l border-[var(--glass-inner-border)] pl-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--text-primary)]">今日习惯</span>
                    <span className="tabular-nums font-bold text-[var(--accent-primary)]">
                      {habitsDone}/{state.habits.length}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {state.habits.slice(0, 4).map((h) => (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleHabit(h.id)}
                        className="flex cursor-pointer items-center gap-1.5 text-left text-[11px]"
                      >
                        <span
                          className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border ${
                            h.completedToday
                              ? 'border-emerald-500 bg-emerald-500 text-white'
                              : 'border-slate-400/60'
                          }`}
                        >
                          {h.completedToday && <Check className="h-2.5 w-2.5" />}
                        </span>
                        <span
                          className={`truncate ${
                            h.completedToday
                              ? 'text-[var(--text-muted)] line-through'
                              : 'text-[var(--text-primary)]'
                          }`}
                        >
                          {h.title.replace('早间', '')}
                        </span>
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onOpenModule('habits')}
                      className="mt-0.5 cursor-pointer text-left text-[10px] text-[var(--text-muted)] hover:text-[var(--accent-primary)]"
                    >
                      打开习惯印章 →
                    </button>
                  </div>
                </div>

                {/* Col 3: FX & Quant */}
                <div className="flex flex-col justify-between border-l border-[var(--glass-inner-border)] pl-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--text-primary)]">汇率量化</span>
                    <button
                      type="button"
                      onClick={() => onOpenModule('finance')}
                      className="cursor-pointer text-[10px] text-[var(--accent-primary)]"
                    >
                      看板
                    </button>
                  </div>
                  <div
                    onClick={() => onOpenModule('finance')}
                    className="glass-subcard flex flex-1 cursor-pointer flex-col justify-between rounded-2xl border-dashed p-2.5"
                  >
                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/15 text-[11px] font-bold text-[var(--accent-primary)]">
                      汇
                    </div>
                    <div className="my-1">
                      <div className="text-[10px] text-[var(--text-muted)]">中行参考 CNY/IDR</div>
                      <div className="tabular-nums text-[13px] font-bold text-[var(--text-primary)]">
                        {state.settings.fxRates.cnyToIdr}
                      </div>
                    </div>
                    <div className="text-[10px] text-emerald-600 dark:text-emerald-400">
                      LQ45 金叉 {state.quantWatch.filter((q) => q.signal === '多头金叉').length} 只
                    </div>
                  </div>
                </div>

                {/* Col 4: Rizhi Feed */}
                <div className="flex flex-col justify-between border-l border-[var(--glass-inner-border)] pl-2.5">
                  <div className="mb-1.5 flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-[var(--text-primary)]">日知早报</span>
                    <button
                      type="button"
                      onClick={() => onOpenModule('rizhi')}
                      className="cursor-pointer text-[10px] text-[var(--accent-primary)]"
                    >
                      14栏
                    </button>
                  </div>
                  <div
                    onClick={() => onOpenModule('rizhi')}
                    className="glass-subcard flex flex-1 cursor-pointer flex-col justify-between rounded-2xl border-dashed p-2.5"
                  >
                    <div className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-500/15 text-[11px] font-bold text-teal-600 dark:text-teal-400">
                      知
                    </div>
                    <div className="my-1">
                      <div className="text-[11.5px] font-bold text-[var(--text-primary)]">
                        今日 {rizhiDone}/14 已归档
                      </div>
                      <div className="mt-0.5 line-clamp-2 text-[10px] text-[var(--text-muted)]">
                        哲学 083 期 · AI实战 078 课已就绪
                      </div>
                    </div>
                    <div className="text-[10px] text-[var(--accent-primary)]">进入阅读 →</div>
                  </div>
                </div>
              </div>
            </section>
          )
        })}
      </div>

      <footer className="flex flex-wrap items-center justify-between px-2 pt-1 text-[11px] text-[var(--text-muted)]">
        <span>{state.settings.brandName}工作站 · 所有规划与手记默认保存在本机浏览器</span>
        <span>最近本地保存：{lastSavedAt}</span>
      </footer>
    </div>
  )
}
