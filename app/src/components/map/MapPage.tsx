'use client'

import { useState } from 'react'
import dynamic from 'next/dynamic'
import NetworkFilter from './NetworkFilter'
import styles from './map.module.css'

const MapView = dynamic(() => import('./MapView'), {
  ssr: false,
  loading: () => (
    <div style={{ width: '100%', height: '100%', background: 'var(--tan-light)' }} />
  ),
})

interface SpotNetwork {
  network_id: string
}

interface Spot {
  id: string
  title: string
  lat: number
  lng: number
  spot_networks: SpotNetwork[]
}

interface Network {
  id: string
  name: string
}

interface MapPageProps {
  spots: Spot[]
  networks: Network[]
}

export default function MapPage({ spots, networks }: MapPageProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)

  const visibleSpots =
    selectedNetworkId === null
      ? spots
      : spots.filter((s) =>
          s.spot_networks.some((sn) => sn.network_id === selectedNetworkId)
        )

  return (
    <div className={styles.layout}>
      <button
        className={styles.menuBtn}
        onClick={() => setPanelOpen((v) => !v)}
        aria-label="Toggle network panel"
      >
        ☰
      </button>

      <aside className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}>
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>The Spot</span>
        </div>
        <div className={styles.panelSection}>
          <p className={styles.panelLabel}>Networks</p>
          <NetworkFilter
            networks={networks}
            selected={selectedNetworkId}
            onChange={setSelectedNetworkId}
          />
        </div>
      </aside>

      <div className={styles.mapWrap}>
        <MapView spots={visibleSpots} />
      </div>
    </div>
  )
}
