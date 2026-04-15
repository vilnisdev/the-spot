'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './spotModal.module.css'

export interface SpotMedia {
  id?: string
  type: 'image' | 'audio'
  url: string
  name?: string
}

export interface SpotComment {
  id: string
  author: string
  body: string
  date: string
}

export interface SpotForModal {
  id: string
  title: string
  lat: number
  lng: number
  description?: string
  state?: string
  date?: string
  author?: string
  tags?: string[]
  media?: SpotMedia[]
  comments?: SpotComment[]
  spot_networks: { network_id: string }[]
}

interface SpotModalProps {
  spot: SpotForModal | null
  isAuthor: boolean
  onClose: () => void
  onStartClose?: () => void
  onEdit: () => void
  onPostComment: (body: string) => Promise<void>
}

function formatCoords(lat: number, lng: number) {
  const latStr = `${Math.abs(lat).toFixed(4)}° ${lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(lng).toFixed(4)}° ${lng >= 0 ? 'E' : 'W'}`
  return `${latStr}, ${lngStr}`
}

export default function SpotModal({ spot, isAuthor, onClose, onStartClose, onEdit, onPostComment }: SpotModalProps) {
  const [exiting, setExiting] = useState(false)
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const commentRef = useRef<HTMLTextAreaElement>(null)

  // Reset state when a new spot opens
  useEffect(() => {
    if (spot) {
      setExiting(false)
      setLightboxIndex(null)
      setCommentText('')
    }
  }, [spot?.id])

  function handleClose() {
    onStartClose?.()
    setExiting(true)
    setTimeout(onClose, 750)
  }

  // Escape key closes
  useEffect(() => {
    if (!spot) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        if (lightboxIndex !== null) {
          setLightboxIndex(null)
        } else {
          handleClose()
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spot, lightboxIndex])

  // Auto-grow comment textarea
  function growComment() {
    const el = commentRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  if (!spot) return null

  const images = (spot.media ?? []).filter((m) => m.type === 'image')
  const audioFiles = (spot.media ?? []).filter((m) => m.type === 'audio')
  const comments = spot.comments ?? []

  return (
    <>
      {/* Backdrop */}
      <div
        className={`${styles.backdrop} ${exiting ? styles.backdropExiting : ''}`}
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal sheet */}
      <div
        className={`${styles.sheet} ${exiting ? styles.sheetExiting : ''}`}
        role="dialog"
        aria-modal="true"
        aria-label={spot.title}
      >
        {/* Close button */}
        <button
          className={styles.closeBtn}
          onClick={handleClose}
          aria-label="Close"
          type="button"
        >
          ×
        </button>

        <div className={styles.inner}>
          {/* ── Title (full width) ── */}
          <div className={styles.titleRow}>
            <h2 className={styles.title}>{spot.title}</h2>
            {isAuthor && (
              <button
                type="button"
                className={styles.editIconBtn}
                onClick={onEdit}
                aria-label="Edit spot"
                title="Edit"
              >
                ✎
              </button>
            )}
          </div>

          {/* ── Main two-column body ── */}
          <div className={styles.body}>
            {/* Left: media */}
            <div className={styles.mediaCol}>
              {images.length > 0 ? (
                <div className={styles.galleryStrip}>
                  {images.map((img, i) => (
                    <button
                      key={i}
                      type="button"
                      className={styles.thumbBtn}
                      onClick={() => setLightboxIndex(i)}
                      aria-label={`View photo ${i + 1}`}
                    >
                      <div className={styles.thumbPlaceholder} aria-hidden="true" />
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={`Photo ${i + 1}`}
                        className={styles.thumbImg}
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none'
                        }}
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <div className={styles.noMedia}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                    <circle cx="12" cy="13" r="4"/>
                  </svg>
                  <span>No photographs</span>
                </div>
              )}

              {audioFiles.map((audio, i) => (
                <div key={i} className={styles.audioItem}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                  <span className={styles.audioName}>{audio.name ?? 'audio'}</span>
                  {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
                  <audio controls src={audio.url} className={styles.audioPlayer} />
                </div>
              ))}

              <p className={styles.coords}>{formatCoords(spot.lat, spot.lng)}</p>
            </div>

            {/* Right: metadata */}
            <div className={styles.metaCol}>
              {spot.description && (
                <p className={styles.description}>{spot.description}</p>
              )}

              {spot.tags && spot.tags.length > 0 && (
                <div className={styles.tags}>
                  {spot.tags.map((tag) => (
                    <span key={tag} className={styles.tag}>#{tag}</span>
                  ))}
                </div>
              )}

              <div className={styles.autofill}>
                {spot.date && <AutofillRow label="Date" value={spot.date} />}
                {spot.author && <AutofillRow label="Author" value={spot.author} />}
                {spot.state && <AutofillRow label="State" value={spot.state} />}
              </div>

            </div>
          </div>

          {/* ── Comments (full width) ── */}
          <div className={styles.commentsSection}>
            <p className={styles.commentsLabel}>Comments</p>
            <div className={styles.commentsList}>
              {comments.length === 0 ? (
                <p className={styles.noComments}>No comments yet.</p>
              ) : (
                comments.map((c) => (
                  <div key={c.id} className={styles.comment}>
                    <div className={styles.commentMeta}>
                      <span className={styles.commentAuthor}>{c.author}</span>
                      <span className={styles.commentDate}>{c.date}</span>
                    </div>
                    <p className={styles.commentBody}>{c.body}</p>
                  </div>
                ))
              )}
            </div>

            <div className={styles.compose}>
              <textarea
                ref={commentRef}
                className={styles.composeInput}
                placeholder="Add a comment…"
                rows={2}
                value={commentText}
                onInput={growComment}
                onChange={(e) => setCommentText(e.target.value)}
                aria-label="Write a comment"
              />
              <button
                type="button"
                className={styles.btnPost}
                disabled={!commentText.trim() || posting}
                onClick={async () => {
                  if (!commentText.trim()) return
                  setPosting(true)
                  await onPostComment(commentText)
                  setCommentText('')
                  if (commentRef.current) commentRef.current.style.height = 'auto'
                  setPosting(false)
                }}
              >
                {posting ? 'Posting…' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && images[lightboxIndex] && (
        <div
          className={styles.lightbox}
          onClick={() => setLightboxIndex(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Photo"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[lightboxIndex].url}
            alt={`Photo ${lightboxIndex + 1}`}
            className={styles.lightboxImg}
            onClick={(e) => e.stopPropagation()}
          />
          <button
            type="button"
            className={styles.lightboxClose}
            onClick={() => setLightboxIndex(null)}
            aria-label="Close photo"
          >
            ×
          </button>
        </div>
      )}
    </>
  )
}

function AutofillRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.autofillItem}>
      <span className={styles.autofillLabel}>{label}</span>
      <span className={styles.autofillValue}>{value}</span>
    </div>
  )
}
