import { Pause, Play, RotateCcw, Timer, X } from 'lucide-react'
import { useEffect, useState } from 'react'

interface FloatingMeetingTimerProps {
  open: boolean
  onClose: () => void
}

export function FloatingMeetingTimer({ open, onClose }: FloatingMeetingTimerProps) {
  const [totalSeconds, setTotalSeconds] = useState(15 * 60)
  const [remaining, setRemaining] = useState(15 * 60)
  const [running, setRunning] = useState(false)
  const [label, setLabel] = useState('战略汇报单议题控时')

  useEffect(() => {
    if (!running) return
    const id = window.setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          setRunning(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)
    return () => window.clearInterval(id)
  }, [running])

  if (!open) return null

  const mins = String(Math.floor(remaining / 60)).padStart(2, '0')
  const secs = String(remaining % 60).padStart(2, '0')
  const urgent = remaining > 0 && remaining <= 120

  const applyPreset = (minutes: number) => {
    setRunning(false)
    setTotalSeconds(minutes * 60)
    setRemaining(minutes * 60)
  }

  return (
    <div className="glass-sheet fixed bottom-5 right-5 z-50 w-[290px] rounded-[24px] p-4 shadow-2xl">
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-[12px] font-semibold text-[var(--accent-primary)]">
          <Timer className="h-4 w-4" />
          <span>会议悬浮倒计时</span>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-full p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <input
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="mb-2 w-full bg-transparent text-[12px] text-[var(--text-secondary)] outline-none"
      />

      <div
        className={`tabular-nums my-1 text-center text-[36px] font-bold tracking-tight ${
          remaining === 0
            ? 'text-rose-500'
            : urgent
              ? 'text-amber-500'
              : 'text-[var(--text-primary)]'
        }`}
      >
        {mins}:{secs}
      </div>

      <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-black/5 dark:bg-white/10">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 transition-all"
          style={{ width: `${totalSeconds ? (remaining / totalSeconds) * 100 : 0}%` }}
        />
      </div>

      <div className="mb-3 flex justify-between gap-1.5">
        {[5, 15, 25, 45].map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => applyPreset(m)}
            className="glass-subcard flex-1 cursor-pointer rounded-xl py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            {m}m
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setRunning((r) => !r)}
          className="btn-teal flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-medium"
        >
          {running ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          <span>{running ? '暂停' : '开始控时'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setRunning(false)
            setRemaining(totalSeconds)
          }}
          className="glass-subcard flex cursor-pointer items-center justify-center rounded-xl px-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
        >
          <RotateCcw className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  )
}
