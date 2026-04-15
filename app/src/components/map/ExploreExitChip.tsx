'use client'

import styles from './map.module.css'

interface ExploreExitChipProps {
  onExit: () => void
}

export default function ExploreExitChip({ onExit }: ExploreExitChipProps) {
  return (
    <button
      type="button"
      className={styles.exploreExitChip}
      onClick={onExit}
      aria-label="Exit explore mode"
    >
      <kbd className={styles.exploreExitKey}>esc</kbd>
      <span className={styles.exploreExitLabel}>exit</span>
    </button>
  )
}
