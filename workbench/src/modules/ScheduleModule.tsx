import { Plus, Trash2 } from 'lucide-react'
import { useState } from 'react'
import type { HangyuState, ScheduleEvent, SpecialDayMark } from '../types'

interface ScheduleModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

const WEEK_COLS = [
  { date: '2026-11-09', label: '周一', dayNum: 9 },
  { date: '2026-11-10', label: '周二', dayNum: 10 },
  { date: '2026-11-11', label: '周三', dayNum: 11 },
  { date: '2026-11-12', label: '周四', dayNum: 12 },
  { date: '2026-11-13', label: '周五', dayNum: 13 },
  { date: '2026-11-14', label: '周六', dayNum: 14 },
  { date: '2026-11-15', label: '周日', dayNum: 15 },
]

export function ScheduleModule({ state, updateState }: ScheduleModuleProps) {
  const [viewMode, setViewMode] = useState<'日' | '周' | '月'>('周')
  const [title, setTitle] = useState('')
  const [date, setDate] = useState('2026-11-11')
  const [startTime, setStartTime] = useState('16:30')
  const [endTime, setEndTime] = useState('17:30')
  const [category, setCategory] = useState<ScheduleEvent['category']>('战略')

  const [markDate, setMarkDate] = useState('2026-11-15')
  const [markType, setMarkType] = useState<SpecialDayMark['type']>('休整日')
  const [markLabel, setMarkLabel] = useState('')

  const [cdTitle, setCdTitle] = useState('')
  const [cdDate, setCdDate] = useState('2026-12-31')

  const sumByCat = (cat: ScheduleEvent['category']) =>
    state.schedules
      .filter((s) => s.category === cat)
      .reduce((acc, cur) => acc + cur.durationMinutes, 0)

  const handleAddEvent = () => {
    if (!title.trim()) return
    const [sh, sm] = startTime.split(':').map(Number)
    const [eh, em] = endTime.split(':').map(Number)
    const mins = Math.max(15, (eh * 60 + em) - (sh * 60 + sm))
    updateState((prev) => ({
      ...prev,
      schedules: [
        ...prev.schedules,
        {
          id: `s-${Date.now()}`,
          title: title.trim(),
          date,
          startTime,
          endTime,
          category,
          durationMinutes: Number.isFinite(mins) ? mins : 60,
        },
      ],
    }))
    setTitle('')
  }

  const handleAddMark = () => {
    if (!markLabel.trim()) return
    updateState((prev) => ({
      ...prev,
      specialDays: [
        ...prev.specialDays,
        { id: `sd-${Date.now()}`, date: markDate, type: markType, label: markLabel.trim() },
      ],
    }))
    setMarkLabel('')
  }

  const handleAddCountdown = () => {
    if (!cdTitle.trim()) return
    updateState((prev) => ({
      ...prev,
      countdowns: [
        ...prev.countdowns,
        { id: `cd-${Date.now()}`, title: cdTitle.trim(), targetDate: cdDate, category: '关键节点' },
      ],
    }))
    setCdTitle('')
  }

  const daysUntil = (target: string) => {
    const base = new Date('2026-11-11T00:00:00')
    const tgt = new Date(`${target}T00:00:00`)
    return Math.max(0, Math.ceil((tgt.getTime() - base.getTime()) / (1000 * 3600 * 24)))
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-indigo-500/20 bg-[var(--accent-soft)] px-4 py-2.5 text-[12px] text-[var(--text-secondary)]">
        航期原则：真实日常会议以企业微信日历为准；本舱室仅做个人战略节奏、跨国差旅与深度学习时段的手动锚定，不同步任何外部日历。
      </div>

      {/* Category Summary KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {(
          [
            { cat: '战略', label: '战略与治理' },
            { cat: '协同', label: '业务协同' },
            { cat: '学习', label: '日知与输入' },
            { cat: '生活', label: '家庭与放空' },
          ] as const
        ).map((item) => (
          <div key={item.cat} className="glass-subcard rounded-2xl p-4">
            <div className="text-[11.5px] text-[var(--text-muted)]">{item.label}</div>
            <div className="tabular-nums mt-1 text-[22px] font-bold text-[var(--text-primary)]">
              {sumByCat(item.cat)} <span className="text-[13px] font-normal">分钟</span>
            </div>
          </div>
        ))}
      </div>

      {/* Weekly Calendar Board */}
      <div className="glass-subcard rounded-3xl p-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="inline-flex rounded-xl bg-black/5 p-1 dark:bg-white/5">
            {(['日', '周', '月'] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setViewMode(m)}
                className={`cursor-pointer rounded-lg px-4 py-1 text-[12px] font-medium transition ${
                  viewMode === m
                    ? 'bg-white text-[var(--text-primary)] shadow-sm dark:bg-slate-800'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <div className="text-[14px] font-bold text-[var(--text-primary)]">
            11月9日 — 11月15日（{viewMode}视图）
          </div>
          <span className="rounded-xl border border-[var(--glass-inner-border)] px-3 py-1 text-[11.5px] text-[var(--text-secondary)]">
            本周航程
          </span>
        </div>

        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-7">
          {WEEK_COLS.filter((c) => (viewMode === '日' ? c.date === '2026-11-11' : true)).map((col) => {
            const dayEvents = state.schedules.filter((s) => s.date === col.date)
            const dayMarks = state.specialDays.filter((m) => m.date === col.date)
            const isToday = col.date === '2026-11-11'

            return (
              <div
                key={col.date}
                className={`min-h-[195px] rounded-2xl border p-3 ${
                  isToday
                    ? 'border-[var(--accent-primary)]/45 bg-[var(--accent-soft)]/40'
                    : 'border-[var(--glass-inner-border)] bg-white/45 dark:bg-slate-900/35'
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[11px] text-[var(--text-muted)]">{col.label}</span>
                  <span
                    className={`tabular-nums text-[14px] font-bold ${
                      isToday ? 'text-[var(--accent-primary)]' : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {col.dayNum}
                  </span>
                </div>

                {dayMarks.map((mk) => (
                  <div
                    key={mk.id}
                    className="mb-1.5 rounded-lg bg-amber-500/15 px-2 py-1 text-[10.5px] font-medium text-amber-700 dark:text-amber-300"
                  >
                    {mk.type} · {mk.label}
                  </div>
                ))}

                <div className="flex flex-col gap-1.5">
                  {dayEvents.map((ev) => (
                    <div
                      key={ev.id}
                      className="group relative rounded-xl border border-[var(--glass-inner-border)] bg-white/80 p-2 text-[11px] shadow-xs dark:bg-slate-800/80"
                    >
                      <div className="tabular-nums font-semibold text-[var(--accent-primary)]">
                        {ev.startTime}–{ev.endTime}
                      </div>
                      <div className="mt-0.5 font-medium text-[var(--text-primary)]">{ev.title}</div>
                      <button
                        type="button"
                        onClick={() =>
                          updateState((prev) => ({
                            ...prev,
                            schedules: prev.schedules.filter((s) => s.id !== ev.id),
                          }))
                        }
                        className="absolute right-1.5 top-1.5 hidden cursor-pointer text-rose-500 group-hover:block"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Special Day Marker */}
      <div className="glass-subcard rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-bold text-[var(--text-primary)]">
            差旅、闭门与休整日标记
          </span>
          <span className="text-[11.5px] text-[var(--text-muted)]">仅记录你主动设置的航期属性</span>
        </div>
        <div className="flex flex-wrap gap-2.5">
          <input
            type="date"
            value={markDate}
            onChange={(e) => setMarkDate(e.target.value)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
          />
          <select
            value={markType}
            onChange={(e) => setMarkType(e.target.value as SpecialDayMark['type'])}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
          >
            <option value="休整日">休整日</option>
            <option value="跨国差旅">跨国差旅</option>
            <option value="战略闭门">战略闭门</option>
          </select>
          <input
            value={markLabel}
            onChange={(e) => setMarkLabel(e.target.value)}
            placeholder="例如：海湾路亚放空 / 海外市场巡检"
            className="glass-card min-w-[200px] flex-1 rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
          />
          <button
            type="button"
            onClick={handleAddMark}
            className="btn-teal cursor-pointer rounded-xl px-4 py-2 text-[12.5px] font-medium"
          >
            标记日期
          </button>
        </div>
      </div>

      {/* Create Schedule Event */}
      <div className="glass-subcard rounded-3xl p-5">
        <h3 className="m-0 mb-3 text-[15px] font-bold text-[var(--text-primary)]">新建手动日程</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="日程或闭门研讨主题..."
            className="glass-card rounded-xl px-3.5 py-2.5 text-[13px] outline-none sm:col-span-12"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-3"
          />
          <input
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
          />
          <input
            type="time"
            value={endTime}
            onChange={(e) => setEndTime(e.target.value)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as ScheduleEvent['category'])}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
          >
            <option value="战略">战略</option>
            <option value="协同">协同</option>
            <option value="学习">学习</option>
            <option value="生活">生活</option>
          </select>
          <button
            type="button"
            onClick={handleAddEvent}
            className="btn-teal flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-[13px] font-medium sm:col-span-3"
          >
            <Plus className="h-4 w-4" />
            <span>创建日程</span>
          </button>
        </div>
      </div>

      {/* Important Date Countdowns */}
      <div className="glass-subcard rounded-3xl p-5">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[14px] font-bold text-[var(--text-primary)]">关键里程碑倒计时</span>
          <span className="text-[11.5px] text-[var(--text-muted)]">
            {state.countdowns.length} 项航标
          </span>
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2.5 sm:grid-cols-3">
          {state.countdowns.map((c) => (
            <div key={c.id} className="glass-card flex items-center justify-between rounded-2xl p-3.5">
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--text-primary)]">
                  {c.title}
                </div>
                <div className="text-[11px] text-[var(--text-muted)]">{c.targetDate}</div>
              </div>
              <div className="tabular-nums ml-2 shrink-0 text-right">
                <span className="text-[20px] font-bold text-[var(--accent-primary)]">
                  {daysUntil(c.targetDate)}
                </span>
                <span className="ml-0.5 text-[11px] text-[var(--text-muted)]">天</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          <input
            value={cdTitle}
            onChange={(e) => setCdTitle(e.target.value)}
            placeholder="例如：集团年度战略大会交付"
            className="glass-card min-w-[200px] flex-1 rounded-xl px-3.5 py-2 text-[12.5px] outline-none"
          />
          <input
            type="date"
            value={cdDate}
            onChange={(e) => setCdDate(e.target.value)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
          />
          <button
            type="button"
            onClick={handleAddCountdown}
            className="btn-teal cursor-pointer rounded-xl px-4 py-2 text-[12.5px] font-medium"
          >
            添加倒计时
          </button>
        </div>
      </div>
    </div>
  )
}
