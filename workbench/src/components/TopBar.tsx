import { Compass, Plus, Search, StickyNote, Timer } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { ModuleId, WorkbenchSettings } from '../types'

interface TopBarProps {
  settings: WorkbenchSettings
  onChangeTimezone: (tz: WorkbenchSettings['activeTimezone']) => void
  onOpenSearch: () => void
  onQuickAction: (target: ModuleId) => void
  onOpenFloatingTimer: () => void
}

const TZ_META: Record<
  WorkbenchSettings['activeTimezone'],
  { label: string; short: string }
> = {
  'Asia/Jakarta': { label: '雅加达 UTC+7', short: 'JKT +7' },
  'Asia/Shanghai': { label: '北京时间 UTC+8', short: 'BJS +8' },
  'Africa/Dar_es_Salaam': { label: '东非时间 UTC+3', short: 'DAR +3' },
}

const WEEKDAYS = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']

export function TopBar({
  settings,
  onChangeTimezone,
  onOpenSearch,
  onQuickAction,
  onOpenFloatingTimer,
}: TopBarProps) {
  const [now, setNow] = useState(() => new Date())

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000)
    return () => window.clearInterval(timer)
  }, [])

  const parts = new Intl.DateTimeFormat('zh-CN', {
    timeZone: settings.activeTimezone,
    month: 'numeric',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(now)

  const getPart = (type: string) => parts.find((p) => p.type === type)?.value ?? ''
  const hourStr = getPart('hour').padStart(2, '0')
  const minStr = getPart('minute').padStart(2, '0')
  const monthStr = getPart('month')
  const dayStr = getPart('day')
  const hourNum = Number(hourStr)

  const periodGreeting =
    hourNum < 6
      ? '夜航静思，船长'
      : hourNum < 11
        ? '早上好，船长'
        : hourNum < 14
          ? '午间好，船长'
          : hourNum < 18
            ? '下午好，船长'
            : '晚上好，船长'

  const localDayIndex = new Date(
    now.toLocaleString('en-US', { timeZone: settings.activeTimezone })
  ).getDay()
  const weekdayLabel = WEEKDAYS[localDayIndex] ?? '星期三'

  const cycleTimezone = () => {
    const order: WorkbenchSettings['activeTimezone'][] = [
      'Asia/Jakarta',
      'Asia/Shanghai',
      'Africa/Dar_es_Salaam',
    ]
    const next = order[(order.indexOf(settings.activeTimezone) + 1) % order.length]
    onChangeTimezone(next)
  }

  return (
    <header className="glass-card flex flex-wrap items-center justify-between gap-4 rounded-[26px] px-6 py-3.5">
      <div className="flex flex-wrap items-center gap-5">
        <div className="tabular-nums text-[38px] font-bold leading-none tracking-tight text-[var(--text-primary)]">
          {hourStr}:{minStr}
        </div>

        <div className="flex flex-col gap-1 border-r border-[var(--glass-inner-border)] pr-5">
          <div className="text-[12.5px] font-semibold text-[var(--text-primary)]">
            {monthStr}月{dayStr}日 {weekdayLabel}
          </div>
          <button
            type="button"
            onClick={cycleTimezone}
            title="点击切换常用跨国时区"
            className="inline-flex w-fit cursor-pointer items-center gap-1.5 rounded-full bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-medium text-[var(--accent-primary)] transition hover:opacity-85"
          >
            <span>{TZ_META[settings.activeTimezone].label}</span>
          </button>
        </div>

        <div className="hidden sm:block">
          <div className="text-[11.5px] text-[var(--text-muted)]">{periodGreeting}，</div>
          <div className="text-[15.5px] font-semibold tracking-tight text-[var(--text-primary)]">
            {settings.greetingMotto}
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-end gap-3">
        <button
          type="button"
          onClick={onOpenSearch}
          className="glass-subcard flex min-w-[230px] max-w-[380px] flex-1 cursor-pointer items-center justify-between rounded-full px-4 py-2.5 text-left text-[13px] text-[var(--text-muted)] transition hover:border-[var(--accent-primary)]/40 hover:text-[var(--text-secondary)]"
        >
          <span className="flex items-center gap-2.5 truncate">
            <Search className="h-4 w-4 shrink-0" />
            <span className="truncate">搜索待办、日知14栏、战略项目与工具...</span>
          </span>
          <kbd className="ml-2 shrink-0 rounded-md border border-[var(--glass-inner-border)] bg-black/[0.03] px-2 py-0.5 text-[11px] font-medium text-[var(--text-secondary)] dark:bg-white/[0.06]">
            ⌘ K
          </kbd>
        </button>

        <div className="hidden items-center gap-1.5 md:flex">
          <button
            type="button"
            onClick={() => onQuickAction('todos')}
            className="glass-subcard flex cursor-pointer flex-col items-center justify-center rounded-2xl px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
          >
            <Plus className="mb-0.5 h-3.5 w-3.5" />
            <span>待办</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('notes')}
            className="glass-subcard flex cursor-pointer flex-col items-center justify-center rounded-2xl px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
          >
            <StickyNote className="mb-0.5 h-3.5 w-3.5" />
            <span>双链</span>
          </button>
          <button
            type="button"
            onClick={() => onQuickAction('compass')}
            className="glass-subcard flex cursor-pointer flex-col items-center justify-center rounded-2xl px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
          >
            <Compass className="mb-0.5 h-3.5 w-3.5" />
            <span>复盘</span>
          </button>
          <button
            type="button"
            onClick={onOpenFloatingTimer}
            className="glass-subcard flex cursor-pointer flex-col items-center justify-center rounded-2xl px-3 py-1.5 text-[11px] text-[var(--text-secondary)] transition hover:text-[var(--accent-primary)]"
          >
            <Timer className="mb-0.5 h-3.5 w-3.5" />
            <span>倒计时</span>
          </button>
        </div>
      </div>
    </header>
  )
}
