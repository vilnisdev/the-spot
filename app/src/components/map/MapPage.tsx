'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import type L from 'leaflet'
import dynamic from 'next/dynamic'
import NetworkFilter from './NetworkFilter'
import SpotCreationForm from './SpotCreationForm'
import SpotCard from './SpotCard'
import SpotImmersive from './SpotImmersive'
import type { SpotForModal } from './spotTypes'
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
  thumb_url: string | null
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

type SpotStage =
  | {
      stage: 'card'
      spot: SpotForModal
      isAuthor: boolean
      mediaIndex: number
      loading: boolean
      exiting: boolean
    }
  | {
      stage: 'immersive'
      spot: SpotForModal
      isAuthor: boolean
      mediaIndex: number
      editing: boolean
      exiting: boolean
    }
  | null

function mapSpotToForModal(spot: Spot): SpotForModal {
  return {
    id: spot.id,
    title: spot.title,
    lat: spot.lat,
    lng: spot.lng,
    spot_networks: spot.spot_networks,
    media: spot.thumb_url
      ? [{ type: 'image', url: spot.thumb_url }]
      : [],
  }
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

  const mapRef = useRef<L.Map | null>(null)

  // ── Two-stage spot UI ──
  const [spotStage, setSpotStage] = useState<SpotStage>(null)

  const isModalOpen = useCallback(
    () => spotStage !== null || formOpen,
    [spotStage, formOpen]
  )
  const { exploreMode, enterExplore, exitExplore } = useExploreMode({ isModalOpen })

  function handleEnterExplore() {
    setPanelOpen(false)
    setPanelFullyClosed(true)
    enterExplore()
  }

  const pinFocusRef = useRef<{ lat: number; lng: number } | null>(null)
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
    if (!spotStage) return
    const supabase = createSupabaseBrowserClient()
    const spotId = spotStage.spot.id

    const channel = supabase
      .channel(`live-comments-${spotId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'comments', filter: `spot_id=eq.${spotId}` },
        (payload) => {
          const row = payload.new as { id: string; body: string; created_at: string }
          setSpotStage((prev) => {
            if (!prev) return prev
            if (prev.spot.comments?.some((c) => c.id === row.id)) return prev
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
                setSpotStage((p) => {
                  if (!p) return p
                  if (p.spot.comments?.some((x) => x.id === comment.id)) return p
                  return {
                    ...p,
                    spot: { ...p.spot, comments: [...(p.spot.comments ?? []), comment] },
                  }
                })
              })
            return prev
          })
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [spotStage?.spot.id])

  // ── URL ↔ spot id sync (replaceState, no history entries) ──
  useEffect(() => {
    const id = spotStage?.spot.id
    window.history.replaceState(null, '', id ? `/?spot=${id}` : '/')
  }, [spotStage?.spot.id])

  // ── Handle /?spot=<id> deep link → opens in immersive ──
  useEffect(() => {
    if (!initialSpotId) return
    setSelectedNetworkId(null)
    getSpotDetailAction(initialSpotId).then((result) => {
      if ('error' in result) return
      const { lat, lng } = result.spot
      pinFocusRef.current = { lat, lng }
      pendingFlyToRef.current = { lat, lng }
      setSpotStage({
        stage: 'immersive',
        spot: result.spot,
        isAuthor: result.isAuthor,
        mediaIndex: 0,
        editing: false,
        exiting: false,
      })
      if (mapRef.current) {
        flyToAbovePin(mapRef.current, lat, lng)
        pendingFlyToRef.current = null
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialSpotId])

  function enterDropMode() {
    setSpotStage(null)
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
    setLiveSpots((prev) => [...prev, { ...spot, thumb_url: null }])
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

  function handleMapReady(map: L.Map) {
    mapRef.current = map
    if (pendingFlyToRef.current) {
      flyToAbovePin(map, pendingFlyToRef.current.lat, pendingFlyToRef.current.lng)
      pendingFlyToRef.current = null
    }
  }

  // ── Spot stage handlers ──

  async function handleSpotClick(spot: Spot) {
    pinFocusRef.current = { lat: spot.lat, lng: spot.lng }
    if (mapRef.current) flyToAbovePin(mapRef.current, spot.lat, spot.lng)
    setSpotStage({
      stage: 'card',
      spot: mapSpotToForModal(spot),
      isAuthor: false,
      mediaIndex: 0,
      loading: true,
      exiting: false,
    })
    const result = await getSpotDetailAction(spot.id)
    if ('error' in result) {
      setSpotStage((prev) =>
        prev && prev.stage === 'card' && prev.spot.id === spot.id
          ? { ...prev, loading: false }
          : prev
      )
      return
    }
    setSpotStage((prev) => {
      if (!prev || prev.spot.id !== spot.id) return prev
      if (prev.stage === 'card') {
        return {
          ...prev,
          spot: result.spot,
          isAuthor: result.isAuthor,
          loading: false,
        }
      }
      return prev
    })
  }

  function handleCardClose() {
    if (!spotStage) return
    if (pinFocusRef.current) {
      mapRef.current?.panTo([pinFocusRef.current.lat, pinFocusRef.current.lng], { animate: true, duration: 0.4 })
      pinFocusRef.current = null
    }
    setSpotStage((prev) => (prev && prev.stage === 'card' ? { ...prev, exiting: true } : prev))
    setTimeout(() => {
      setSpotStage((prev) => (prev && prev.stage === 'card' && prev.exiting ? null : prev))
    }, 200)
  }

  function handleCardExpand() {
    setSpotStage((prev) => {
      if (!prev || prev.stage !== 'card') return prev
      return {
        stage: 'immersive',
        spot: prev.spot,
        isAuthor: prev.isAuthor,
        mediaIndex: prev.mediaIndex,
        editing: false,
        exiting: false,
      }
    })
  }

  function handleImmersiveBack() {
    setSpotStage((prev) => {
      if (!prev || prev.stage !== 'immersive') return prev
      return { ...prev, exiting: true }
    })
    setTimeout(() => {
      setSpotStage((prev) => {
        if (!prev || prev.stage !== 'immersive') return prev
        return {
          stage: 'card',
          spot: prev.spot,
          isAuthor: prev.isAuthor,
          mediaIndex: prev.mediaIndex,
          loading: false,
          exiting: false,
        }
      })
    }, 220)
  }

  function handleMediaIndexChange(idx: number) {
    setSpotStage((prev) => (prev ? { ...prev, mediaIndex: idx } : prev))
  }

  async function handleEditSave() {
    if (!spotStage) return
    const result = await getSpotDetailAction(spotStage.spot.id)
    if ('error' in result) return
    setSpotStage((prev) => {
      if (!prev || prev.stage !== 'immersive') return prev
      return {
        ...prev,
        spot: result.spot,
        isAuthor: result.isAuthor,
        editing: false,
        mediaIndex: 0,
      }
    })
  }

  function handleEditCancel() {
    setSpotStage((prev) => (prev && prev.stage === 'immersive' ? { ...prev, editing: false } : prev))
  }

  async function handleDelete() {
    if (!spotStage) return
    const target = spotStage.spot
    const { error } = await deleteSpotAction(target.id)
    if (error) return
    setLiveSpots((prev) => prev.filter((s) => s.id !== target.id))
    if (pinFocusRef.current) {
      mapRef.current?.panTo([pinFocusRef.current.lat, pinFocusRef.current.lng], { animate: true, duration: 0.4 })
      pinFocusRef.current = null
    }
    setSpotStage(null)
  }

  async function handleSearchSelect(result: SearchSpotResult) {
    await handleSpotClick({ ...result, spot_networks: [], thumb_url: null })
  }

  async function handlePostComment(body: string) {
    if (!spotStage) return
    const result = await postCommentAction(spotStage.spot.id, body)
    if ('error' in result) return
    const newComment = result.comment
    setSpotStage((prev) =>
      prev
        ? { ...prev, spot: { ...prev.spot, comments: [...(prev.spot.comments ?? []), newComment] } }
        : prev
    )
  }

  const visibleSpots =
    selectedNetworkId === null
      ? liveSpots
      : liveSpots.filter((s) =>
          s.spot_networks.some((sn) => sn.network_id === selectedNetworkId)
        )

  return (
    <div className={styles.layout}>
      {panelFullyClosed && !exploreMode && spotStage?.stage !== 'immersive' && (
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
          <a href="/networks" className={styles.panelNavLink}>Networks</a>
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

      {spotStage && spotStage.stage === 'card' && (
        <SpotCard
          key={spotStage.spot.id}
          spot={spotStage.spot}
          mediaIndex={spotStage.mediaIndex}
          onMediaIndexChange={handleMediaIndexChange}
          onClose={handleCardClose}
          onExpand={handleCardExpand}
          loading={spotStage.loading}
          panelOpen={panelOpen}
          exiting={spotStage.exiting}
        />
      )}

      {spotStage && spotStage.stage === 'immersive' && (
        <SpotImmersive
          key={spotStage.spot.id}
          spot={spotStage.spot}
          isAuthor={spotStage.isAuthor}
          networks={networks}
          mediaIndex={spotStage.mediaIndex}
          onMediaIndexChange={handleMediaIndexChange}
          initialEditing={spotStage.editing}
          exiting={spotStage.exiting}
          onBack={handleImmersiveBack}
          onPostComment={handlePostComment}
          onEditSave={handleEditSave}
          onEditCancel={handleEditCancel}
          onDelete={handleDelete}
        />
      )}
    </div>
  )
}
