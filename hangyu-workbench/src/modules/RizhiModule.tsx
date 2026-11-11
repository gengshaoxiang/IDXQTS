import { Check, Copy, Plus, RotateCw } from 'lucide-react'
import { useState } from 'react'
import type { BookItem, HangyuState } from '../types'

interface RizhiModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

const SPINE_COLORS = ['#1d4f5f', '#4f46e5', '#1f7a5c', '#9333ea', '#b45309', '#be123c']

export function RizhiModule({ state, updateState }: RizhiModuleProps) {
  const [tab, setTab] = useState<'早间14栏' | '我的书架' | '印尼语闪卡'>('早间14栏')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [selectedBookId, setSelectedBookId] = useState(state.books[0]?.id ?? '')
  const [flippedCardId, setFlippedCardId] = useState<string | null>(null)

  // New book state
  const [bookTitle, setBookTitle] = useState('')
  const [bookAuthor, setBookAuthor] = useState('')
  const [bookPages, setBookPages] = useState(320)
  const [bookColor, setBookColor] = useState(SPINE_COLORS[0])

  const doneColumns = state.rizhiColumns.filter((c) => c.todayDone).length
  const totalArchived = state.rizhiColumns.reduce((acc, c) => acc + c.lessonCount, 0)
  const readingBooks = state.books.filter((b) => b.status === '在读').length
  const masteredIndo = state.indoCards.filter((c) => c.mastered).length

  const toggleColumnDone = (id: string) => {
    updateState((prev) => ({
      ...prev,
      rizhiColumns: prev.rizhiColumns.map((c) => {
        if (c.id !== id) return c
        const nextDone = !c.todayDone
        return {
          ...c,
          todayDone: nextDone,
          lessonCount: nextDone ? c.lessonCount + 1 : Math.max(1, c.lessonCount - 1),
        }
      }),
    }))
  }

  const copyShareSummary = (id: string, text: string) => {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopiedId(id)
    window.setTimeout(() => setCopiedId(null), 1600)
  }

  const addBook = () => {
    if (!bookTitle.trim()) return
    const newBook: BookItem = {
      id: `b-${Date.now()}`,
      title: bookTitle.trim(),
      author: bookAuthor.trim() || '未知作者',
      status: '在读',
      currentPage: 0,
      totalPages: Math.max(20, bookPages),
      spineColor: bookColor,
      takeaway: '记录本书对战略判断、管理实践或日常生活的启发...',
    }
    updateState((prev) => ({ ...prev, books: [...prev.books, newBook] }))
    setSelectedBookId(newBook.id)
    setBookTitle('')
    setBookAuthor('')
  }

  const selectedBook = state.books.find((b) => b.id === selectedBookId) ?? state.books[0]

  return (
    <div className="flex flex-col gap-5">
      {/* Top KPIs */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">今日 14 栏核验</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {doneColumns} / 14
          </div>
          <div className="text-[10.5px] text-emerald-500">07:05 首轮 · 08:00 补漏</div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">累计归档课次</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--accent-primary)]">
            {totalArchived}
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">全文回读防重连续编号</div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">正在精读书籍</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {readingBooks} 本
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">共 {state.books.length} 本在架</div>
        </div>
        <div className="glass-subcard rounded-2xl p-4">
          <div className="text-[11.5px] text-[var(--text-muted)]">印尼语高频句库</div>
          <div className="tabular-nums mt-1 text-[24px] font-bold text-[var(--text-primary)]">
            {masteredIndo} / {state.indoCards.length}
          </div>
          <div className="text-[10.5px] text-[var(--text-muted)]">今日新课 + 次日复盘</div>
        </div>
      </div>

      {/* Tabs */}
      <div className="inline-flex w-fit rounded-2xl bg-black/5 p-1 dark:bg-white/5">
        {(['早间14栏', '我的书架', '印尼语闪卡'] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`cursor-pointer rounded-xl px-5 py-2 text-[12.5px] font-semibold transition ${
              tab === t
                ? 'bg-white text-[var(--text-primary)] shadow-xs dark:bg-slate-800'
                : 'text-[var(--text-muted)]'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === '早间14栏' && (
        <div className="flex flex-col gap-4">
          {(['政经与行业简报', '系统长线课程'] as const).map((grp) => (
            <div key={grp} className="glass-subcard rounded-3xl p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="m-0 text-[15px] font-bold text-[var(--text-primary)]">
                  「日知」· {grp}
                </h3>
                <span className="text-[11px] text-[var(--text-muted)]">
                  Asia/Jakarta 06:00–07:05 准点流水线
                </span>
              </div>

              <div className="grid grid-cols-1 gap-2.5 md:grid-cols-2">
                {state.rizhiColumns
                  .filter((c) => c.group === grp)
                  .map((col) => (
                    <div
                      key={col.id}
                      className="glass-card flex flex-col justify-between rounded-2xl p-3.5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="tabular-nums rounded-lg bg-[var(--accent-soft)] px-2 py-0.5 text-[11px] font-bold text-[var(--accent-primary)]">
                              {col.timeSlot}
                            </span>
                            <span className="text-[13.5px] font-bold text-[var(--text-primary)]">
                              {col.title}
                            </span>
                          </div>
                          <span className="tabular-nums text-[11px] text-[var(--text-muted)]">
                            第 {String(col.lessonCount).padStart(3, '0')} 期
                          </span>
                        </div>

                        <div className="mt-2 text-[12px] font-medium text-[var(--text-primary)]">
                          {col.latestTopic}
                        </div>
                        <div className="mt-0.5 text-[11px] text-[var(--text-muted)]">
                          {col.summary}
                        </div>
                      </div>

                      <div className="mt-3 flex items-center justify-between border-t border-[var(--glass-inner-border)] pt-2.5">
                        <button
                          type="button"
                          onClick={() =>
                            copyShareSummary(
                              col.id,
                              `【日知 · ${col.title}】第${col.lessonCount}期\n${col.latestTopic}\n核心导读：${col.summary}`
                            )
                          }
                          className="flex cursor-pointer items-center gap-1 text-[11px] text-[var(--text-secondary)] hover:text-[var(--accent-primary)]"
                        >
                          <Copy className="h-3 w-3" />
                          <span>{copiedId === col.id ? '已复制分享卡片' : '复制摘要分享'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => toggleColumnDone(col.id)}
                          className={`flex cursor-pointer items-center gap-1 rounded-xl px-3 py-1 text-[11.5px] font-medium transition ${
                            col.todayDone
                              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                              : 'btn-teal'
                          }`}
                        >
                          <Check className="h-3 w-3" />
                          <span>{col.todayDone ? '今日已阅归档' : '标记已读'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === '我的书架' && (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
          {/* Book Spine Visual Shelf (matching Image 10!) */}
          <div className="glass-subcard flex flex-col justify-between rounded-3xl p-5 lg:col-span-7">
            <div>
              <div className="text-[11px] text-[var(--text-muted)]">精读书架</div>
              <h3 className="m-0 mt-0.5 text-[18px] font-bold text-[var(--text-primary)]">
                把进度留在书脊上
              </h3>
            </div>

            <div className="my-6 flex min-h-[220px] items-end gap-3 overflow-x-auto px-2 pb-2">
              {state.books.map((b) => {
                const pct = Math.round((b.currentPage / Math.max(1, b.totalPages)) * 100)
                const active = selectedBook?.id === b.id
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setSelectedBookId(b.id)}
                    style={{ backgroundColor: b.spineColor }}
                    className={`relative flex h-[196px] w-[54px] shrink-0 cursor-pointer flex-col items-center justify-between rounded-t-xl px-1.5 py-3 text-white shadow-md transition-all hover:-translate-y-1.5 ${
                      active ? 'ring-3 ring-[var(--accent-primary)] -translate-y-1.5' : 'opacity-90'
                    }`}
                  >
                    <span className="text-[10px] opacity-80">{pct}%</span>
                    <span
                      className="text-[12.5px] font-bold tracking-widest"
                      style={{ writingMode: 'vertical-rl' }}
                    >
                      {b.title.slice(0, 8)}
                    </span>
                    <span className="h-1 w-6 rounded-full bg-white/45" />
                  </button>
                )
              })}
            </div>

            <div className="h-3 w-full rounded-full bg-gradient-to-r from-amber-800/75 via-amber-700/75 to-amber-900/75 shadow-inner" />
          </div>

          {/* Right Book Inspector & Add Form */}
          <div className="flex flex-col gap-4 lg:col-span-5">
            {selectedBook && (
              <div className="glass-subcard rounded-3xl p-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-lg bg-[var(--accent-soft)] px-2.5 py-0.5 text-[11px] font-semibold text-[var(--accent-primary)]">
                    {selectedBook.status}
                  </span>
                  <span className="tabular-nums text-[12px] text-[var(--text-muted)]">
                    {selectedBook.currentPage} / {selectedBook.totalPages} 页
                  </span>
                </div>
                <div className="mt-2 text-[17px] font-bold text-[var(--text-primary)]">
                  《{selectedBook.title}》
                </div>
                <div className="text-[12px] text-[var(--text-muted)]">{selectedBook.author}</div>

                <input
                  type="range"
                  min={0}
                  max={selectedBook.totalPages}
                  value={selectedBook.currentPage}
                  onChange={(e) => {
                    const page = Number(e.target.value)
                    updateState((prev) => ({
                      ...prev,
                      books: prev.books.map((b) =>
                        b.id === selectedBook.id
                          ? {
                              ...b,
                              currentPage: page,
                              status: page >= b.totalPages ? '已读' : page > 0 ? '在读' : '想读',
                            }
                          : b
                      ),
                    }))
                  }}
                  className="my-3 w-full accent-[var(--action-teal)]"
                />

                <textarea
                  value={selectedBook.takeaway}
                  onChange={(e) =>
                    updateState((prev) => ({
                      ...prev,
                      books: prev.books.map((b) =>
                        b.id === selectedBook.id ? { ...b, takeaway: e.target.value } : b
                      ),
                    }))
                  }
                  rows={3}
                  className="glass-card w-full resize-none rounded-xl p-2.5 text-[12px] text-[var(--text-secondary)] outline-none"
                />
              </div>
            )}

            <div className="glass-subcard rounded-3xl p-5">
              <div className="mb-2.5 text-[14px] font-bold text-[var(--text-primary)]">
                添加到书架
              </div>
              <div className="flex flex-col gap-2.5">
                <input
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="书名"
                  className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={bookAuthor}
                    onChange={(e) => setBookAuthor(e.target.value)}
                    placeholder="作者"
                    className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
                  />
                  <input
                    type="number"
                    value={bookPages}
                    onChange={(e) => setBookPages(Number(e.target.value))}
                    placeholder="总页数"
                    className="glass-card rounded-xl px-3 py-2 text-[12.5px] outline-none"
                  />
                </div>
                <div className="flex items-center gap-2 py-1">
                  {SPINE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setBookColor(c)}
                      style={{ backgroundColor: c }}
                      className={`h-6 w-6 cursor-pointer rounded-full ${
                        bookColor === c ? 'ring-2 ring-offset-2 ring-[var(--accent-primary)]' : ''
                      }`}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  onClick={addBook}
                  className="btn-teal flex cursor-pointer items-center justify-center gap-1.5 rounded-xl py-2 text-[12.5px] font-medium"
                >
                  <Plus className="h-4 w-4" />
                  <span>放入书架</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === '印尼语闪卡' && (
        <div className="grid grid-cols-1 gap-3.5 md:grid-cols-2">
          {state.indoCards.map((card) => {
            const isFlipped = flippedCardId === card.id
            return (
              <div
                key={card.id}
                onClick={() => setFlippedCardId(isFlipped ? null : card.id)}
                className="glass-subcard flex min-h-[165px] cursor-pointer flex-col justify-between rounded-3xl p-5 transition hover:border-[var(--accent-primary)]/40"
              >
                <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)]">
                  <span>场景：{card.scene}</span>
                  <span className="flex items-center gap-1 text-[var(--accent-primary)]">
                    <RotateCw className="h-3 w-3" />
                    点击翻转释义
                  </span>
                </div>

                <div className="my-3">
                  <div className="text-[16px] font-bold text-[var(--text-primary)]">
                    {card.indo}
                  </div>
                  <div className="mt-1 text-[12px] text-[var(--text-muted)]">{card.phonetic}</div>
                  {isFlipped && (
                    <div className="mt-2.5 rounded-xl bg-[var(--accent-soft)] px-3 py-2 text-[13px] font-semibold text-[var(--accent-primary)]">
                      {card.zh}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      updateState((prev) => ({
                        ...prev,
                        indoCards: prev.indoCards.map((c) =>
                          c.id === card.id ? { ...c, mastered: !c.mastered } : c
                        ),
                      }))
                    }}
                    className={`cursor-pointer rounded-xl px-3 py-1 text-[11.5px] font-medium ${
                      card.mastered
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                        : 'btn-teal'
                    }`}
                  >
                    {card.mastered ? '已熟练掌握' : '标记已复盘'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
