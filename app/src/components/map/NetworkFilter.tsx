'use client'

import styles from './map.module.css'

interface Network {
  id: string
  name: string
}

interface NetworkFilterProps {
  networks: Network[]
  selected: string | null
  onChange: (id: string | null) => void
}

export default function NetworkFilter({ networks, selected, onChange }: NetworkFilterProps) {
  return (
    <div className={styles.filterList}>
      <button
        className={`${styles.filterBtn} ${selected === null ? styles.filterBtnActive : ''}`}
        onClick={() => onChange(null)}
      >
        All Circles
      </button>
      {networks.map((n) => (
        <button
          key={n.id}
          className={`${styles.filterBtn} ${selected === n.id ? styles.filterBtnActive : ''}`}
          onClick={() => onChange(n.id)}
        >
          {n.name}
        </button>
      ))}
    </div>
  )
}
