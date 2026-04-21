'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { SpotForModal, SpotMedia } from './spotTypes'
import { updateSpotAction, removeMediaAction } from '@/app/actions/spots'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import styles from './spotImmersive.module.css'

interface Network {
  id: string
  name: string
}

interface SpotImmersiveProps {
  spot: SpotForModal
  isAuthor: boolean
  networks: Network[]
  mediaIndex: number
  onMediaIndexChange: (idx: number) => void
  initialEditing: boolean
  exiting: boolean
  onBack: () => void
  onPostComment: (body: string) => Promise<void>
  onEditSave: () => void
  onEditCancel: () => void
  onDelete: () => void
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

function displayToIso(displayDate: string | undefined): string {
  if (!displayDate) return new Date().toISOString().split('T')[0]
  const parsed = new Date(displayDate)
  if (isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0]
  return parsed.toISOString().split('T')[0]
}

export default function SpotImmersive({
  spot,
  isAuthor,
  networks,
  mediaIndex,
  onMediaIndexChange,
  initialEditing,
  exiting,
  onBack,
  onPostComment,
  onEditSave,
  onEditCancel,
  onDelete,
}: SpotImmersiveProps) {
  const [drawerOpen, setDrawerOpen] = useState(initialEditing)
  const [editing, setEditing] = useState(initialEditing)
  const [commentText, setCommentText] = useState('')
  const [posting, setPosting] = useState(false)
  const [imgError, setImgError] = useState(false)

  const commentRef = useRef<HTMLTextAreaElement>(null)
  const lastFocusedRef = useRef<HTMLElement | null>(null)
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

  // Save and restore previous focus
  useEffect(() => {
    lastFocusedRef.current = document.activeElement as HTMLElement | null
    return () => {
      lastFocusedRef.current?.focus?.()
    }
  }, [])

  // Scroll lock while drawer open
  useEffect(() => {
    if (!drawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [drawerOpen])

  // Autoplay audio
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
      if (images.length < 2 || drawerOpen) return
      onMediaIndexChange((mediaIndex - 1 + images.length) % images.length)
    },
    [images.length, mediaIndex, onMediaIndexChange, drawerOpen]
  )

  const handleNext = useCallback(
    (e?: React.MouseEvent) => {
      e?.stopPropagation()
      if (images.length < 2 || drawerOpen) return
      onMediaIndexChange((mediaIndex + 1) % images.length)
    },
    [images.length, mediaIndex, onMediaIndexChange, drawerOpen]
  )

  const handleCascadeEscape = useCallback(() => {
    if (editing) {
      setEditing(false)
      onEditCancel()
      return
    }
    if (drawerOpen) {
      setDrawerOpen(false)
      return
    }
    onBack()
  }, [editing, drawerOpen, onBack, onEditCancel])

  // Keyboard handling
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        handleCascadeEscape()
        return
      }
      if (drawerOpen) return
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        handlePrev()
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        handleNext()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [handlePrev, handleNext, drawerOpen, handleCascadeEscape])

  function handleStripClick() {
    setDrawerOpen(true)
  }

  function handleEnterEdit() {
    setEditing(true)
    setDrawerOpen(true)
  }

  const byline = useMemo(() => {
    const parts: string[] = []
    if (spot.author) parts.push(spot.author)
    if (spot.state) parts.push(spot.state)
    if (spot.date) {
      parts.push(spot.date.replace(/\s\d+,/, ''))
    }
    return parts.join(' · ')
  }, [spot.author, spot.state, spot.date])

  const excerptText = useMemo(() => {
    if (!spot.description) return ''
    const t = spot.description.replace(/\s+/g, ' ').trim()
    return t.length <= 100 ? t : t.slice(0, 100).trimEnd() + '…'
  }, [spot.description])

  const comments = spot.comments ?? []

  return (
    <div
      className={`${styles.immersive} ${exiting ? styles.immersiveExiting : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label={spot.title}
    >
      {/* Full-bleed media */}
      <div
        className={styles.mediaLayer}
        aria-hidden={drawerOpen ? 'true' : undefined}
        onClick={drawerOpen ? () => setDrawerOpen(false) : undefined}
      >
        {soundOnly ? (
          <div className={styles.soundOnlyFull}>
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
            <p className={styles.soundOnlyTitle}>{spot.title}</p>
          </div>
        ) : currentImage && !imgError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentImage.url}
            alt={spot.title}
            className={styles.mediaImg}
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.quoteFull}>
            <p className={styles.quoteText}>
              {spot.description
                ? `“${spot.description.slice(0, 140)}${spot.description.length > 140 ? '…' : ''}”`
                : 'No photographs'}
            </p>
          </div>
        )}
      </div>

      {/* Top chrome */}
      <div className={styles.topChrome}>
        <button
          type="button"
          className={styles.chromeBtn}
          onClick={onBack}
          aria-label="Back"
        >
          ←
        </button>
        <div className={styles.topRight}>
          {mixed && (
            <button
              type="button"
              className={styles.chromeBtn}
              onClick={() => {
                const next = !audioMuted
                setAudioMuted(next)
                if (audioRef.current) audioRef.current.muted = next
              }}
              aria-label={audioMuted ? 'Unmute audio' : 'Mute audio'}
            >
              {audioMuted ? '🔇' : '🔊'}
            </button>
          )}
          {isAuthor && !editing && (
            <button
              type="button"
              className={styles.chromeBtn}
              onClick={handleEnterEdit}
              aria-label="Edit spot"
            >
              ✎
            </button>
          )}
        </div>
      </div>

      {/* Media nav (only when drawer closed) */}
      {!drawerOpen && images.length > 1 && (
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

      {/* Bottom strip / drawer */}
      <div
        className={`${styles.strip} ${drawerOpen ? styles.stripOpen : ''}`}
        role={drawerOpen ? undefined : 'button'}
        tabIndex={drawerOpen ? undefined : 0}
        onClick={drawerOpen ? undefined : handleStripClick}
        aria-label={drawerOpen ? undefined : 'Open details'}
      >
        <div className={styles.handle} aria-hidden="true" />
        {!drawerOpen && (
          <div className={styles.stripPreview}>
            <p className={styles.stripTitle}>{spot.title}</p>
            {excerptText && <p className={styles.stripExcerpt}>{excerptText}</p>}
          </div>
        )}

        {drawerOpen && !editing && (
          <ViewContent
            spot={spot}
            byline={byline}
            networks={networks}
            comments={comments}
            commentText={commentText}
            setCommentText={setCommentText}
            posting={posting}
            commentRef={commentRef}
            onPost={async () => {
              if (!commentText.trim()) return
              setPosting(true)
              await onPostComment(commentText)
              setCommentText('')
              if (commentRef.current) commentRef.current.style.height = 'auto'
              setPosting(false)
            }}
          />
        )}

        {drawerOpen && editing && (
          <EditContent
            spot={spot}
            networks={networks}
            onSave={() => {
              setEditing(false)
              onEditSave()
            }}
            onCancel={() => {
              setEditing(false)
              onEditCancel()
            }}
            onDelete={onDelete}
          />
        )}
      </div>

      {hasAudio && audios[0] && (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio ref={audioRef} src={audios[0].url} preload="auto" />
      )}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// View content (drawer open, not editing)
// ────────────────────────────────────────────────────────────────

interface ViewContentProps {
  spot: SpotForModal
  byline: string
  networks: Network[]
  comments: { id: string; author: string; body: string; date: string }[]
  commentText: string
  setCommentText: (t: string) => void
  posting: boolean
  commentRef: React.RefObject<HTMLTextAreaElement | null>
  onPost: () => Promise<void>
}

function ViewContent({
  spot,
  byline,
  networks,
  comments,
  commentText,
  setCommentText,
  posting,
  commentRef,
  onPost,
}: ViewContentProps) {
  function growComment() {
    const el = commentRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  const networkNames = (spot.spot_networks ?? [])
    .map((sn) => networks.find((n) => n.id === sn.network_id)?.name)
    .filter((n): n is string => !!n)

  return (
    <div className={styles.drawerContent}>
      <h2 className={styles.drawerTitle}>{spot.title}</h2>
      {byline && <p className={styles.drawerByline}>{byline}</p>}

      {networkNames.length > 0 && (
        <div className={styles.networkBadges}>
          {networkNames.map((n) => (
            <span key={n} className={styles.networkBadge}>{n}</span>
          ))}
        </div>
      )}

      {spot.description && (
        <p className={styles.drawerDescription}>{spot.description}</p>
      )}

      {spot.tags && spot.tags.length > 0 && (
        <div className={styles.tags}>
          {spot.tags.map((t) => (
            <span key={t} className={styles.tag}>#{t}</span>
          ))}
        </div>
      )}

      <div className={styles.commentsSection}>
        <p className={styles.commentsLabel}>Comments</p>
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
          onClick={onPost}
        >
          {posting ? 'Posting…' : 'Post'}
        </button>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Edit content (drawer open, editing)
// ────────────────────────────────────────────────────────────────

interface EditContentProps {
  spot: SpotForModal
  networks: Network[]
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

function EditContent({ spot, networks, onSave, onCancel, onDelete }: EditContentProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(
    new Set(spot.spot_networks.map((sn) => sn.network_id))
  )
  const [existingMedia, setExistingMedia] = useState<SpotMedia[]>(spot.media ?? [])
  const [newFiles, setNewFiles] = useState<File[]>([])

  useEffect(() => {
    const t = setTimeout(() => titleRef.current?.focus(), 100)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [])

  function growDesc() {
    const el = descRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }

  function toggleNetwork(id: string) {
    setSelectedNetworks((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
    setNetworkError(false)
  }

  function handleNewFiles(fileList: FileList | null) {
    if (!fileList) return
    const valid: File[] = []
    for (const f of Array.from(fileList)) {
      const isImage = ALLOWED_IMAGE_TYPES.includes(f.type)
      const isAudio = ALLOWED_AUDIO_TYPES.includes(f.type)
      if (isImage && f.size <= MAX_IMAGE_BYTES) valid.push(f)
      else if (isAudio && f.size <= MAX_AUDIO_BYTES) valid.push(f)
    }
    setNewFiles((prev) => [...prev, ...valid])
  }

  async function handleRemoveExisting(m: SpotMedia) {
    if (!m.id) {
      setExistingMedia((prev) => prev.filter((x) => x !== m))
      return
    }
    await removeMediaAction(m.id, m.url)
    setExistingMedia((prev) => prev.filter((x) => x.id !== m.id))
  }

  async function uploadNewMedia(spotId: string) {
    if (newFiles.length === 0) return
    const supabase = createSupabaseBrowserClient()
    for (const file of newFiles) {
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${spotId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: storErr } = await supabase.storage.from('media').upload(path, file)
      if (storErr) continue
      const type = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'audio'
      await supabase.from('media').insert({ spot_id: spotId, url: path, type, name: file.name })
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const title = titleRef.current?.value.trim() ?? ''
    if (!title) {
      setTitleError(true)
      titleRef.current?.focus()
      return
    }
    if (selectedNetworks.size === 0) {
      setNetworkError(true)
      return
    }

    setPending(true)
    setError(null)
    setTitleError(false)
    setNetworkError(false)

    const fd = new FormData()
    fd.set('title', title)
    fd.set('description', descRef.current?.value ?? '')
    fd.set('date', dateRef.current?.value ?? new Date().toISOString().split('T')[0])
    for (const nid of selectedNetworks) fd.append('networks', nid)

    const result = await updateSpotAction(spot.id, fd)
    if (result.error) {
      setError(result.error)
      setPending(false)
      return
    }

    await uploadNewMedia(spot.id)
    setPending(false)
    onSave()
  }

  function handleDelete() {
    if (!confirm('Delete this spot? This cannot be undone.')) return
    onDelete()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className={styles.editForm}>
      {/* Thumbnail strip */}
      <div className={styles.thumbStrip}>
        {existingMedia.map((m, i) => (
          <div key={m.id ?? `e${i}`} className={styles.thumbCell}>
            {m.type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={m.url} alt={`Photo ${i + 1}`} className={styles.thumbImg} />
            ) : (
              <div className={styles.thumbAudio}>♪</div>
            )}
            <button
              type="button"
              className={styles.thumbDelete}
              onClick={() => handleRemoveExisting(m)}
              aria-label="Remove media"
            >
              ×
            </button>
          </div>
        ))}
        {newFiles.map((f, i) => (
          <div key={`n${i}`} className={styles.thumbCell}>
            {ALLOWED_IMAGE_TYPES.includes(f.type) ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={URL.createObjectURL(f)} alt={f.name} className={styles.thumbImg} />
            ) : (
              <div className={styles.thumbAudio}>♪</div>
            )}
            <button
              type="button"
              className={styles.thumbDelete}
              onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))}
              aria-label={`Remove ${f.name}`}
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          className={styles.thumbAdd}
          onClick={() => fileInputRef.current?.click()}
          aria-label="Add media"
        >
          +
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/mp4"
          multiple
          style={{ display: 'none' }}
          onChange={(e) => handleNewFiles(e.target.files)}
        />
      </div>

      <label className={styles.editLabel}>
        <span>Title</span>
        <input
          ref={titleRef}
          type="text"
          className={`${styles.editInput} ${titleError ? styles.editInputError : ''}`}
          defaultValue={spot.title}
          onChange={() => setTitleError(false)}
        />
      </label>
      {titleError && <p className={styles.fieldError}>A title is required.</p>}

      <label className={styles.editLabel}>
        <span>Description</span>
        <textarea
          ref={descRef}
          className={styles.editTextarea}
          defaultValue={spot.description ?? ''}
          rows={3}
          onInput={growDesc}
        />
      </label>

      <label className={styles.editLabel}>
        <span>Date</span>
        <input
          ref={dateRef}
          type="date"
          className={styles.editInput}
          defaultValue={displayToIso(spot.date)}
        />
      </label>

      <div className={styles.editLabel}>
        <span>Circles</span>
        <div className={styles.networkPills}>
          {networks.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`${styles.networkPill} ${selectedNetworks.has(n.id) ? styles.networkPillSelected : ''}`}
              onClick={() => toggleNetwork(n.id)}
            >
              {n.name}
            </button>
          ))}
        </div>
      </div>
      {networkError && <p className={styles.fieldError}>Select at least one circle.</p>}

      {error && <p className={styles.serverError} role="alert">{error}</p>}

      <div className={styles.editFooter}>
        <button
          type="button"
          className={styles.btnDanger}
          onClick={handleDelete}
          disabled={pending}
        >
          Delete
        </button>
        <div className={styles.editFooterRight}>
          <button
            type="button"
            className={styles.btnCancel}
            onClick={onCancel}
            disabled={pending}
          >
            Cancel
          </button>
          <button type="submit" className={styles.btnPrimary} disabled={pending}>
            {pending ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </form>
  )
}
