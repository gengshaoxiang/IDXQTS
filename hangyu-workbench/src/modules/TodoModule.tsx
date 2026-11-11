import { Check, Pause, Play, RotateCcw, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { DomainTag, HangyuState, PriorityLevel, TodoItem } from '../types'

interface TodoModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

const DOMAINS: ('全部事项' | DomainTag)[] = [
  '全部事项',
  '工作与治理',
  '日知与学习',
  '生活与家庭',
  '自媒体创作',
]

export function TodoModule({ state, updateState }: TodoModuleProps) {
  const [selectedDomain, setSelectedDomain] = useState<'全部事项' | DomainTag>('全部事项')
  const [tab, setTab] = useState<'列表' | '四象限' | '趋势'>('列表')

  // Pomodoro state
  const [focusMinutes, setFocusMinutes] = useState(25)
  const [secondsLeft, setSecondsLeft] = useState(25 * 60)
  const [focusRunning, setFocusRunning] = useState(false)
  const [linkedTodoId, setLinkedTodoId] = useState(state.todos[0]?.id ?? '')

  // New Todo form
  const [title, setTitle] = useState('')
  const [dueText, setDueText] = useState('今天 18:00')
  const [domain, setDomain] = useState<DomainTag>('工作与治理')
  const [priority, setPriority] = useState<PriorityLevel>('高')
  const [quadrant, setQuadrant] = useState<TodoItem['quadrant']>('q1')
  const [tagsText, setTagsText] = useState('')

  useEffect(() => {
    if (!focusRunning) return
    const timer = window.setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          setFocusRunning(false)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => window.clearInterval(timer)
  }, [focusRunning])

  const filteredTodos = state.todos.filter((t) =>
    selectedDomain === '全部事项' ? true : t.domain === selectedDomain
  )

  const doneCount = state.todos.filter((t) => t.completed).length
  const highPriorityPending = state.todos.filter((t) => !t.completed && t.priority === '高').length

  const handleAddTodo = () => {
    if (!title.trim()) return
    const tags = tagsText
      .split(/[,，\s]+/)
      .map((s) => s.trim())
      .filter(Boolean)
    updateState((prev) => ({
      ...prev,
      todos: [
        {
          id: `t-${Date.now()}`,
          title: title.trim(),
          domain,
          priority,
          dueText,
          repeat: '不重复',
          tags: tags.length ? tags : [domain.slice(0, 2)],
          completed: false,
          quadrant,
          createdAt: '2026-11-11',
        },
        ...prev.todos,
      ],
    }))
    setTitle('')
    setTagsText('')
  }

  const toggleTodo = (id: string) => {
    updateState((prev) => ({
      ...prev,
      todos: prev.todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
    }))
  }

  const removeTodo = (id: string) => {
    updateState((prev) => ({
      ...prev,
      todos: prev.todos.filter((t) => t.id !== id),
    }))
  }

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0')
  const ss = String(secondsLeft % 60).padStart(2, '0')

  return (
    <div className="flex flex-col gap-5">
      {/* Top KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">已完成闭环</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {doneCount} / {state.todos.length}
          </div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">高优先级待拍板</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-rose-500">
            {highPriorityPending} 项
          </div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">连续推进节律</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--accent-primary)]">
            16 天
          </div>
        </div>
      </div>

      {/* Domain Tree */}
      <div className="glass-subcard grid grid-cols-1 gap-4 rounded-3xl p-5 md:grid-cols-12">
        <div className="md:col-span-4">
          <div className="text-[15px] font-bold text-[var(--text-primary)]">四大人生航道树</div>
          <div className="mt-1 text-[11.5px] text-[var(--text-muted)]">
            对齐私人助理顶层分类：工作、学习、生活、自媒体
          </div>
        </div>
        <div className="flex flex-wrap gap-2 md:col-span-8">
          {DOMAINS.map((d) => {
            const count =
              d === '全部事项'
                ? state.todos.length
                : state.todos.filter((t) => t.domain === d).length
            const active = selectedDomain === d
            return (
              <button
                key={d}
                type="button"
                onClick={() => setSelectedDomain(d)}
                className={`cursor-pointer rounded-xl px-3.5 py-2 text-[12.5px] font-medium transition ${
                  active
                    ? 'nav-pill-active text-white'
                    : 'glass-card text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {d} ({count})
              </button>
            )
          })}
        </div>
      </div>

      {/* Pomodoro Focus Bar */}
      <div className="glass-subcard flex flex-wrap items-center justify-between gap-4 rounded-3xl p-5">
        <div>
          <div className="text-[11px] text-[var(--text-muted)]">番茄深度专注舱</div>
          <div className="tabular-nums text-[32px] font-bold leading-tight text-[var(--action-teal)] dark:text-sky-300">
            {mm}:{ss}
          </div>
        </div>

        <div className="flex flex-1 flex-wrap items-center justify-end gap-2.5">
          <select
            value={linkedTodoId}
            onChange={(e) => setLinkedTodoId(e.target.value)}
            className="glass-card max-w-[260px] rounded-xl px-3 py-2 text-[12.5px] outline-none"
          >
            {state.todos.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>

          <select
            value={focusMinutes}
            onChange={(e) => {
              const m = Number(e.target.value)
              setFocusRunning(false)
              setFocusMinutes(m)
              setSecondsLeft(m * 60)
            }}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
          >
            <option value={15}>15 分钟</option>
            <option value={25}>25 分钟</option>
            <option value={45}>45 分钟</option>
          </select>

          <button
            type="button"
            onClick={() => setFocusRunning((r) => !r)}
            className="btn-teal flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-medium"
          >
            {focusRunning ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
            <span>{focusRunning ? '暂停专注' : '开始专注'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setFocusRunning(false)
              setSecondsLeft(focusMinutes * 60)
            }}
            className="glass-card cursor-pointer rounded-xl px-3 py-2 text-[12.5px] text-[var(--text-secondary)]"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Create Todo */}
      <div className="glass-subcard rounded-3xl p-5">
        <h3 className="m-0 mb-3 text-[15px] font-bold text-[var(--text-primary)]">新建待办要事</h3>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-12">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddTodo()}
            placeholder="要推进哪件结果明确的事项？"
            className="glass-card rounded-xl px-3.5 py-2.5 text-[13px] outline-none sm:col-span-12"
          />
          <input
            value={dueText}
            onChange={(e) => setDueText(e.target.value)}
            placeholder="截止时间"
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-3"
          />
          <select
            value={domain}
            onChange={(e) => setDomain(e.target.value as DomainTag)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-3"
          >
            <option value="工作与治理">工作与治理</option>
            <option value="日知与学习">日知与学习</option>
            <option value="生活与家庭">生活与家庭</option>
            <option value="自媒体创作">自媒体创作</option>
          </select>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as PriorityLevel)}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-2"
          >
            <option value="高">高优先级</option>
            <option value="中">中优先级</option>
            <option value="低">低优先级</option>
          </select>
          <select
            value={quadrant}
            onChange={(e) => setQuadrant(e.target.value as TodoItem['quadrant'])}
            className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none sm:col-span-4"
          >
            <option value="q1">第一象限：重要且紧急</option>
            <option value="q2">第二象限：重要不紧急（战略复利）</option>
            <option value="q3">第三象限：紧急不重要（授权协同）</option>
            <option value="q4">第四象限：生活调剂与缓冲</option>
          </select>
          <input
            value={tagsText}
            onChange={(e) => setTagsText(e.target.value)}
            placeholder="标签：例如 战略讲稿, S&OP, 公众号（逗号分隔）"
            className="glass-card rounded-xl px-3.5 py-2 text-[12.5px] outline-none sm:col-span-9"
          />
          <button
            type="button"
            onClick={handleAddTodo}
            className="btn-teal cursor-pointer rounded-xl py-2 text-[13px] font-medium sm:col-span-3"
          >
            创建待办
          </button>
        </div>
      </div>

      {/* View Switcher */}
      <div className="flex items-center justify-between">
        <div className="inline-flex rounded-xl bg-black/5 p-1 dark:bg-white/5">
          {(['列表', '四象限', '趋势'] as const).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`cursor-pointer rounded-lg px-4 py-1.5 text-[12.5px] font-medium transition ${
                tab === t
                  ? 'bg-white text-[var(--text-primary)] shadow-xs dark:bg-slate-800'
                  : 'text-[var(--text-muted)]'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
        <span className="text-[12px] text-[var(--text-muted)]">
          当前筛选共 {filteredTodos.length} 项
        </span>
      </div>

      {tab === '列表' && (
        <div className="flex flex-col gap-2">
          {filteredTodos.map((item) => (
            <div
              key={item.id}
              className="glass-subcard flex items-center justify-between rounded-2xl px-4 py-3"
            >
              <div
                onClick={() => toggleTodo(item.id)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3"
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                    item.completed
                      ? 'border-[var(--action-teal)] bg-[var(--action-teal)] text-white'
                      : 'border-slate-400/60'
                  }`}
                >
                  {item.completed && <Check className="h-3 w-3" />}
                </span>
                <div className="min-w-0">
                  <div
                    className={`truncate text-[13.5px] font-semibold ${
                      item.completed
                        ? 'text-[var(--text-muted)] line-through'
                        : 'text-[var(--text-primary)]'
                    }`}
                  >
                    {item.title}
                  </div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                    <span>{item.domain}</span>
                    <span>·</span>
                    <span>{item.dueText}</span>
                    {item.tags.map((tg) => (
                      <span
                        key={tg}
                        className="rounded-md bg-black/5 px-1.5 py-0.2 dark:bg-white/10"
                      >
                        #{tg}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="ml-3 flex items-center gap-2">
                <span
                  className={`rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
                    item.priority === '高'
                      ? 'bg-rose-500/15 text-rose-500'
                      : item.priority === '中'
                        ? 'bg-amber-500/15 text-amber-600 dark:text-amber-300'
                        : 'bg-slate-500/15 text-slate-500'
                  }`}
                >
                  {item.priority}
                </span>
                <button
                  type="button"
                  onClick={() => removeTodo(item.id)}
                  className="cursor-pointer rounded-lg p-1.5 text-[var(--text-muted)] hover:text-rose-500"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === '四象限' && (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {(
            [
              { q: 'q1', title: '重要且紧急 · 立即拍板', tone: 'text-rose-500' },
              { q: 'q2', title: '重要不紧急 · 战略复利区', tone: 'text-indigo-500' },
              { q: 'q3', title: '紧急不重要 · 授权数字助理/团队', tone: 'text-amber-500' },
              { q: 'q4', title: '不重要不紧急 · 生活松弛缓冲', tone: 'text-emerald-500' },
            ] as const
          ).map((quad) => (
            <div key={quad.q} className="glass-subcard rounded-2xl p-4">
              <div className={`mb-2.5 text-[13px] font-bold ${quad.tone}`}>{quad.title}</div>
              <div className="flex flex-col gap-1.5">
                {filteredTodos
                  .filter((t) => t.quadrant === quad.q)
                  .map((t) => (
                    <div
                      key={t.id}
                      onClick={() => toggleTodo(t.id)}
                      className="glass-card flex cursor-pointer items-center gap-2 rounded-xl px-3 py-2 text-[12.5px]"
                    >
                      <span
                        className={`h-2 w-2 shrink-0 rounded-full ${
                          t.completed ? 'bg-emerald-500' : 'bg-[var(--accent-primary)]'
                        }`}
                      />
                      <span className={t.completed ? 'line-through opacity-55' : ''}>
                        {t.title}
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === '趋势' && (
        <div className="glass-subcard rounded-3xl p-5">
          <div className="mb-3 text-[14px] font-bold text-[var(--text-primary)]">
            四大航道精力投入分布
          </div>
          <div className="flex flex-col gap-3">
            {(['工作与治理', '日知与学习', '生活与家庭', '自媒体创作'] as DomainTag[]).map((d) => {
              const items = state.todos.filter((t) => t.domain === d)
              const pct = state.todos.length
                ? Math.round((items.length / state.todos.length) * 100)
                : 0
              return (
                <div key={d}>
                  <div className="mb-1 flex justify-between text-[12px]">
                    <span className="font-medium text-[var(--text-primary)]">{d}</span>
                    <span className="tabular-nums text-[var(--text-muted)]">
                      {items.length} 项 ({pct}%)
                    </span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/8 dark:bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-violet-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
