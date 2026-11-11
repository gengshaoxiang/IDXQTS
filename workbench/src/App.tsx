import { useEffect, useState } from 'react'
import { CommandPalette } from './components/CommandPalette'
import { FloatingMeetingTimer } from './components/FloatingMeetingTimer'
import { HomeBento } from './components/HomeBento'
import { ModuleSheet } from './components/ModuleSheet'
import { Sidebar } from './components/Sidebar'
import { TopBar } from './components/TopBar'
import { useHangyuStore } from './hooks/useLocalStore'
import { CompassModule } from './modules/CompassModule'
import { FinanceQuantModule } from './modules/FinanceQuantModule'
import { HabitsModule } from './modules/HabitsModule'
import { MediaModule } from './modules/MediaModule'
import { NotesModule } from './modules/NotesModule'
import { ProjectsModule } from './modules/ProjectsModule'
import { RizhiModule } from './modules/RizhiModule'
import { ScheduleModule } from './modules/ScheduleModule'
import { SettingsVaultModule } from './modules/SettingsVaultModule'
import { TodoModule } from './modules/TodoModule'
import { ToolboxModule } from './modules/ToolboxModule'
import type { ModuleId } from './types'

export function App() {
  const { state, updateState, resetToDefault, exportJson, importJson, lastSavedAt } =
    useHangyuStore()

  const [activeModule, setActiveModule] = useState<ModuleId>('workbench')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [paletteOpen, setPaletteOpen] = useState(false)
  const [floatingTimerOpen, setFloatingTimerOpen] = useState(false)
  const [systemPrefersDark, setSystemPrefersDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : false
  )

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const listener = (e: MediaQueryListEvent) => setSystemPrefersDark(e.matches)
    mq.addEventListener('change', listener)
    return () => mq.removeEventListener('change', listener)
  }, [])

  const isDark =
    state.settings.themeMode === 'dark' ||
    (state.settings.themeMode === 'auto' && systemPrefersDark)

  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', isDark ? 'dark' : 'light')
    root.setAttribute('data-accent', state.settings.accentTheme)
    root.setAttribute('data-fontsize', state.settings.fontScale)
    if (isDark) root.classList.add('dark')
    else root.classList.remove('dark')
  }, [isDark, state.settings.accentTheme, state.settings.fontScale])

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setPaletteOpen((prev) => !prev)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  const toggleDarkQuick = () => {
    updateState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        themeMode: isDark ? 'light' : 'dark',
      },
    }))
  }

  return (
    <div className="hangyu-bg min-h-screen w-full overflow-x-hidden p-3.5 transition-colors duration-300">
      <div className="mx-auto flex max-w-[1680px] gap-4">
        <Sidebar
          brandName={state.settings.brandName}
          activeModule={activeModule}
          onSelectModule={setActiveModule}
          isDark={isDark}
          onToggleDark={toggleDarkQuick}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed((c) => !c)}
        />

        <main
          className={`flex min-w-0 flex-1 flex-col gap-4 transition-all duration-300 ${
            activeModule !== 'workbench' ? 'pointer-events-none select-none opacity-65' : ''
          }`}
        >
          <TopBar
            settings={state.settings}
            onChangeTimezone={(tz) =>
              updateState((prev) => ({
                ...prev,
                settings: { ...prev.settings, activeTimezone: tz },
              }))
            }
            onOpenSearch={() => setPaletteOpen(true)}
            onQuickAction={(m) => setActiveModule(m)}
            onOpenFloatingTimer={() => setFloatingTimerOpen(true)}
          />

          <HomeBento
            state={state}
            updateState={updateState}
            onOpenModule={setActiveModule}
            lastSavedAt={lastSavedAt}
          />
        </main>
      </div>

      <ModuleSheet activeModule={activeModule} onClose={() => setActiveModule('workbench')}>
        {activeModule === 'schedule' && (
          <ScheduleModule state={state} updateState={updateState} />
        )}
        {activeModule === 'todos' && <TodoModule state={state} updateState={updateState} />}
        {activeModule === 'notes' && <NotesModule state={state} updateState={updateState} />}
        {activeModule === 'rizhi' && <RizhiModule state={state} updateState={updateState} />}
        {activeModule === 'media' && <MediaModule state={state} updateState={updateState} />}
        {activeModule === 'finance' && (
          <FinanceQuantModule state={state} updateState={updateState} />
        )}
        {activeModule === 'habits' && <HabitsModule state={state} updateState={updateState} />}
        {activeModule === 'projects' && (
          <ProjectsModule state={state} updateState={updateState} />
        )}
        {activeModule === 'compass' && (
          <CompassModule state={state} updateState={updateState} />
        )}
        {activeModule === 'toolbox' && (
          <ToolboxModule onOpenFloatingTimer={() => setFloatingTimerOpen(true)} />
        )}
        {activeModule === 'settings' && (
          <SettingsVaultModule
            state={state}
            updateState={updateState}
            onExportJson={exportJson}
            onImportJson={importJson}
            onResetDefault={resetToDefault}
          />
        )}
      </ModuleSheet>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        state={state}
        onNavigate={setActiveModule}
      />

      <FloatingMeetingTimer
        open={floatingTimerOpen}
        onClose={() => setFloatingTimerOpen(false)}
      />
    </div>
  )
}

export default App
