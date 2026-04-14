'use client'

import { useState, useCallback, useEffect } from 'react'
import dynamic from 'next/dynamic'
import NetworkFilter from './NetworkFilter'
import SpotCreationForm from './SpotCreationForm'
import SpotModal, { type SpotForModal } from './SpotModal'
import SpotEditForm from './SpotEditForm'
import {
  getSpotDetailAction,
  postCommentAction,
  deleteSpotAction,
  type CreatedSpot,
} from '@/app/actions/spots'
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
  userId: string | null
}

export default function MapPage({ spots: initialSpots, networks, userId: _userId }: MapPageProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelFullyClosed, setPanelFullyClosed] = useState(true)
  const [liveSpots, setLiveSpots] = useState<Spot[]>(initialSpots)
  const [dropMode, setDropMode] = useState(false)
  const [provisionalPin, setProvisionalPin] = useState<LatLng | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [droppedLatLng, setDroppedLatLng] = useState<LatLng | null>(null)

  // Spot modal state
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [spotDetail, setSpotDetail] = useState<SpotForModal | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [editingSpot, setEditingSpot] = useState<SpotForModal | null>(null)

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
    if (panelOpen) setPanelOpen(false)
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

  // ── Spot modal interactions ──

  async function handleSpotClick(spot: Spot) {
    setSelectedSpot(spot)
    const result = await getSpotDetailAction(spot.id)
    if (!('error' in result)) {
      setSpotDetail(result.spot)
      setIsAuthor(result.isAuthor)
    }
  }

  function handleModalClose() {
    setSpotDetail(null)
    setSelectedSpot(null)
  }

  function handleEdit() {
    setEditingSpot(spotDetail)
    setSpotDetail(null)
  }

  async function handleEditSave() {
    if (!editingSpot) return
    const result = await getSpotDetailAction(editingSpot.id)
    setEditingSpot(null)
    if (!('error' in result)) {
      setSpotDetail(result.spot)
      setIsAuthor(result.isAuthor)
    }
  }

  function handleEditCancel() {
    const snapshot = editingSpot ?? null
    setEditingSpot(null)
    setSpotDetail(snapshot)
  }

  async function handleDelete() {
    if (!spotDetail) return
    const { error } = await deleteSpotAction(spotDetail.id)
    if (error) return
    setLiveSpots((prev) => prev.filter((s) => s.id !== spotDetail.id))
    setSpotDetail(null)
    setSelectedSpot(null)
  }

  async function handlePostComment(body: string) {
    if (!spotDetail) return
    const result = await postCommentAction(spotDetail.id, body)
    if (!('error' in result)) {
      const newComment = result.comment
      setSpotDetail((prev) =>
        prev ? { ...prev, comments: [...(prev.comments ?? []), newComment] } : prev
      )
    }
  }

  const visibleSpots =
    selectedNetworkId === null
      ? liveSpots
      : liveSpots.filter((s) =>
          s.spot_networks.some((sn) => sn.network_id === selectedNetworkId)
        )

  return (
    <div className={styles.layout}>
      {/* Fixed button on map — shown only after panel fully slides out */}
      {panelFullyClosed && (
        <button
          className={styles.menuBtn}
          onClick={() => { setPanelOpen(true); setPanelFullyClosed(false) }}
          aria-label="Open network panel"
        >
          ☰
        </button>
      )}

      <aside
        className={`${styles.panel} ${panelOpen ? styles.panelOpen : ''}`}
        onTransitionEnd={(e) => {
          if (e.propertyName === 'transform' && !panelOpen) setPanelFullyClosed(true)
        }}
      >
        <div className={styles.panelHeader}>
          <span className={styles.panelTitle}>The Spot</span>
          <button
            className={styles.menuBtn}
            onClick={() => setPanelOpen(false)}
            aria-label="Close network panel"
          >
            ☰
          </button>
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
        <MapView
          spots={visibleSpots}
          dropMode={dropMode}
          provisionalPin={provisionalPin}
          onDrop={handleDrop}
          onSpotClick={handleSpotClick}
        />
      </div>

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

      <SpotCreationForm
        open={formOpen}
        latlng={droppedLatLng}
        networks={networks}
        onSave={handleSave}
        onCancel={handleCancel}
      />

      <SpotModal
        spot={spotDetail}
        isAuthor={isAuthor}
        onClose={handleModalClose}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onPostComment={handlePostComment}
      />

      {editingSpot && (
        <SpotEditForm
          spot={editingSpot}
          networks={networks}
          onSave={handleEditSave}
          onCancel={handleEditCancel}
        />
      )}
    </div>
  )
}
