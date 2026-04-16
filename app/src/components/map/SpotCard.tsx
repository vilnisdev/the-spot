'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SpotForModal } from './spotTypes'
import styles from './spotCard.module.css'

interface SpotCardProps {
  spot: SpotForModal
  mediaIndex: number
  onMediaIndexChange: (idx: number) => void
  onClose: () => void
  onExpand: () => void
  loading: boolean
  panelOpen: boolean
  cardTopPx: number | null
  exiting: boolean
}

function formatMonthYear(displayDate: string | undefined): string {
  if (!displayDate) return ''
  // "April 12, 2026" → "April 2026"
  return displayDate.replace(/\s\d+,/, '')
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max).trimEnd() + '…'
}

export default function SpotCard({
  spot,
  mediaIndex,
  onMediaIndexChange,
  onClose,
  onExpand,
  loading,
  panelOpen,
  cardTopPx,
  exiting,
}: SpotCardProps) {
  const [imgError, setImgError] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [audioMuted, setAudioMuted] = useState(false)

  const media = useMemo(() => spot.media ?? [], [spot.media])
  const images = useMemo(() => media.filter((m) => m.type === 'image'), [media])
  const audios = useMemo(() => media.filter((m) => m.type === 'audio'), [media])
  const hasImages = images.length > 0
  const hasAudio = audios.length > 0
  const soundOnly = hasAudio && !hasImages
  const mixed = hasAudio && hasImages

  const currentImage = hasImages ? images[Math.min(mediaIndex, images.length - 1)] : null

  useEffect(() => {
    setImgError(false)
  }, [spot.id, mediaIndex])

  // Autoplay audio at 50% on mount
  useEffect(() => {
    if (!hasAudio) return
    const el = audioRef.current
    if (!el) return
    el.volume = 0.5
    el.play().catch(() => {})
    return () => {
      el.pause()
    }
  }, [spot.id, hasAudio])

  const handlePrev = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (images.length < 2) return
      onMediaIndexChange((mediaIndex - 1 + images.length) % images.length)
    },
    [images.length, mediaIndex, onMediaIndexChange]
  )

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (images.length < 2) return
      onMediaIndexChange((mediaIndex + 1) % images.length)
    },
    [images.length, mediaIndex, onMediaIndexChange]
  )

  // Keyboard arrow paging
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        handleNext()
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handlePrev, handleNext, onClose])

  const byline = useMemo(() => {
    const parts: string[] = []
    if (spot.author) parts.push(spot.author)
    const my = formatMonthYear(spot.date)
    if (my) parts.push(my)
    return parts.join(' · ')
  }, [spot.author, spot.date])

  const excerptText = useMemo(() => {
    if (loading) return ''
    if (!spot.description) return ''
    return truncate(spot.description.replace(/\s+/g, ' ').trim(), 120)
  }, [spot.description, loading])

  const quoteText = useMemo(() => {
    const raw = (spot.description ?? '').replace(/\s+/g, ' ').trim()
    if (!raw) return ''
    return raw.length <= 140 ? raw : raw.slice(0, 140).trimEnd() + '…'
  }, [spot.description])

  const heroStyle: React.CSSProperties = {}
  if (cardTopPx !== null) {
    ;(heroStyle as Record<string, string>)['--card-top'] = `${cardTopPx}px`
  }
  ;(heroStyle as Record<string, string>)['--card-offset'] = panelOpen ? '150px' : '0px'

  function handleHeroClick() {
    onExpand()
  }

  const showQuoteBlock = !hasImages || imgError

  return (
    <div
      className={`${styles.card} ${exiting ? styles.cardExiting : ''}`}
      style={heroStyle}
      role="dialog"
      aria-label={spot.title}
    >
      <div
        className={styles.hero}
        onClick={handleHeroClick}
        role="button"
        tabIndex={0}
        aria-label="Expand spot"
      >
        {soundOnly ? (
          <div className={styles.soundOnlyHero}>
            <button
              type="button"
              className={styles.bigPlay}
              onClick={(e) => {
                e.stopPropagation()
                const el = audioRef.current
                if (!el) return
                if (el.paused) el.play().catch(() => {})
                else el.pause()
              }}
              aria-label="Play audio"
            >
              ▶
            </button>
          </div>
        ) : showQuoteBlock ? (
          <div className={styles.quoteHero}>
            {quoteText ? (
              <p className={styles.quoteText}>“{quoteText}”</p>
            ) : (
              <p className={styles.quoteText}>No photographs</p>
            )}
          </div>
        ) : currentImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage.url}
            alt={spot.title}
            className={styles.heroImg}
            onError={() => setImgError(true)}
          />
        ) : null}

        <button
          type="button"
          className={styles.closeBtn}
          onClick={(e) => {
            e.stopPropagation()
            onClose()
          }}
          aria-label="Close card"
        >
          ×
        </button>

        <button
          type="button"
          className={styles.expandBtn}
          onClick={(e) => {
            e.stopPropagation()
            onExpand()
          }}
          aria-label="Expand to full view"
        >
          ⤢
        </button>

        {images.length > 1 && (
          <>
            <button
              type="button"
              className={`${styles.arrowBtn} ${styles.arrowLeft}`}
              onClick={handlePrev}
              aria-label="Previous photo"
            >
              ‹
            </button>
            <button
              type="button"
              className={`${styles.arrowBtn} ${styles.arrowRight}`}
              onClick={handleNext}
              aria-label="Next photo"
            >
              ›
            </button>
            <div className={styles.dots} aria-hidden="true">
              {images.map((_, i) => (
                <span
                  key={i}
                  className={`${styles.dot} ${i === mediaIndex ? styles.dotActive : ''}`}
                />
              ))}
            </div>
          </>
        )}

        {mixed && (
          <button
            type="button"
            className={styles.speakerBtn}
            onClick={(e) => {
              e.stopPropagation()
              const next = !audioMuted
              setAudioMuted(next)
              if (audioRef.current) audioRef.current.muted = next
            }}
            aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
          >
            {audioMuted ? '🔇' : '🔊'}
          </button>
        )}
      </div>

      <div className={styles.meta}>
        <h2 className={styles.title}>{spot.title}</h2>
        {byline && <p className={styles.byline}>{byline}</p>}
        {excerptText && <p className={styles.excerpt}>{excerptText}</p>}
      </div>

      {hasAudio && audios[0] && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio ref={audioRef} src={audios[0].url} preload="auto" />
      )}
    </div>
  )
}
