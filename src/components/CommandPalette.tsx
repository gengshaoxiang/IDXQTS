import { ArrowRight, BookOpen, CheckSquare, FileText, FolderKanban, Search } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { NAV_MODULES } from '../data/navModules'
import type { HangyuState, ModuleId } from '../types'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
  state: HangyuState
  onNavigate: (moduleId: ModuleId) => void
}

interface SearchEntry {
  id: string
  title: string
  subtitle: string
  badge: string
  moduleId: ModuleId
  icon: typeof Search
}

export function CommandPalette({ open, onClose, state, onNavigate }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [selectedIdx, setSelectedIdx] = useState(0)

  const allEntries = useMemo<SearchEntry[]>(() => {
    const modEntries: SearchEntry[] = NAV_MODULES.filter((m) => m.id !== 'workbench').map((m) => ({
      id: `mod-${m.id}`,
      title: m.label,
      subtitle: m.subtitle,
      badge: '模块',
      moduleId: m.id,
      icon: m.icon,
    }))

    const todoEntries: SearchEntry[] = state.todos.map((t) => ({
      id: `todo-${t.id}`,
      title: t.title,
      subtitle: `${t.domain} · ${t.dueText} · ${t.completed ? '已完成' : '进行中'}`,
      badge: '待办',
      moduleId: 'todos',
      icon: CheckSquare,
    }))

    const noteEntries: SearchEntry[] = state.notes.map((n) => ({
      id: `note-${n.id}`,
      title: n.title,
      subtitle: `${n.folder} · ${n.tags.join(' / ')}`,
      badge: '笔记',
      moduleId: 'notes',
      icon: FileText,
    }))

    const rizhiEntries: SearchEntry[] = state.rizhiColumns.map((r) => ({
      id: `rz-${r.id}`,
      title: `${r.timeSlot}｜${r.title}`,
      subtitle: r.latestTopic,
      badge: '日知',
      moduleId: 'rizhi',
      icon: BookOpen,
    }))

    const projEntries: SearchEntry[] = state.projects.map((p) => ({
      id: `proj-${p.id}`,
      title: p.title,
      subtitle: `${p.stage} · 进度 ${p.progress}%`,
      badge: '战略项目',
      moduleId: 'projects',
      icon: FolderKanban,
    }))

    return [...modEntries, ...todoEntries, ...noteEntries, ...rizhiEntries, ...projEntries]
  }, [state])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allEntries.slice(0, 8)
    return allEntries
      .filter(
        (item) =>
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q) ||
          item.badge.toLowerCase().includes(q)
      )
      .slice(0, 10)
  }, [allEntries, query])

  const safeSelectedIdx = filtered.length ? Math.min(selectedIdx, filtered.length - 1) : 0

  useEffect(() => {
    if (!open) return
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIdx((i) => (filtered.length ? (i + 1) % filtered.length : 0))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIdx((i) => (filtered.length ? (i - 1 + filtered.length) % filtered.length : 0))
      } else if (e.key === 'Enter' && filtered[safeSelectedIdx]) {
        e.preventDefault()
        onNavigate(filtered[safeSelectedIdx].moduleId)
        onClose()
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, filtered, safeSelectedIdx, onNavigate, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/28 px-4 pt-[12vh] backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="glass-sheet w-full max-w-[640px] overflow-hidden rounded-[26px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-[var(--glass-inner-border)] px-5 py-4">
          <Search className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
          <input
            autoFocus
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setSelectedIdx(0)
            }}
            placeholder="搜索待办、日知14栏、双链笔记、战略项目与工具..."
            className="w-full bg-transparent text-[14.5px] text-[var(--text-primary)] outline-none placeholder:text-[var(--text-muted)]"
          />
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[var(--glass-inner-border)] px-2.5 py-1 text-[11px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            ESC
          </button>
        </div>

        <div className="max-h-[380px] overflow-y-auto p-3">
          <div className="mb-2 px-3 text-[11px] font-medium text-[var(--text-muted)]">
            {query.trim() ? '检索结果' : '常用航标入口'}
          </div>

          {filtered.length === 0 ? (
            <div className="py-10 text-center text-[13px] text-[var(--text-muted)]">
              未找到匹配条目，换个关键词试试
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              {filtered.map((item, idx) => {
                const Icon = item.icon
                const active = idx === safeSelectedIdx
                return (
                  <button
                    key={item.id}
                    type="button"
                    onMouseEnter={() => setSelectedIdx(idx)}
                    onClick={() => {
                      onNavigate(item.moduleId)
                      onClose()
                    }}
                    className={`flex w-full cursor-pointer items-center justify-between rounded-2xl px-3.5 py-3 text-left transition ${
                      active
                        ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                        : 'hover:bg-black/[0.03] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <div className="glass-subcard flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--accent-primary)]">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-[13.5px] font-semibold text-[var(--text-primary)]">
                          {item.title}
                        </div>
                        <div className="truncate text-[11.5px] text-[var(--text-muted)]">
                          {item.subtitle}
                        </div>
                      </div>
                    </div>

                    <div className="ml-3 flex shrink-0 items-center gap-2">
                      <span className="rounded-lg border border-[var(--glass-inner-border)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]">
                        {item.badge}
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-[var(--text-muted)]" />
                    </div>
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-[var(--glass-inner-border)] px-5 py-2.5 text-[11px] text-[var(--text-muted)]">
          <div className="flex items-center gap-3">
            <span>↑ ↓ 选择</span>
            <span>↵ 打开</span>
          </div>
          <span>所有检索结果均来自本机私有数据</span>
        </div>
      </div>
    </div>
  )
}
