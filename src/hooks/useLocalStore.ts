import { useCallback, useEffect, useState } from 'react'
import { INITIAL_HANGYU_STATE } from '../data/seedData'
import type { HangyuState } from '../types'

const STORAGE_KEY = 'hangyu_captain_workbench_v1'

function currentHm(): string {
  const now = new Date()
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
}

export function useHangyuStore() {
  const [state, setState] = useState<HangyuState>(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!raw) return INITIAL_HANGYU_STATE
      const parsed = JSON.parse(raw) as Partial<HangyuState>
      return {
        ...INITIAL_HANGYU_STATE,
        ...parsed,
        settings: {
          ...INITIAL_HANGYU_STATE.settings,
          ...(parsed.settings ?? {}),
        },
      }
    } catch {
      return INITIAL_HANGYU_STATE
    }
  })

  const [lastSavedAt, setLastSavedAt] = useState<string>(() => currentHm())

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignore quota errors in restricted environments
    }
  }, [state])

  const updateState = useCallback((updater: (prev: HangyuState) => HangyuState) => {
    setState((prev) => updater(prev))
    setLastSavedAt(currentHm())
  }, [])

  const resetToDefault = useCallback(() => {
    window.localStorage.removeItem(STORAGE_KEY)
    setState(INITIAL_HANGYU_STATE)
    setLastSavedAt(currentHm())
  }, [])

  const exportJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `hangyu-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [state])

  const importJson = useCallback((rawJson: string): boolean => {
    try {
      const parsed = JSON.parse(rawJson) as Partial<HangyuState>
      if (!parsed || typeof parsed !== 'object') return false
      setState({
        ...INITIAL_HANGYU_STATE,
        ...parsed,
        settings: {
          ...INITIAL_HANGYU_STATE.settings,
          ...(parsed.settings ?? {}),
        },
      })
      setLastSavedAt(currentHm())
      return true
    } catch {
      return false
    }
  }, [])

  return {
    state,
    updateState,
    resetToDefault,
    exportJson,
    importJson,
    lastSavedAt,
  }
}
