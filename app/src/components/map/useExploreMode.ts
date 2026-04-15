'use client'

import { useCallback, useEffect, useState } from 'react'
import { shouldExitExploreOnEsc } from './exploreEsc'

export interface UseExploreModeArgs {
  isModalOpen: () => boolean
}

export interface UseExploreMode {
  exploreMode: boolean
  enterExplore: () => void
  exitExplore: () => void
}

export function useExploreMode({ isModalOpen }: UseExploreModeArgs): UseExploreMode {
  const [exploreMode, setExploreMode] = useState(false)

  const enterExplore = useCallback(() => setExploreMode(true), [])
  const exitExplore = useCallback(() => setExploreMode(false), [])

  useEffect(() => {
    if (!exploreMode) return
    function handleKey(e: KeyboardEvent) {
      if (shouldExitExploreOnEsc(e, { exploreMode: true, modalOpen: isModalOpen() })) {
        setExploreMode(false)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [exploreMode, isModalOpen])

  return { exploreMode, enterExplore, exitExplore }
}
