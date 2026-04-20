'use client'

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
  onToggleFavorite: (spot: MySpot) => void
}

export default function SpotCard({ spot, onOpen, onEdit, onDelete, onToggleFavorite }: SpotCardProps) {
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

  function handleVisit(e: React.MouseEvent) {
    e.stopPropagation()
    window.location.href = `/?spot=${spot.id}`
  }

  function handleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    onToggleFavorite(spot)
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
        <button
          type="button"
          className={`${styles.favoriteBtn} ${spot.isFavorite ? styles.favoriteBtnActive : ''}`}
          onClick={handleFavorite}
          aria-label={spot.isFavorite ? `Unfavorite ${spot.title}` : `Set ${spot.title} as favorite`}
          aria-pressed={spot.isFavorite}
          title={
            spot.isFavorite
              ? 'Unfavorite — map will no longer open here by default'
              : 'Favorite — this Spot will be the first to open on the map'
          }
        >
          {spot.isFavorite ? (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.95 6.3 6.55.95-4.75 4.65 1.12 6.6L12 17.3l-5.87 3.2 1.12-6.6L2.5 9.25l6.55-.95z"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 2l2.95 6.3 6.55.95-4.75 4.65 1.12 6.6L12 17.3l-5.87 3.2 1.12-6.6L2.5 9.25l6.55-.95z"/>
            </svg>
          )}
        </button>
        <button
          type="button"
          className={styles.visitBtn}
          onClick={handleVisit}
          aria-label={`View ${spot.title} on map`}
          title="View on map"
        >
          <svg viewBox="0 0 24 32" width="12" height="16" fill="currentColor" aria-hidden="true">
            <path d="M12 0C6.477 0 2 4.477 2 10c0 7 10 22 10 22S22 17 22 10C22 4.477 17.523 0 12 0z"/>
          </svg>
        </button>
        <button
          type="button"
          className={styles.editBtn}
          onClick={handleEdit}
          aria-label={`Edit ${spot.title}`}
          title="Edit"
        >
          ✎
        </button>
        <button
          type="button"
          className={styles.deleteBtn}
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
