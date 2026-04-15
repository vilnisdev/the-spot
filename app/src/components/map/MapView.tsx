'use client'

import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Tooltip, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

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

interface LatLng {
  lat: number
  lng: number
}

interface MapViewProps {
  spots: Spot[]
  dropMode: boolean
  provisionalPin: LatLng | null
  onDrop: (latlng: LatLng) => void
  onSpotClick: (spot: Spot) => void
  onMapReady?: (map: L.Map) => void
}

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const STADIA_DARK_TILE = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
const STADIA_DARK_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function makePinIcon(variant: 'saved' | 'active' | 'provisional'): L.DivIcon {
  const fill =
    variant === 'active' ? 'var(--accent)' :
    variant === 'provisional' ? 'none' :
    'currentColor'
  const stroke = variant === 'provisional' ? 'var(--tan)' : 'none'
  const strokeDasharray = variant === 'provisional' ? '4 3' : 'none'
  const dotFill = variant === 'provisional' ? 'none' : 'white'
  const dotOpacity = variant === 'provisional' ? '0' : '0.6'

  const svg = `<svg viewBox="0 0 24 32" width="24" height="32" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C6.477 0 2 4.477 2 10c0 7 10 22 10 22S22 17 22 10C22 4.477 17.523 0 12 0z"
      fill="${fill}" stroke="${stroke}" stroke-width="1.5" stroke-dasharray="${strokeDasharray}"/>
    <circle cx="12" cy="10" r="4" fill="${dotFill}" fill-opacity="${dotOpacity}"/>
  </svg>`

  return L.divIcon({
    html: svg,
    className: variant === 'saved' ? 'the-spot-pin' : '',
    iconSize: [24, 32],
    iconAnchor: [12, 32],
    popupAnchor: [0, -34],
  })
}

function centroid(spots: Spot[]): [number, number] {
  if (spots.length === 0) return [51.505, -0.09]
  const lat = spots.reduce((s, p) => s + p.lat, 0) / spots.length
  const lng = spots.reduce((s, p) => s + p.lng, 0) / spots.length
  return [lat, lng]
}

// Manages cursor and click events inside the Leaflet context
function DropHandler({
  dropMode,
  onDrop,
  onMapReady,
}: {
  dropMode: boolean
  onDrop: (latlng: LatLng) => void
  onMapReady?: (map: L.Map) => void
}) {
  const map = useMapEvents({
    click(e) {
      if (dropMode) {
        onDrop({ lat: e.latlng.lat, lng: e.latlng.lng })
      }
    },
  })

  useEffect(() => {
    onMapReady?.(map)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []) // runs once; map instance is stable

  useEffect(() => {
    const container = map.getContainer()
    container.style.cursor = dropMode ? 'crosshair' : ''
  }, [dropMode, map])

  return null
}

export default function MapView({ spots, dropMode, provisionalPin, onDrop, onSpotClick, onMapReady }: MapViewProps) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const handleDrop = useCallback(onDrop, [onDrop])
  const center = centroid(spots)

  return (
    <MapContainer center={center} zoom={spots.length > 0 ? 10 : 3} style={{ width: '100%', height: '100%' }} zoomControl={false} attributionControl={false}>
      <TileLayer
        key={dark ? 'dark' : 'light'}
        url={dark ? STADIA_DARK_TILE : OSM_TILE}
        attribution={dark ? STADIA_DARK_ATTRIBUTION : OSM_ATTRIBUTION}
      />
      <DropHandler dropMode={dropMode} onDrop={handleDrop} onMapReady={onMapReady} />
      {spots.map((spot) => (
        <Marker
          key={spot.id}
          position={[spot.lat, spot.lng]}
          icon={makePinIcon('saved')}
          eventHandlers={{ click: () => onSpotClick(spot) }}
        >
          <Tooltip direction="top" offset={[0, -34]} opacity={1} className="the-spot-tooltip">
            {spot.thumb_url && (
              <img src={spot.thumb_url} alt="" className="the-spot-tooltip-img" />
            )}
            <span className="the-spot-tooltip-title">{spot.title}</span>
          </Tooltip>
        </Marker>
      ))}
      {provisionalPin && (
        <Marker
          key="provisional"
          position={[provisionalPin.lat, provisionalPin.lng]}
          icon={makePinIcon('provisional')}
          interactive={false}
        />
      )}
    </MapContainer>
  )
}
