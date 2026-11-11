import { Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { NAV_MODULES } from '../data/navModules'
import type { ModuleId } from '../types'

interface ModuleSheetProps {
  activeModule: ModuleId
  onClose: () => void
  children: ReactNode
}

export function ModuleSheet({ activeModule, onClose, children }: ModuleSheetProps) {
  const [expanded, setExpanded] = useState(false)
  const meta = NAV_MODULES.find((m) => m.id === activeModule)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  if (activeModule === 'workbench' || !meta) return null

  const Icon = meta.icon

  return (
    <div
      className="fixed inset-y-0 right-0 z-20 flex items-center pl-[242px] pr-3.5 py-3.5 max-lg:pl-3.5"
      style={{ left: 0 }}
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 bg-slate-900/12 backdrop-blur-[7px] dark:bg-black/35" />

      <section
        onClick={(e) => e.stopPropagation()}
        className={`glass-sheet relative z-10 flex flex-col overflow-hidden rounded-[28px] transition-all duration-300 ${
          expanded ? 'w-full' : 'w-full max-w-[920px]'
        }`}
        style={{ height: 'calc(100vh - 28px)' }}
      >
        <header className="flex shrink-0 items-center justify-between border-b border-[var(--glass-inner-border)] px-7 py-5">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <div className="text-[11.5px] font-medium text-[var(--text-muted)]">
                {meta.subtitle}
              </div>
              <h2 className="m-0 text-[22px] font-bold tracking-tight text-[var(--text-primary)]">
                {meta.label}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? '恢复标准抽屉宽度' : '展开至宽屏视野'}
              className="glass-subcard flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              {expanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              title="关闭返回工作台 (ESC)"
              className="glass-subcard flex h-9 w-9 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:text-[var(--text-primary)]"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
      </section>
    </div>
  )
}
