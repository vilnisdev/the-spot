'use client'

import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
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
}

interface MapViewProps {
  spots: Spot[]
}

const OSM_TILE = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
const OSM_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

const STADIA_DARK_TILE = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.png'
const STADIA_DARK_ATTRIBUTION =
  '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'

function makePinIcon(active = false): L.DivIcon {
  const fill = active ? 'var(--accent)' : 'var(--sepia)'
  const svg = `<svg viewBox="0 0 24 32" width="24" height="32" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C6.477 0 2 4.477 2 10c0 7 10 22 10 22S22 17 22 10C22 4.477 17.523 0 12 0z" fill="${fill}"/>
    <circle cx="12" cy="10" r="4" fill="white" fill-opacity="0.6"/>
  </svg>`

  return L.divIcon({
    html: svg,
    className: '',
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

export default function MapView({ spots }: MapViewProps) {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)')
    setDark(mq.matches)
    const handler = (e: MediaQueryListEvent) => setDark(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const center = centroid(spots)

  return (
    <MapContainer center={center} zoom={spots.length > 0 ? 10 : 3} style={{ width: '100%', height: '100%' }}>
      <TileLayer
        key={dark ? 'dark' : 'light'}
        url={dark ? STADIA_DARK_TILE : OSM_TILE}
        attribution={dark ? STADIA_DARK_ATTRIBUTION : OSM_ATTRIBUTION}
      />
      {spots.map((spot) => (
        <Marker key={spot.id} position={[spot.lat, spot.lng]} icon={makePinIcon()}>
          <Popup>{spot.title}</Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
