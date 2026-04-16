import type L from 'leaflet'

// flyTo a geographic point but offset the map center downward so the point
// sits above the floating SpotCard.
export function flyToAbovePin(map: L.Map, lat: number, lng: number, zoom = 15) {
  const h = map.getContainer().clientHeight
  const offsetY = h * 0.18
  const targetPx = map.project([lat, lng], zoom).add([0, offsetY])
  const center = map.unproject(targetPx, zoom)
  map.flyTo(center, zoom, { animate: true, duration: 1 })
}
