'use client'

import { useEffect, useState } from 'react'
import {
  THEME_EVENT,
  isThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '@/lib/theme'

function readAttribute(): ThemePreference {
  if (typeof document === 'undefined') return 'system'
  const attr = document.documentElement.dataset.theme
  return isThemePreference(attr) ? attr : 'system'
}

export function useTheme(): { preference: ThemePreference; resolved: ResolvedTheme } {
  const [preference, setPreference] = useState<ThemePreference>(readAttribute)
  const [resolved, setResolved] = useState<ResolvedTheme>(() => resolveTheme(readAttribute()))

  useEffect(() => {
    setPreference(readAttribute())
    setResolved(resolveTheme(readAttribute()))

    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<ThemePreference>).detail
      if (isThemePreference(detail)) {
        setPreference(detail)
        setResolved(resolveTheme(detail))
      }
    }
    window.addEventListener(THEME_EVENT, onThemeChange)

    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    const onMqChange = () => {
      setPreference((current) => {
        if (current === 'system') setResolved(mq.matches ? 'dark' : 'light')
        return current
      })
    }
    mq.addEventListener('change', onMqChange)

    return () => {
      window.removeEventListener(THEME_EVENT, onThemeChange)
      mq.removeEventListener('change', onMqChange)
    }
  }, [])

  return { preference, resolved }
}
