'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import NetworkFilter from './NetworkFilter'
import SpotCreationForm from './SpotCreationForm'
import type { CreatedSpot } from '@/app/actions/spots'
import styles from './map.module.css'
import formStyles from './spotCreationForm.module.css'

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

interface LatLng {
  lat: number
  lng: number
}

interface MapPageProps {
  spots: Spot[]
  networks: Network[]
  username: string
}

export default function MapPage({ spots: initialSpots, networks, username }: MapPageProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [liveSpots, setLiveSpots] = useState<Spot[]>(initialSpots)
  const [dropMode, setDropMode] = useState(false)
  const [provisionalPin, setProvisionalPin] = useState<LatLng | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [droppedLatLng, setDroppedLatLng] = useState<LatLng | null>(null)

  // Esc exits drop mode
  useEffect(() => {
    if (!dropMode) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') exitDropMode()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dropMode])

  function enterDropMode() {
    setDropMode(true)
    setPanelOpen(false)
  }

  function exitDropMode() {
    setDropMode(false)
    setProvisionalPin(null)
    setFormOpen(false)
    setDroppedLatLng(null)
  }

  const handleDrop = useCallback((latlng: LatLng) => {
    setProvisionalPin(latlng)
    setDroppedLatLng(latlng)
    setDropMode(false)
    setFormOpen(true)
  }, [])

  function handleSave(spot: CreatedSpot) {
    setLiveSpots((prev) => [...prev, spot])
    setProvisionalPin(null)
    setFormOpen(false)
    setDroppedLatLng(null)
    setDropMode(false)
  }

  function handleCancel() {
    setProvisionalPin(null)
    setFormOpen(false)
    setDroppedLatLng(null)
    setDropMode(false)
  }

  const visibleSpots =
    selectedNetworkId === null
      ? liveSpots
      : liveSpots.filter((s) =>
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
        {/* Drop mode banner */}
        {dropMode && (
          <div className={formStyles.dropBanner} role="status">
            <span>Click the map to place your spot — Esc to cancel</span>
            <button
              type="button"
              className={formStyles.dropBannerClose}
              onClick={exitDropMode}
              aria-label="Cancel drop mode"
            >
              ×
            </button>
          </div>
        )}

        {/* Add Spot button */}
        <button
          type="button"
          className={`${formStyles.addSpotBtn} ${dropMode ? formStyles.addSpotBtnActive : ''}`}
          onClick={dropMode ? exitDropMode : enterDropMode}
          aria-label={dropMode ? 'Cancel adding spot' : 'Add a new spot'}
          aria-pressed={dropMode}
        >
          + Add Spot
        </button>

        <MapView
          spots={visibleSpots}
          dropMode={dropMode}
          provisionalPin={provisionalPin}
          onDrop={handleDrop}
        />
      </div>

      <SpotCreationForm
        open={formOpen}
        latlng={droppedLatLng}
        networks={networks}
        username={username}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </div>
  )
}
