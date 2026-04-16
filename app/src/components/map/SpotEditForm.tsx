'use client'

import { useRef, useState, useEffect } from 'react'
import { updateSpotAction, removeMediaAction } from '@/app/actions/spots'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import type { SpotForModal, SpotMedia } from './spotTypes'
import styles from './spotCreationForm.module.css'

interface Network {
  id: string
  name: string
}

interface SpotEditFormProps {
  spot: SpotForModal
  networks: Network[]
  onSave: () => void
  onCancel: () => void
  onDelete: () => void
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

// Convert display date (e.g. "April 12, 2026") to ISO YYYY-MM-DD for the input
function displayToIso(displayDate: string | undefined): string {
  if (!displayDate) return new Date().toISOString().split('T')[0]
  const parsed = new Date(displayDate)
  if (isNaN(parsed.getTime())) return new Date().toISOString().split('T')[0]
  return parsed.toISOString().split('T')[0]
}

export default function SpotEditForm({ spot, networks, onSave, onCancel, onDelete }: SpotEditFormProps) {
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)
  const dateRef = useRef<HTMLInputElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [pending, setPending] = useState(false)
  const [exiting, setExiting] = useState(false)
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

  // Auto-grow textarea
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
      next.has(id) ? next.delete(id) : next.add(id)
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

  async function handleRemoveExisting(media: SpotMedia) {
    if (!media.id) {
      setExistingMedia((prev) => prev.filter((m) => m !== media))
      return
    }
    await removeMediaAction(media.id, media.url)
    setExistingMedia((prev) => prev.filter((m) => m.id !== media.id))
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

  function handleClose() {
    setExiting(true)
    setTimeout(onCancel, 750)
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
    setExiting(true)
    setTimeout(onSave, 750)
  }

  return (
    <div
      className={`${styles.overlay} ${exiting ? styles.overlayExiting : ''}`}
      role="dialog"
      aria-modal="true"
      aria-label="Edit spot"
    >
      <button
        className={styles.closeBtn}
        onClick={handleClose}
        aria-label="Cancel edit"
        type="button"
        disabled={pending}
      >
        ×
      </button>

      <form onSubmit={handleSubmit} noValidate>
        <div className={styles.inner}>
          {/* ── Left: media ── */}
          <div className={styles.mediaCol}>
            {/* Existing media */}
            {existingMedia.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {existingMedia.map((m, i) => (
                  <div key={m.id ?? i} style={{ position: 'relative', width: 64, flexShrink: 0 }}>
                    {m.type === 'image' ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.url}
                        alt={`Photo ${i + 1}`}
                        style={{ width: 64, height: 80, objectFit: 'cover', display: 'block', border: '1px solid var(--rule)' }}
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                      />
                    ) : (
                      <div style={{ width: 64, height: 64, background: 'var(--panel-bg)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveExisting(m)}
                      aria-label="Remove media"
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 18, height: 18, padding: 0,
                        background: 'rgba(44,36,22,0.7)', border: 'none',
                        color: 'white', fontSize: '0.8rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* New files staged */}
            {newFiles.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {newFiles.map((f, i) => (
                  <div key={i} style={{ position: 'relative', width: 64, flexShrink: 0 }}>
                    {ALLOWED_IMAGE_TYPES.includes(f.type) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        style={{ width: 64, height: 80, objectFit: 'cover', display: 'block', border: '1px solid var(--rule)' }}
                      />
                    ) : (
                      <div style={{ width: 64, height: 64, background: 'var(--panel-bg)', border: '1px solid var(--rule)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                        </svg>
                      </div>
                    )}
                    <button
                      type="button"
                      onClick={() => setNewFiles((prev) => prev.filter((_, j) => j !== i))}
                      aria-label={`Remove ${f.name}`}
                      style={{
                        position: 'absolute', top: 2, right: 2,
                        width: 18, height: 18, padding: 0,
                        background: 'rgba(44,36,22,0.7)', border: 'none',
                        color: 'white', fontSize: '0.8rem', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        lineHeight: 1,
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add media */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                fontFamily: 'var(--font-body)',
                fontSize: '0.72rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'var(--ink-faint)',
                background: 'transparent',
                border: '1px dashed var(--tan)',
                padding: '8px 12px',
                cursor: 'pointer',
                width: '100%',
              }}
            >
              + Add media
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

          {/* ── Right: metadata ── */}
          <div className={styles.metaCol}>
            <input
              ref={titleRef}
              name="title"
              type="text"
              className={`${styles.title} ${titleError ? styles.titleError : ''}`}
              defaultValue={spot.title}
              placeholder="Name this spot…"
              aria-label="Spot title"
              autoComplete="off"
              onChange={() => setTitleError(false)}
            />
            {titleError && (
              <p className={styles.fieldError}>A title is required to save.</p>
            )}

            <textarea
              ref={descRef}
              name="description"
              className={styles.desc}
              defaultValue={spot.description ?? ''}
              placeholder="Field notes, observations… use #words to tag this spot."
              aria-label="Field notes"
              rows={3}
              onInput={growDesc}
            />

            {/* Networks */}
            <div className={styles.networksRow}>
              <span className={styles.networksLabel}>Visible to</span>
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
            {networkError && (
              <p className={styles.fieldError}>Select at least one network.</p>
            )}

            {/* Date */}
            <div className={styles.autofill}>
              <div className={styles.autofillItem}>
                <span className={styles.autofillLabel}>Date</span>
                <input
                  ref={dateRef}
                  name="date"
                  type="date"
                  className={styles.autofillValue}
                  defaultValue={displayToIso(spot.date)}
                  aria-label="Date"
                />
              </div>
            </div>

            {error && <p className={styles.serverError} role="alert">{error}</p>}

            <div className={styles.actions}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>
                {pending ? 'Saving…' : 'Save Changes'}
              </button>
              <button
                type="button"
                className={styles.btnDanger}
                onClick={onDelete}
                disabled={pending}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}
