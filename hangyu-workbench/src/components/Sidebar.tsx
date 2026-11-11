import { ChevronLeft, ChevronRight, Moon, Sun } from 'lucide-react'
import { NAV_MODULES } from '../data/navModules'
import type { ModuleId } from '../types'

interface SidebarProps {
  brandName: string
  activeModule: ModuleId
  onSelectModule: (id: ModuleId) => void
  isDark: boolean
  onToggleDark: () => void
  collapsed: boolean
  onToggleCollapse: () => void
}

export function Sidebar({
  brandName,
  activeModule,
  onSelectModule,
  isDark,
  onToggleDark,
  collapsed,
  onToggleCollapse,
}: SidebarProps) {
  return (
    <aside
      className={`glass-card relative z-30 flex shrink-0 flex-col justify-between rounded-[26px] transition-all duration-300 ${
        collapsed ? 'w-[74px] px-2.5 py-4' : 'w-[214px] px-3.5 py-4'
      }`}
      style={{ height: 'calc(100vh - 28px)' }}
    >
      <button
        type="button"
        onClick={onToggleCollapse}
        title={collapsed ? '展开导航栏' : '收起导航栏'}
        className="glass-card absolute -right-3 top-14 z-40 flex h-6 w-6 cursor-pointer items-center justify-center rounded-full text-[var(--text-secondary)] transition hover:scale-105 hover:text-[var(--text-primary)]"
      >
        {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
      </button>

      <div>
        <div
          onClick={() => onSelectModule('workbench')}
          className={`mb-4 flex cursor-pointer items-center gap-3 px-2 py-1.5 ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <div className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#4f46e5] shadow-md">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-300 shadow-[0_0_12px_#7dd3fc]" />
            <span className="absolute inset-1 rounded-lg border border-white/15" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <div className="truncate text-[17px] font-bold tracking-wide text-[var(--text-primary)]">
                {brandName}
              </div>
              <div className="truncate text-[10px] font-medium tracking-wider text-[var(--text-muted)]">
                CAPTAIN OS
              </div>
            </div>
          )}
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_MODULES.map((item) => {
            const Icon = item.icon
            const active = activeModule === item.id
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectModule(item.id)}
                title={collapsed ? `${item.label} · ${item.subtitle}` : undefined}
                className={`group flex cursor-pointer items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[13.5px] font-medium transition-all ${
                  collapsed ? 'justify-center px-0' : ''
                } ${
                  active
                    ? 'nav-pill-active'
                    : 'text-[var(--text-secondary)] hover:bg-black/[0.04] hover:text-[var(--text-primary)] dark:hover:bg-white/[0.05]'
                }`}
              >
                <Icon
                  className={`h-[17px] w-[17px] shrink-0 transition-transform group-hover:scale-105 ${
                    active ? 'text-white' : 'text-[var(--text-secondary)]'
                  }`}
                />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </button>
            )
          })}
        </nav>
      </div>

      <div className="mt-3 border-t border-[var(--glass-inner-border)] pt-3">
        <button
          type="button"
          onClick={onToggleDark}
          className={`glass-subcard flex w-full cursor-pointer items-center gap-2.5 rounded-2xl px-3 py-2 text-[13px] font-medium text-[var(--text-secondary)] transition hover:text-[var(--text-primary)] ${
            collapsed ? 'justify-center px-0' : ''
          }`}
        >
          {isDark ? (
            <Sun className="h-4 w-4 shrink-0 text-amber-400" />
          ) : (
            <Moon className="h-4 w-4 shrink-0 text-indigo-500" />
          )}
          {!collapsed && <span>{isDark ? '浅色模式' : '深色模式'}</span>}
        </button>

        {!collapsed && (
          <div className="mt-2.5 flex items-center gap-2 px-2 text-[11px] text-[var(--text-muted)]">
            <span className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
            <span className="truncate">LocalDB 本地私有存储</span>
          </div>
        )}
      </div>
    </aside>
  )
}
