import { Plus } from 'lucide-react'
import { useState } from 'react'
import type { HangyuState } from '../types'

interface HabitsModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

export function HabitsModule({ state, updateState }: HabitsModuleProps) {
  const [newTitle, setNewTitle] = useState('')
  const [newChar, setNewChar] = useState('行')
  const [newFreq, setNewFreq] = useState('每天')

  const doneCount = state.habits.filter((h) => h.completedToday).length
  const maxStreak = Math.max(0, ...state.habits.map((h) => h.streak))
  const avgCompletion = Math.round(
    (state.habits.reduce(
      (acc, h) => acc + h.history.filter(Boolean).length / Math.max(1, h.history.length),
      0
    ) /
      Math.max(1, state.habits.length)) *
      100
  )

  const toggleStamp = (id: string) => {
    updateState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== id) return h
        const nextDone = !h.completedToday
        const nextHistory = [...h.history.slice(0, -1), nextDone]
        return {
          ...h,
          completedToday: nextDone,
          streak: nextDone ? h.streak + 1 : Math.max(0, h.streak - 1),
          history: nextHistory,
        }
      }),
    }))
  }

  const addHabit = () => {
    if (!newTitle.trim()) return
    updateState((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        {
          id: `h-${Date.now()}`,
          title: newTitle.trim(),
          badgeChar: (newChar.trim() || newTitle.trim()[0] || '印').slice(0, 1),
          frequency: newFreq,
          streak: 0,
          completedToday: false,
          history: [false, false, false, false, false, false, false],
        },
      ],
    }))
    setNewTitle('')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Top 4 KPIs matching Image 9 */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11px] text-[var(--text-muted)]">今日节奏</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {doneCount} <span className="text-[13px] font-normal">/ {state.habits.length}</span>
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">项已盖章</div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11px] text-[var(--text-muted)]">最长连续</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--accent-primary)]">
            {maxStreak} <span className="text-[13px] font-normal">天</span>
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">长期主义复利</div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11px] text-[var(--text-muted)]">近 7 日达成率</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {avgCompletion}%
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">按计划频率统计</div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11px] text-[var(--text-muted)]">已点亮徽章</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-emerald-500">
            4 <span className="text-[13px] font-normal">/ 6</span>
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">由真实打卡生成</div>
        </div>
      </div>

      {/* Stamp Board matching Image 9 */}
      <div className="glass-subcard rounded-3xl p-6">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="text-[11.5px] text-[var(--text-muted)]">11月11日 星期三</div>
            <h3 className="m-0 mt-0.5 text-[19px] font-bold text-[var(--text-primary)]">
              今天，给生活与学习节奏盖一枚印章。
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {state.habits.map((h) => (
            <div
              key={h.id}
              onClick={() => toggleStamp(h.id)}
              className="glass-card flex cursor-pointer items-center justify-between rounded-2xl p-4 transition hover:-translate-y-0.5"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-15 w-15 shrink-0 flex-col items-center justify-center rounded-full border-2 border-dashed transition-all ${
                    h.completedToday
                      ? 'border-[var(--action-teal)] bg-[var(--action-teal)] text-white shadow-md'
                      : 'border-slate-400/50 bg-black/4 text-[var(--text-muted)] dark:bg-white/5'
                  }`}
                >
                  <span className="text-[16px] font-bold">{h.badgeChar}</span>
                  <span className="text-[9.5px]">{h.completedToday ? '已盖章' : '打卡'}</span>
                </div>

                <div>
                  <div className="text-[11px] text-[var(--text-muted)]">{h.frequency}</div>
                  <div className="text-[15px] font-bold text-[var(--text-primary)]">{h.title}</div>
                  <div className="mt-1 flex items-center gap-1.5">
                    <span className="tabular-nums text-[11px] text-[var(--text-muted)]">
                      连续 {h.streak} 天
                    </span>
                    <div className="ml-1 flex gap-1">
                      {h.history.map((done, i) => (
                        <span
                          key={i}
                          className={`h-2 w-2 rounded-full ${
                            done ? 'bg-emerald-500' : 'bg-slate-400/30'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <span
                className={`rounded-xl px-3 py-1 text-[11.5px] font-medium ${
                  h.completedToday
                    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                    : 'glass-subcard text-[var(--text-secondary)]'
                }`}
              >
                {h.completedToday ? '已完成' : '盖章'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Add New Habit */}
      <div className="glass-subcard rounded-3xl p-5">
        <div className="mb-3 text-[14px] font-bold text-[var(--text-primary)]">+ 新建长期习惯</div>
        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-12">
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="习惯名称，例如：晚间复盘前课口语 10 分钟"
            className="glass-card rounded-xl px-3.5 py-2 text-[12.5px] outline-none sm:col-span-6"
          />
          <input
            value={newChar}
            onChange={(e) => setNewChar(e.target.value)}
            maxLength={1}
            placeholder="印章字"
            className="glass-card rounded-xl px-3 py-2 text-center text-[12.5px] outline-none sm:col-span-2"
          />
          <input
            value={newFreq}
            onChange={(e) => setNewFreq(e.target.value)}
            placeholder="频率"
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
          />
          <button
            type="button"
            onClick={addHabit}
            className="btn-teal flex cursor-pointer items-center justify-center gap-1 rounded-xl py-2 text-[12.5px] font-medium sm:col-span-2"
          >
            <Plus className="h-4 w-4" />
            <span>新建</span>
          </button>
        </div>
      </div>
    </div>
  )
}
