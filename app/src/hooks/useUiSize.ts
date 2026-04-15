'use client'

import { useEffect, useState } from 'react'
import { UI_SIZE_EVENT, isUiSizePreference, type UiSizePreference } from '@/lib/uiSize'

function readAttribute(): UiSizePreference {
  if (typeof document === 'undefined') return 'regular'
  const attr = document.documentElement.dataset.size
  return isUiSizePreference(attr) ? attr : 'regular'
}

export function useUiSize(): UiSizePreference {
  const [size, setSize] = useState<UiSizePreference>(readAttribute)

  useEffect(() => {
    setSize(readAttribute())

    const onSizeChange = (e: Event) => {
      const detail = (e as CustomEvent<UiSizePreference>).detail
      if (isUiSizePreference(detail)) setSize(detail)
    }
    window.addEventListener(UI_SIZE_EVENT, onSizeChange)

    return () => {
      window.removeEventListener(UI_SIZE_EVENT, onSizeChange)
    }
  }, [])

  return size
}
