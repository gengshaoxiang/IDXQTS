import { Check, Download, Lock, RotateCcw, Shield, Upload } from 'lucide-react'
import { useState } from 'react'
import { INITIAL_HANGYU_STATE } from '../data/seedData'
import type {
  AccentTheme,
  FontScale,
  HangyuState,
  ThemeMode,
} from '../types'

interface SettingsVaultModuleProps {
  state: HangyuState
  updateState: (updater: (prev: HangyuState) => HangyuState) => void
  onExportJson: () => void
  onImportJson: (raw: string) => boolean
  onResetDefault: () => void
}

const ACCENTS: { id: AccentTheme; label: string; color: string }[] = [
  { id: 'indigo', label: '星海靛', color: '#5b67f1' },
  { id: 'violet', label: '暮光紫', color: '#7c3aed' },
  { id: 'forest', label: '日知森绿', color: '#1f7a5c' },
  { id: 'rose', label: '赤道珊红', color: '#e11d48' },
  { id: 'ocean', label: '远洋深青', color: '#1d4f5f' },
  { id: 'slate', label: '曜石沉灰', color: '#334155' },
]

export function SettingsVaultModule({
  state,
  updateState,
  onExportJson,
  onImportJson,
  onResetDefault,
}: SettingsVaultModuleProps) {
  const [importMsg, setImportMsg] = useState<string | null>(null)
  const [vaultLabel, setVaultLabel] = useState('')
  const [vaultAccount, setVaultAccount] = useState('')
  const [vaultNote, setVaultNote] = useState('')

  const setSettingsField = <K extends keyof HangyuState['settings']>(
    key: K,
    value: HangyuState['settings'][K]
  ) => {
    updateState((prev) => ({
      ...prev,
      settings: { ...prev.settings, [key]: value },
    }))
  }

  const toggleCardVisibility = (id: string) => {
    updateState((prev) => ({
      ...prev,
      bentoCards: prev.bentoCards.map((c) =>
        c.id === id ? { ...c, visible: !c.visible } : c
      ),
    }))
  }

  const addVaultMemo = () => {
    if (!vaultLabel.trim()) return
    updateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        vaultRecords: [
          ...prev.settings.vaultRecords,
          {
            id: `v-${Date.now()}`,
            label: vaultLabel.trim(),
            account: vaultAccount.trim() || '本机备忘索引',
            maskedValue: '本地离线保存',
            note: vaultNote.trim(),
          },
        ],
      },
    }))
    setVaultLabel('')
    setVaultAccount('')
    setVaultNote('')
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Appearance Panel matching Image 15 */}
      <div className="glass-subcard rounded-3xl p-6">
        <h3 className="m-0 mb-4 text-[16px] font-bold text-[var(--text-primary)]">外观与品牌定制</h3>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {(
            [
              { id: 'light', label: '浅色晨雾' },
              { id: 'dark', label: '深色夜航' },
              { id: 'auto', label: '跟随系统' },
            ] as { id: ThemeMode; label: string }[]
          ).map((m) => {
            const active = state.settings.themeMode === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setSettingsField('themeMode', m.id)}
                className={`cursor-pointer rounded-2xl border p-3 text-center transition ${
                  active
                    ? 'border-[var(--accent-primary)] ring-2 ring-[var(--accent-primary)]/35'
                    : 'border-[var(--glass-inner-border)]'
                }`}
              >
                <div
                  className={`mb-2 h-14 w-full rounded-xl border ${
                    m.id === 'light'
                      ? 'border-slate-200 bg-gradient-to-r from-slate-100 to-white'
                      : m.id === 'dark'
                        ? 'border-slate-700 bg-gradient-to-r from-slate-900 to-slate-800'
                        : 'border-slate-300 bg-gradient-to-r from-slate-100 via-white to-slate-900'
                  }`}
                />
                <span className="text-[12.5px] font-semibold text-[var(--text-primary)]">
                  {m.label}
                </span>
              </button>
            )
          })}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-inner-border)] pt-4">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">主题强调色</div>
            <div className="text-[11px] text-[var(--text-muted)]">
              用于左侧导航激活胶囊、图表曲线与关键徽章（含日知森林绿）
            </div>
          </div>
          <div className="flex items-center gap-2.5">
            {ACCENTS.map((ac) => (
              <button
                key={ac.id}
                type="button"
                title={ac.label}
                onClick={() => setSettingsField('accentTheme', ac.id)}
                style={{ backgroundColor: ac.color }}
                className={`h-7 w-7 cursor-pointer rounded-full transition hover:scale-110 ${
                  state.settings.accentTheme === ac.id
                    ? 'ring-3 ring-offset-2 ring-[var(--text-primary)]'
                    : ''
                }`}
              />
            ))}
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--glass-inner-border)] pt-4">
          <div>
            <div className="text-[13px] font-semibold text-[var(--text-primary)]">界面字号密度</div>
            <div className="text-[11px] text-[var(--text-muted)]">同时调整工作台与舱室阅读字号</div>
          </div>
          <div className="inline-flex rounded-xl bg-black/5 p-1 dark:bg-white/5">
            {(
              [
                { id: 'compact', label: '紧凑' },
                { id: 'standard', label: '标准' },
                { id: 'relaxed', label: '舒展' },
              ] as { id: FontScale; label: string }[]
            ).map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSettingsField('fontScale', f.id)}
                className={`cursor-pointer rounded-lg px-3.5 py-1 text-[12px] font-medium ${
                  state.settings.fontScale === f.id
                    ? 'bg-white text-[var(--text-primary)] shadow-xs dark:bg-slate-800'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 border-t border-[var(--glass-inner-border)] pt-4 sm:grid-cols-12">
          <div className="sm:col-span-4">
            <label className="text-[11.5px] font-semibold text-[var(--text-muted)]">
              工作台专属名称
            </label>
            <input
              value={state.settings.brandName}
              maxLength={8}
              onChange={(e) => setSettingsField('brandName', e.target.value)}
              className="glass-card mt-1 w-full rounded-xl px-3 py-2 text-[13px] font-bold outline-none"
            />
          </div>
          <div className="sm:col-span-8">
            <label className="text-[11.5px] font-semibold text-[var(--text-muted)]">
              顶部座右铭问候语
            </label>
            <input
              value={state.settings.greetingMotto}
              maxLength={36}
              onChange={(e) => setSettingsField('greetingMotto', e.target.value)}
              className="glass-card mt-1 w-full rounded-xl px-3.5 py-2 text-[13px] outline-none"
            />
          </div>
        </div>
      </div>

      {/* Home Bento Cards Config matching Image 15 */}
      <div className="glass-subcard rounded-3xl p-6">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <h3 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">主页卡片编排</h3>
            <div className="text-[11.5px] text-[var(--text-muted)]">
              选择「我的一天」显示模块，排序与宽度可直接在主页右上角微调
            </div>
          </div>
          <button
            type="button"
            onClick={() =>
              updateState((prev) => ({
                ...prev,
                bentoCards: INITIAL_HANGYU_STATE.bentoCards,
              }))
            }
            className="glass-card cursor-pointer rounded-xl px-3 py-1.5 text-[12px] text-[var(--text-secondary)]"
          >
            恢复默认布局
          </button>
        </div>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {state.bentoCards.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => toggleCardVisibility(c.id)}
              className="glass-card flex cursor-pointer items-center justify-between rounded-2xl px-4 py-3 text-left"
            >
              <div>
                <div className="text-[13px] font-bold text-[var(--text-primary)]">{c.subtitle}</div>
                <div className="text-[11px] text-[var(--text-muted)]">
                  宽度 {c.colSpan}/12 列 · {c.title}
                </div>
              </div>
              <span
                className={`flex h-5 w-5 items-center justify-center rounded-full ${
                  c.visible ? 'bg-[var(--action-teal)] text-white' : 'border border-slate-400/50'
                }`}
              >
                {c.visible && <Check className="h-3 w-3" />}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Local Safe Memo Vault (inspired by Image 7) */}
      <div className="glass-subcard rounded-3xl p-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-[var(--accent-primary)]" />
          <h3 className="m-0 text-[16px] font-bold text-[var(--text-primary)]">
            本机差旅与流程备忘保险匣
          </h3>
        </div>
        <div className="mb-3 text-[11.5px] text-[var(--text-muted)]">
          仅用于保存非明文密钥类的差旅核对项、证件照规格与工作流操作准则，不上传云端。
        </div>

        <div className="mb-3 grid grid-cols-1 gap-2.5 md:grid-cols-2">
          {state.settings.vaultRecords.map((rec) => (
            <div key={rec.id} className="glass-card rounded-2xl p-3.5">
              <div className="flex items-center justify-between">
                <span className="text-[13px] font-bold text-[var(--text-primary)]">{rec.label}</span>
                <span className="flex items-center gap-1 text-[10.5px] text-[var(--accent-primary)]">
                  <Lock className="h-3 w-3" />
                  {rec.maskedValue}
                </span>
              </div>
              <div className="mt-1 text-[11.5px] font-medium text-[var(--text-secondary)]">
                {rec.account}
              </div>
              <div className="mt-1 text-[11px] text-[var(--text-muted)]">{rec.note}</div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-12">
          <input
            value={vaultLabel}
            onChange={(e) => setVaultLabel(e.target.value)}
            placeholder="备忘标题"
            className="glass-card rounded-xl px-3 py-2 text-[12px] outline-none sm:col-span-3"
          />
          <input
            value={vaultAccount}
            onChange={(e) => setVaultAccount(e.target.value)}
            placeholder="关联索引说明"
            className="glass-card rounded-xl px-3 py-2 text-[12px] outline-none sm:col-span-3"
          />
          <input
            value={vaultNote}
            onChange={(e) => setVaultNote(e.target.value)}
            placeholder="详细核对备注..."
            className="glass-card rounded-xl px-3 py-2 text-[12px] outline-none sm:col-span-4"
          />
          <button
            type="button"
            onClick={addVaultMemo}
            className="btn-teal cursor-pointer rounded-xl py-2 text-[12px] font-medium sm:col-span-2"
          >
            存入本机
          </button>
        </div>
      </div>

      {/* Backup & Restore */}
      <div className="glass-subcard rounded-3xl p-6">
        <h3 className="m-0 mb-2 text-[16px] font-bold text-[var(--text-primary)]">
          数据主权与本地备份迁移
        </h3>
        <div className="mb-4 text-[12px] text-[var(--text-muted)]">
          可随时导出完整 JSON 快照备份到个人硬盘，或在新设备一键恢复。
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onExportJson}
            className="btn-teal flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-medium"
          >
            <Download className="h-4 w-4" />
            <span>导出全量 JSON 备份</span>
          </button>

          <label className="glass-card flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-medium text-[var(--text-primary)]">
            <Upload className="h-4 w-4" />
            <span>从 JSON 备份恢复</span>
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (!file) return
                const reader = new FileReader()
                reader.onload = () => {
                  const ok = onImportJson(String(reader.result ?? ''))
                  setImportMsg(ok ? '备份导入成功，已恢复全部航屿数据。' : 'JSON 文件格式无效。')
                }
                reader.readAsText(file)
              }}
            />
          </label>

          <button
            type="button"
            onClick={onResetDefault}
            className="glass-card flex cursor-pointer items-center gap-1.5 rounded-xl px-4 py-2 text-[12.5px] font-medium text-rose-500"
          >
            <RotateCcw className="h-4 w-4" />
            <span>恢复初始预设数据</span>
          </button>
        </div>

        {importMsg && (
          <div className="mt-3 text-[12px] font-medium text-emerald-500">{importMsg}</div>
        )}
      </div>
    </div>
  )
}
