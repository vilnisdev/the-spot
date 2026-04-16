'use client'

import { useEffect, useRef, useCallback, type RefObject } from 'react'
import type L from 'leaflet'
import styles from './spotConnector.module.css'

interface SpotConnectorProps {
  map: L.Map
  lat: number
  lng: number
  cardRef: RefObject<HTMLDivElement | null>
  visible: boolean
}

export default function SpotConnector({ map, lat, lng, cardRef, visible }: SpotConnectorProps) {
  const lineRef = useRef<SVGLineElement>(null)

  const update = useCallback(() => {
    const line = lineRef.current
    const card = cardRef.current
    if (!line || !card) return

    // Pin position: map container-relative → viewport
    const containerRect = map.getContainer().getBoundingClientRect()
    const pt = map.latLngToContainerPoint([lat, lng])
    const pinX = containerRect.left + pt.x
    const pinY = containerRect.top + pt.y

    // Card top-center
    const cardRect = card.getBoundingClientRect()
    const cardX = (cardRect.left + cardRect.right) / 2
    const cardY = cardRect.top

    line.setAttribute('x1', String(pinX))
    line.setAttribute('y1', String(pinY))
    line.setAttribute('x2', String(cardX))
    line.setAttribute('y2', String(cardY))
  }, [map, lat, lng, cardRef])

  useEffect(() => {
    // Delay initial update so card bloom animation has started layout
    const raf = requestAnimationFrame(update)
    map.on('move', update)
    map.on('moveend', update)
    window.addEventListener('resize', update)
    return () => {
      cancelAnimationFrame(raf)
      map.off('move', update)
      map.off('moveend', update)
      window.removeEventListener('resize', update)
    }
  }, [map, update])

  return (
    <svg className={`${styles.overlay} ${visible ? styles.visible : styles.hidden}`}>
      <line ref={lineRef} className={styles.line} />
    </svg>
  )
}
