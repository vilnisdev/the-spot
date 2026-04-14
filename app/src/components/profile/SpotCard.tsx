'use client'

import { useState } from 'react'
import type { MySpot } from '@/app/actions/spots'
import styles from './profile.module.css'

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface SpotCardProps {
  spot: MySpot
  onOpen: (spot: MySpot) => void
  onEdit: (spot: MySpot) => void
  onDelete: (spot: MySpot) => void
}

export default function SpotCard({ spot, onOpen, onEdit, onDelete }: SpotCardProps) {
  const [controlsOpen, setControlsOpen] = useState(false)

  function handleCardClick(e: React.MouseEvent) {
    // Don't open modal if a control button was clicked
    const target = e.target as HTMLElement
    if (target.closest('button')) return
    onOpen(spot)
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    onEdit(spot)
  }

  function handleDelete(e: React.MouseEvent) {
    e.stopPropagation()
    onDelete(spot)
  }

  function handleMore(e: React.MouseEvent) {
    e.stopPropagation()
    setControlsOpen((v) => !v)
  }

  const sub = [spot.date ? formatDate(spot.date) : null, spot.state]
    .filter(Boolean)
    .join(' · ')

  return (
    <li className={styles.spotCard} onClick={handleCardClick}>
      {/* Thumbnail */}
      {spot.thumb_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={spot.thumb_url}
          alt=""
          className={styles.thumb}
          onError={(e) => {
            // Fallback to placeholder on broken URL
            ;(e.target as HTMLImageElement).style.display = 'none'
          }}
        />
      ) : (
        <div className={styles.thumbPlaceholder} aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
        </div>
      )}

      {/* Meta */}
      <div className={styles.meta}>
        <p className={styles.cardTitle}>{spot.title}</p>
        {sub && <p className={styles.cardSub}>{sub}</p>}
        {spot.network_names.length > 0 && (
          <div className={styles.networkPills}>
            {spot.network_names.map((name) => (
              <span key={name} className={styles.networkPill}>{name}</span>
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={styles.cardControls}>
        {/* Touch: ⋯ toggles edit/delete */}
        <button
          type="button"
          className={styles.moreBtn}
          onClick={handleMore}
          aria-label="More options"
          aria-expanded={controlsOpen}
        >
          ···
        </button>
        <button
          type="button"
          className={`${styles.editBtn}${controlsOpen ? ` ${styles.visible}` : ''}`}
          onClick={handleEdit}
          aria-label={`Edit ${spot.title}`}
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          className={`${styles.deleteBtn}${controlsOpen ? ` ${styles.visible}` : ''}`}
          onClick={handleDelete}
          aria-label={`Delete ${spot.title}`}
          title="Delete"
        >
          ✕
        </button>
      </div>
    </li>
  )
}
