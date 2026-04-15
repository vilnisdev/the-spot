'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type L from 'leaflet'
import dynamic from 'next/dynamic'
import NetworkFilter from './NetworkFilter'
import SpotCreationForm from './SpotCreationForm'
import SpotModal, { type SpotForModal } from './SpotModal'
import SpotEditForm from './SpotEditForm'
import MapSearchBar from './MapSearchBar'
import ExploreExitChip from './ExploreExitChip'
import { useExploreMode } from './useExploreMode'
import { flyToAbovePin } from './mapHelpers'
import {
  getSpotDetailAction,
  postCommentAction,
  deleteSpotAction,
  type CreatedSpot,
  type SearchSpotResult,
} from '@/app/actions/spots'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
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
  initialSpotId: string | null
}

export default function MapPage({ spots: initialSpots, networks, userId: _userId, initialSpotId }: MapPageProps) {
  const [selectedNetworkId, setSelectedNetworkId] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(false)
  const [panelFullyClosed, setPanelFullyClosed] = useState(true)
  const [liveSpots, setLiveSpots] = useState<Spot[]>(initialSpots)
  const [dropMode, setDropMode] = useState(false)
  const [provisionalPin, setProvisionalPin] = useState<LatLng | null>(null)
  const [formOpen, setFormOpen] = useState(false)
  const [droppedLatLng, setDroppedLatLng] = useState<LatLng | null>(null)

  // Map instance ref for programmatic flyTo
  const mapRef = useRef<L.Map | null>(null)

  // Spot modal state
  const [selectedSpot, setSelectedSpot] = useState<Spot | null>(null)
  const [spotDetail, setSpotDetail] = useState<SpotForModal | null>(null)
  const [isAuthor, setIsAuthor] = useState(false)
  const [editingSpot, setEditingSpot] = useState<SpotForModal | null>(null)

  // Explore mode — hides chrome for distraction-free map viewing
  const isModalOpen = useCallback(
    () => spotDetail !== null || editingSpot !== null || formOpen,
    [spotDetail, editingSpot, formOpen]
  )
  const { exploreMode, enterExplore, exitExplore } = useExploreMode({ isModalOpen })

  function handleEnterExplore() {
    setPanelOpen(false)
    setPanelFullyClosed(true)
    enterExplore()
  }

  // Tracks pin coords whenever a modal is opened via offset flyTo (search,
  // visit, or pin click) — used to pan back to true center on modal close.
  const pinFocusRef = useRef<{ lat: number; lng: number } | null>(null)
  // Pending flyTo when map isn't ready yet (e.g. arriving via /?spot=<id>)
  const pendingFlyToRef = useRef<{ lat: number; lng: number } | null>(null)

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

  // ── Realtime: live comment updates ──
  useEffect(() => {
    if (!spotDetail) return
    const supabase = createSupabaseBrowserClient()
    const spotId = spotDetail.id

    const channel = supabase
      .channel(`live-comments-${spotId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `spot_id=eq.${spotId}` },
        (payload) => {
          const row = payload.new as { id: string; body: string; created_at: string }
          setSpotDetail((prev) => {
            if (!prev) return prev
            if (prev.comments?.some((c) => c.id === row.id)) return prev
            // Fetch with author join — payload doesn't include joined columns
            supabase
              .from('comments')
              .select('id, body, created_at, profiles!author_id(username)')
              .eq('id', row.id)
              .single()
              .then(({ data: c }) => {
                if (!c) return
                const comment = {
                  id: c.id,
                  author: (c.profiles as unknown as { username: string } | null)?.username ?? 'Unknown',
                  body: c.body,
                  date: new Date(c.created_at.split('T')[0] + 'T00:00:00').toLocaleDateString('en-US', {
                    month: 'long', day: 'numeric', year: 'numeric',
                  }),
                }
                setSpotDetail((p) => {
                  if (!p) return p
                  if (p.comments?.some((c) => c.id === comment.id)) return p
                  return { ...p, comments: [...(p.comments ?? []), comment] }
                })
              })
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spotDetail?.id])

  // ── Handle /?spot=<id> deep link ──
  useEffect(() => {
    if (!initialSpotId) return
    setSelectedNetworkId(null)
    window.history.replaceState(null, '', '/')
    getSpotDetailAction(initialSpotId).then((result) => {
      if ('error' in result) return
      const { lat, lng } = result.spot
      setSpotDetail(result.spot)
      setIsAuthor(result.isAuthor)
      pinFocusRef.current = { lat, lng }
      pendingFlyToRef.current = { lat, lng }
      if (mapRef.current) {
        flyToAbovePin(mapRef.current, lat, lng)
        pendingFlyToRef.current = null
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSpotId])

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
    if (mapRef.current) {
      mapRef.current.flyTo([spot.lat, spot.lng], 15, { animate: true, duration: 1 })
    }
  }

  function handleCancel() {
    setProvisionalPin(null)
    setFormOpen(false)
    setDroppedLatLng(null)
    setDropMode(false)
  }

  // ── Map ref callbacks ──

  function handleMapReady(map: L.Map) {
    mapRef.current = map
    if (pendingFlyToRef.current) {
      flyToAbovePin(map, pendingFlyToRef.current.lat, pendingFlyToRef.current.lng)
      pendingFlyToRef.current = null
    }
  }

  // ── Spot modal interactions ──

  async function handleSpotClick(spot: Spot) {
    setSelectedSpot(spot)
    pinFocusRef.current = { lat: spot.lat, lng: spot.lng }
    if (mapRef.current) flyToAbovePin(mapRef.current, spot.lat, spot.lng)
    const result = await getSpotDetailAction(spot.id)
    if (!('error' in result)) {
      setSpotDetail(result.spot)
      setIsAuthor(result.isAuthor)
    }
  }

  function handleModalStartClose() {
    if (pinFocusRef.current) {
      mapRef.current?.panTo([pinFocusRef.current.lat, pinFocusRef.current.lng], { animate: true, duration: 0.4 })
      pinFocusRef.current = null
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
    if (pinFocusRef.current) {
      mapRef.current?.panTo([pinFocusRef.current.lat, pinFocusRef.current.lng], { animate: true, duration: 0.4 })
      pinFocusRef.current = null
    }
    setSpotDetail(null)
    setSelectedSpot(null)
  }

  async function handleSearchSelect(result: SearchSpotResult) {
    await handleSpotClick({ ...result, spot_networks: [] })
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
      {panelFullyClosed && !exploreMode && (
        <button
          className={styles.menuBtn}
          onClick={() => { setPanelOpen(true); setPanelFullyClosed(false) }}
          aria-label="Open network panel"
        >
          ☰
        </button>
      )}

      {exploreMode && <ExploreExitChip onExit={exitExplore} />}

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
        <div className={styles.panelSection} style={{ marginTop: 'auto', borderTop: '1px solid var(--rule)' }}>
          <button
            type="button"
            className={styles.panelNavLink}
            style={{ background: 'none', border: 'none', padding: '4px 0', cursor: 'pointer', textAlign: 'left' }}
            onClick={handleEnterExplore}
          >
            Explore
          </button>
          <a href="/profile" className={styles.panelNavLink}>Profile</a>
          <a href="/settings" className={styles.panelNavLink}>Settings</a>
        </div>
      </aside>

      <div className={styles.mapWrap}>
        <MapView
          spots={visibleSpots}
          dropMode={dropMode}
          provisionalPin={provisionalPin}
          onDrop={handleDrop}
          onSpotClick={handleSpotClick}
          onMapReady={handleMapReady}
        />
        {!exploreMode && <MapSearchBar onSelectSpot={handleSearchSelect} />}
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
      {!exploreMode && (
        <button
          type="button"
          className={`${formStyles.addSpotBtn} ${dropMode ? formStyles.addSpotBtnActive : ''}`}
          onClick={dropMode ? exitDropMode : enterDropMode}
          aria-label={dropMode ? 'Cancel adding spot' : 'Add a new spot'}
          aria-pressed={dropMode}
        >
          + Add Spot
        </button>
      )}

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
        onStartClose={handleModalStartClose}
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
