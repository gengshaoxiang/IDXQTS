import { Network, Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import type { HangyuState, NoteItem } from '../types'

interface NotesModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

const FOLDERS: ('全部笔记' | NoteItem['folder'])[] = [
  '全部笔记',
  '管理与战略',
  'AI与数字员工',
  '阅读摘录',
  '生活与灵感',
]

function extractWikiLinks(text: string): string[] {
  const matches = text.matchAll(/\[\[([^\]]+)\]\]/g)
  return Array.from(new Set(Array.from(matches, (m) => m[1].trim())))
}

export function NotesModule({ state, updateState }: NotesModuleProps) {
  const [selectedFolder, setSelectedFolder] = useState<'全部笔记' | NoteItem['folder']>('全部笔记')
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(state.notes[0]?.id ?? '')
  const [mode, setMode] = useState<'编辑' | '关系图'>('编辑')

  const filteredNotes = useMemo(() => {
    return state.notes.filter((n) => {
      const folderOk = selectedFolder === '全部笔记' || n.folder === selectedFolder
      const q = search.trim().toLowerCase()
      const searchOk =
        !q ||
        n.title.toLowerCase().includes(q) ||
        n.content.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
      return folderOk && searchOk
    })
  }, [state.notes, selectedFolder, search])

  const activeNote = state.notes.find((n) => n.id === activeId) ?? filteredNotes[0] ?? state.notes[0]

  const outgoingLinks = useMemo(
    () => (activeNote ? extractWikiLinks(activeNote.content) : []),
    [activeNote]
  )

  const backlinks = useMemo(() => {
    if (!activeNote) return []
    return state.notes.filter(
      (n) => n.id !== activeNote.id && extractWikiLinks(n.content).includes(activeNote.title)
    )
  }, [state.notes, activeNote])

  const createNewNote = (presetTitle?: string) => {
    const newId = `n-${Date.now()}`
    const title = presetTitle ?? `新建思考手记 ${state.notes.length + 1}`
    const newNote: NoteItem = {
      id: newId,
      title,
      folder: selectedFolder === '全部笔记' ? '管理与战略' : selectedFolder,
      tags: ['随手思考'],
      content: `# ${title}\n\n在这里记录核心判断，使用 [[从业务经营战略反推组织与人才体系]] 建立双向知识网络。`,
      updatedAt: '2026-11-11',
    }
    updateState((prev) => ({ ...prev, notes: [newNote, ...prev.notes] }))
    setActiveId(newId)
    setMode('编辑')
  }

  const updateActiveNote = (patch: Partial<NoteItem>) => {
    if (!activeNote) return
    updateState((prev) => ({
      ...prev,
      notes: prev.notes.map((n) =>
        n.id === activeNote.id ? { ...n, ...patch, updatedAt: '2026-11-11' } : n
      ),
    }))
  }

  const deleteActiveNote = () => {
    if (!activeNote || state.notes.length <= 1) return
    const nextNotes = state.notes.filter((n) => n.id !== activeNote.id)
    updateState((prev) => ({ ...prev, notes: nextNotes }))
    setActiveId(nextNotes[0].id)
  }

  const jumpToTitle = (targetTitle: string) => {
    const found = state.notes.find((n) => n.title === targetTitle)
    if (found) {
      setActiveId(found.id)
      setMode('编辑')
    } else {
      createNewNote(targetTitle)
    }
  }

  const renderPreviewLine = (line: string, idx: number) => {
    if (line.startsWith('# ')) {
      return (
        <h3 key={idx} className="m-0 mb-2 text-[19px] font-bold text-[var(--text-primary)]">
          {line.slice(2)}
        </h3>
      )
    }
    const segments = line.split(/(\[\[[^\]]+\]\])/g)
    return (
      <p key={idx} className="my-1.5 text-[13.5px] leading-relaxed text-[var(--text-secondary)]">
        {segments.map((seg, i) => {
          if (seg.startsWith('[[') && seg.endsWith(']]')) {
            const linkTitle = seg.slice(2, -2).trim()
            return (
              <button
                key={i}
                type="button"
                onClick={() => jumpToTitle(linkTitle)}
                className="mx-0.5 inline-flex cursor-pointer items-center rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[12.5px] font-semibold text-[var(--accent-primary)] hover:underline"
              >
                {linkTitle}
              </button>
            )
          }
          return <span key={i}>{seg}</span>
        })}
      </p>
    )
  }

  return (
    <div className="grid min-h-[580px] grid-cols-1 gap-4 lg:grid-cols-12">
      {/* Left Note List */}
      <div className="glass-subcard flex flex-col gap-3 rounded-3xl p-4 lg:col-span-4">
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => createNewNote()}
            className="btn-teal flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-medium"
          >
            <Plus className="h-4 w-4" />
            <span>新建笔记</span>
          </button>
          <button
            type="button"
            onClick={() => createNewNote('2026-11-11 今日航行手记')}
            className="glass-card cursor-pointer rounded-xl px-3 py-2 text-[12px] font-medium text-[var(--text-secondary)]"
          >
            今日手记
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {FOLDERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setSelectedFolder(f)}
              className={`cursor-pointer rounded-lg px-2.5 py-1 text-[11px] font-medium ${
                selectedFolder === f
                  ? 'bg-[var(--accent-soft)] text-[var(--accent-primary)]'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索标题、正文或标签..."
          className="glass-card rounded-xl px-3 py-2 text-[12px] outline-none"
        />

        <div className="flex flex-1 flex-col gap-1.5 overflow-y-auto">
          {filteredNotes.map((n) => {
            const active = activeNote?.id === n.id
            return (
              <button
                key={n.id}
                type="button"
                onClick={() => setActiveId(n.id)}
                className={`cursor-pointer rounded-2xl p-3 text-left transition ${
                  active
                    ? 'bg-[var(--accent-soft)] text-[var(--text-primary)]'
                    : 'hover:bg-black/4 dark:hover:bg-white/5'
                }`}
              >
                <div className="line-clamp-2 text-[13px] font-semibold text-[var(--text-primary)]">
                  {n.title}
                </div>
                <div className="mt-1 text-[10.5px] text-[var(--text-muted)]">
                  {n.folder} · {n.updatedAt}
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* Right Editor & Preview / Graph */}
      <div className="glass-subcard flex flex-col justify-between rounded-3xl p-5 lg:col-span-8">
        {activeNote && (
          <>
            <div>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-[var(--glass-inner-border)] pb-3">
                <input
                  value={activeNote.title}
                  onChange={(e) => updateActiveNote({ title: e.target.value })}
                  className="min-w-[200px] flex-1 bg-transparent text-[17px] font-bold text-[var(--text-primary)] outline-none"
                />
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMode('编辑')}
                    className={`cursor-pointer rounded-xl px-3 py-1.5 text-[12px] font-medium ${
                      mode === '编辑'
                        ? 'btn-teal'
                        : 'glass-card text-[var(--text-secondary)]'
                    }`}
                  >
                    双栏编辑
                  </button>
                  <button
                    type="button"
                    onClick={() => setMode('关系图')}
                    className={`flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1.5 text-[12px] font-medium ${
                      mode === '关系图'
                        ? 'btn-teal'
                        : 'glass-card text-[var(--text-secondary)]'
                    }`}
                  >
                    <Network className="h-3.5 w-3.5" />
                    <span>关系图</span>
                  </button>
                  <button
                    type="button"
                    onClick={deleteActiveNote}
                    className="glass-card cursor-pointer rounded-xl p-1.5 text-rose-500"
                    title="删除笔记"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mb-3 flex flex-wrap gap-2">
                <select
                  value={activeNote.folder}
                  onChange={(e) =>
                    updateActiveNote({ folder: e.target.value as NoteItem['folder'] })
                  }
                  className="glass-card rounded-xl px-3 py-1.5 text-[12px] outline-none"
                >
                  <option value="管理与战略">管理与战略</option>
                  <option value="AI与数字员工">AI与数字员工</option>
                  <option value="阅读摘录">阅读摘录</option>
                  <option value="生活与灵感">生活与灵感</option>
                </select>
                <input
                  value={activeNote.tags.join(', ')}
                  onChange={(e) =>
                    updateActiveNote({
                      tags: e.target.value
                        .split(/[,，]/)
                        .map((s) => s.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="标签，用逗号分隔"
                  className="glass-card flex-1 rounded-xl px-3 py-1.5 text-[12px] outline-none"
                />
              </div>

              {mode === '编辑' ? (
                <div className="grid min-h-[340px] grid-cols-1 gap-3 md:grid-cols-2">
                  <textarea
                    value={activeNote.content}
                    onChange={(e) => updateActiveNote({ content: e.target.value })}
                    className="glass-card min-h-[320px] w-full resize-none rounded-2xl p-3.5 font-mono text-[12.5px] leading-relaxed text-[var(--text-primary)] outline-none"
                  />
                  <div className="glass-card min-h-[320px] overflow-y-auto rounded-2xl p-4">
                    {activeNote.content
                      .split('\n')
                      .map((line, idx) => renderPreviewLine(line, idx))}
                  </div>
                </div>
              ) : (
                <div className="glass-card flex h-[340px] items-center justify-center rounded-2xl p-4">
                  <svg viewBox="0 0 520 280" className="h-full w-full">
                    {state.notes.map((n, idx) => {
                      const angle = (idx / Math.max(1, state.notes.length)) * Math.PI * 2
                      const x = 260 + Math.cos(angle) * 145
                      const y = 140 + Math.sin(angle) * 92
                      const links = extractWikiLinks(n.content)
                      return (
                        <g key={`edges-${n.id}`}>
                          {links.map((targetTitle) => {
                            const tIdx = state.notes.findIndex((item) => item.title === targetTitle)
                            if (tIdx < 0) return null
                            const tAngle = (tIdx / Math.max(1, state.notes.length)) * Math.PI * 2
                            const tx = 260 + Math.cos(tAngle) * 145
                            const ty = 140 + Math.sin(tAngle) * 92
                            return (
                              <line
                                key={`${n.id}-${tIdx}`}
                                x1={x}
                                y1={y}
                                x2={tx}
                                y2={ty}
                                stroke="var(--accent-primary)"
                                strokeOpacity="0.45"
                                strokeWidth="1.8"
                              />
                            )
                          })}
                        </g>
                      )
                    })}
                    {state.notes.map((n, idx) => {
                      const angle = (idx / Math.max(1, state.notes.length)) * Math.PI * 2
                      const x = 260 + Math.cos(angle) * 145
                      const y = 140 + Math.sin(angle) * 92
                      const isCurrent = n.id === activeNote.id
                      return (
                        <g
                          key={n.id}
                          onClick={() => {
                            setActiveId(n.id)
                            setMode('编辑')
                          }}
                          className="cursor-pointer"
                        >
                          <circle
                            cx={x}
                            cy={y}
                            r={isCurrent ? 16 : 12}
                            fill={isCurrent ? 'var(--accent-primary)' : 'var(--action-teal)'}
                          />
                          <text
                            x={x}
                            y={y + 28}
                            textAnchor="middle"
                            className="fill-[var(--text-primary)] text-[10.5px] font-medium"
                          >
                            {n.title.slice(0, 12)}
                          </text>
                        </g>
                      )
                    })}
                  </svg>
                </div>
              )}
            </div>

            {/* Bottom Outgoing & Backlinks */}
            <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--glass-inner-border)] pt-3 sm:grid-cols-2">
              <div>
                <div className="mb-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  正向链接到
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {outgoingLinks.length === 0 ? (
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                      正文输入 [[标题]] 即可建立双链
                    </span>
                  ) : (
                    outgoingLinks.map((lk) => (
                      <button
                        key={lk}
                        type="button"
                        onClick={() => jumpToTitle(lk)}
                        className="glass-card cursor-pointer rounded-lg px-2.5 py-1 text-[11.5px] font-medium text-[var(--accent-primary)]"
                      >
                        → {lk}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <div className="mb-1.5 text-[11px] font-semibold text-[var(--text-muted)]">
                  反向链接（引用本篇的笔记）
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {backlinks.length === 0 ? (
                    <span className="text-[11.5px] text-[var(--text-muted)]">
                      暂时没有其他笔记链接到这里
                    </span>
                  ) : (
                    backlinks.map((bk) => (
                      <button
                        key={bk.id}
                        type="button"
                        onClick={() => setActiveId(bk.id)}
                        className="glass-card cursor-pointer rounded-lg px-2.5 py-1 text-[11.5px] font-medium text-[var(--text-primary)]"
                      >
                        ← {bk.title}
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
