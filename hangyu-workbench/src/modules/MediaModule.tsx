import { CheckCircle2, Copy, Plus, ShieldCheck } from 'lucide-react'
import { useState } from 'react'
import type { HangyuState, MediaDraft } from '../types'

interface MediaModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
}

const PLATFORMS: ('全部渠道' | MediaDraft['platform'])[] = [
  '全部渠道',
  '微信公众号',
  '小红书',
  'AI评论专栏',
  '小说创作',
]

export function MediaModule({ state, updateState }: MediaModuleProps) {
  const [platformFilter, setPlatformFilter] = useState<'全部渠道' | MediaDraft['platform']>('全部渠道')
  const [selectedId, setSelectedId] = useState(state.mediaDrafts[0]?.id ?? '')
  const [copied, setCopied] = useState(false)

  const list = state.mediaDrafts.filter(
    (d) => platformFilter === '全部渠道' || d.platform === platformFilter
  )
  const active = state.mediaDrafts.find((d) => d.id === selectedId) ?? list[0] ?? state.mediaDrafts[0]

  const patchActive = (patch: Partial<MediaDraft>) => {
    if (!active) return
    updateState((prev) => ({
      ...prev,
      mediaDrafts: prev.mediaDrafts.map((m) =>
        m.id === active.id ? { ...m, ...patch, updatedAt: '2026-11-11' } : m
      ),
    }))
  }

  const createDraft = () => {
    const id = `m-${Date.now()}`
    const next: MediaDraft = {
      id,
      title: '新选题草稿：从一线真实管理场景拆解 AI 落地边界',
      platform: platformFilter === '全部渠道' ? '微信公众号' : platformFilter,
      stage: '选题池',
      hook: '先抛出反常识判断，再给出可复制的拆解框架。',
      body: '第一部分：玩家亲测体感\n\n第二部分：商业与成本基率判断\n\n第三部分：组织管理者的落地抓手',
      desensitized: true,
      updatedAt: '2026-11-11',
    }
    updateState((prev) => ({ ...prev, mediaDrafts: [next, ...prev.mediaDrafts] }))
    setSelectedId(id)
  }

  const copyMobileFormatted = () => {
    if (!active) return
    const formatted = `${active.title}\n\n💡 核心导语\n${active.hook}\n\n${active.body}\n\n—— 船长手记 · 航屿工坊`
    navigator.clipboard?.writeText(formatted).catch(() => {})
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {PLATFORMS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPlatformFilter(p)}
              className={`cursor-pointer rounded-xl px-3.5 py-1.5 text-[12px] font-medium transition ${
                platformFilter === p
                  ? 'nav-pill-active text-white'
                  : 'glass-subcard text-[var(--text-secondary)]'
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={createDraft}
          className="btn-teal flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-medium"
        >
          <Plus className="h-4 w-4" />
          <span>新建选题</span>
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left Pipeline List */}
        <div className="flex flex-col gap-2.5 lg:col-span-5">
          {list.map((d) => {
            const isSelected = active?.id === d.id
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedId(d.id)}
                className={`cursor-pointer rounded-2xl p-4 text-left transition ${
                  isSelected
                    ? 'glass-card ring-2 ring-[var(--accent-primary)]/50'
                    : 'glass-subcard hover:opacity-95'
                }`}
              >
                <div className="flex items-center justify-between text-[11px]">
                  <span className="rounded-md bg-[var(--accent-soft)] px-2 py-0.5 font-semibold text-[var(--accent-primary)]">
                    {d.platform}
                  </span>
                  <span className="text-[var(--text-muted)]">{d.stage}</span>
                </div>
                <div className="mt-2 line-clamp-2 text-[13.5px] font-bold text-[var(--text-primary)]">
                  {d.title}
                </div>
                <div className="mt-1 line-clamp-2 text-[11.5px] text-[var(--text-muted)]">
                  {d.hook}
                </div>
              </button>
            )
          })}
        </div>

        {/* Right Editor & Mobile Copy Preview */}
        <div className="glass-subcard flex flex-col gap-3.5 rounded-3xl p-5 lg:col-span-7">
          {active && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <select
                    value={active.platform}
                    onChange={(e) =>
                      patchActive({ platform: e.target.value as MediaDraft['platform'] })
                    }
                    className="glass-card rounded-xl px-3 py-1.5 text-[12px] outline-none"
                  >
                    <option value="微信公众号">微信公众号</option>
                    <option value="小红书">小红书</option>
                    <option value="AI评论专栏">AI评论专栏</option>
                    <option value="小说创作">小说创作</option>
                  </select>
                  <select
                    value={active.stage}
                    onChange={(e) =>
                      patchActive({ stage: e.target.value as MediaDraft['stage'] })
                    }
                    className="glass-card rounded-xl px-3 py-1.5 text-[12px] outline-none"
                  >
                    <option value="选题池">选题池</option>
                    <option value="撰写中">撰写中</option>
                    <option value="待排版">待排版</option>
                    <option value="已发布">已发布</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={copyMobileFormatted}
                  className="btn-teal flex cursor-pointer items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-[12px] font-medium"
                >
                  <Copy className="h-3.5 w-3.5" />
                  <span>{copied ? '已复制移动端排版文本' : '一键复制公众号排版'}</span>
                </button>
              </div>

              <input
                value={active.title}
                onChange={(e) => patchActive({ title: e.target.value })}
                className="glass-card rounded-xl px-3.5 py-2.5 text-[15px] font-bold text-[var(--text-primary)] outline-none"
              />

              <div>
                <div className="mb-1 text-[11px] font-semibold text-[var(--text-muted)]">
                  开篇金句 / 破题冲击力导语
                </div>
                <input
                  value={active.hook}
                  onChange={(e) => patchActive({ hook: e.target.value })}
                  className="glass-card w-full rounded-xl px-3.5 py-2 text-[12.5px] text-[var(--text-secondary)] outline-none"
                />
              </div>

              <textarea
                value={active.body}
                onChange={(e) => patchActive({ body: e.target.value })}
                rows={9}
                className="glass-card w-full resize-none rounded-2xl p-3.5 text-[13px] leading-relaxed text-[var(--text-primary)] outline-none"
              />

              <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 px-3.5 py-2.5 text-[11.5px]">
                <button
                  type="button"
                  onClick={() => patchActive({ desensitized: !active.desensitized })}
                  className="flex cursor-pointer items-center gap-2 font-medium text-emerald-700 dark:text-emerald-300"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>
                    公开内容合规护栏：
                    {active.desensitized
                      ? '已确认不含企业内部敏感数据与未公开经营信息'
                      : '待人工复核脱敏'}
                  </span>
                </button>
                <span className="flex items-center gap-1 text-[var(--text-muted)]">
                  <CheckCircle2 className="h-3.5 w-3.5 text-[var(--accent-primary)]" />
                  玩家体验 + 商业判断 + 管理者视角
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
