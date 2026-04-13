'use client'

import { useRef, useState, useEffect } from 'react'
import { createSpotAction, type CreatedSpot } from '@/app/actions/spots'
import { createSupabaseBrowserClient } from '@/lib/supabase/browser'
import styles from './spotCreationForm.module.css'

interface Network {
  id: string
  name: string
}

interface LatLng {
  lat: number
  lng: number
}

interface Props {
  open: boolean
  latlng: LatLng | null
  networks: Network[]
  username: string
  onSave: (spot: CreatedSpot) => void
  onCancel: () => void
}

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
const ALLOWED_AUDIO_TYPES = ['audio/mpeg', 'audio/wav', 'audio/mp4']
const MAX_IMAGE_BYTES = 10 * 1024 * 1024
const MAX_AUDIO_BYTES = 20 * 1024 * 1024

function formatDate(d: Date) {
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

function formatCoords(latlng: LatLng) {
  const latStr = `${Math.abs(latlng.lat).toFixed(4)}° ${latlng.lat >= 0 ? 'N' : 'S'}`
  const lngStr = `${Math.abs(latlng.lng).toFixed(4)}° ${latlng.lng >= 0 ? 'E' : 'W'}`
  return `${latStr}, ${lngStr}`
}

export default function SpotCreationForm({
  open,
  latlng,
  networks,
  username,
  onSave,
  onCancel,
}: Props) {
  const formRef = useRef<HTMLFormElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const descRef = useRef<HTMLTextAreaElement>(null)

  const [pending, setPending] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [titleError, setTitleError] = useState(false)
  const [networkError, setNetworkError] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [showDiscard, setShowDiscard] = useState(false)
  const [selectedNetworks, setSelectedNetworks] = useState<Set<string>>(new Set())
  const [files, setFiles] = useState<File[]>([])
  const [date] = useState(() => formatDate(new Date()))
  const [isoDate] = useState(() => new Date().toISOString().split('T')[0])

  // Reset form when opened
  useEffect(() => {
    if (open) {
      setError(null)
      setTitleError(false)
      setNetworkError(false)
      setDirty(false)
      setShowDiscard(false)
      setSelectedNetworks(new Set())
      setFiles([])
      // Focus title after slide-up animation
      const t = setTimeout(() => titleRef.current?.focus(), 760)
      return () => clearTimeout(t)
    }
  }, [open])

  // Auto-grow textarea
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
    setDirty(true)
    setNetworkError(false)
  }

  function handleFileChange(newFiles: FileList | null) {
    if (!newFiles) return
    const valid: File[] = []
    for (const f of Array.from(newFiles)) {
      const isImage = ALLOWED_IMAGE_TYPES.includes(f.type)
      const isAudio = ALLOWED_AUDIO_TYPES.includes(f.type)
      if (isImage && f.size <= MAX_IMAGE_BYTES) valid.push(f)
      else if (isAudio && f.size <= MAX_AUDIO_BYTES) valid.push(f)
    }
    setFiles((prev) => [...prev, ...valid])
    setDirty(true)
  }

  function removeFile(file: File) {
    setFiles((prev) => prev.filter((f) => f !== file))
  }

  function attemptCancel() {
    if (dirty) {
      setShowDiscard(true)
    } else {
      onCancel()
    }
  }

  async function uploadMedia(spotId: string) {
    if (files.length === 0) return
    const supabase = createSupabaseBrowserClient()
    for (const file of files) {
      const ext = file.name.split('.').pop() ?? 'bin'
      const path = `${spotId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error: storErr } = await supabase.storage.from('media').upload(path, file)
      if (storErr) continue // best-effort; don't fail the save

      const { data: urlData } = supabase.storage.from('media').getPublicUrl(path)
      const type = ALLOWED_IMAGE_TYPES.includes(file.type) ? 'image' : 'audio'
      await supabase.from('media').insert({ spot_id: spotId, url: urlData.publicUrl, type })
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (!latlng) return

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
    fd.set('lat', String(latlng.lat))
    fd.set('lng', String(latlng.lng))
    fd.set('date', isoDate)
    for (const nid of selectedNetworks) fd.append('networks', nid)

    const result = await createSpotAction(fd)

    if ('error' in result && result.error) {
      setError(result.error)
      setPending(false)
      return
    }

    if (!('spot' in result) || !result.spot) {
      setError('Unexpected error saving spot.')
      setPending(false)
      return
    }

    await uploadMedia(result.spot.id)

    setPending(false)
    onSave(result.spot)
  }

  if (!open) return null

  return (
    <div className={styles.overlay} role="dialog" aria-modal="true" aria-label="Create a new spot">
      <button
        className={styles.closeBtn}
        onClick={attemptCancel}
        aria-label="Cancel"
        type="button"
        disabled={pending}
      >
        ×
      </button>

      <form ref={formRef} onSubmit={handleSubmit} noValidate>
        <div className={styles.inner}>
          {/* ── Left: media upload ── */}
          <div className={styles.mediaCol}>
            <UploadZone files={files} onAdd={handleFileChange} onRemove={removeFile} />
            {latlng && (
              <p className={styles.coords}>{formatCoords(latlng)}</p>
            )}
          </div>

          {/* ── Right: metadata ── */}
          <div className={styles.metaCol}>
            {/* Title */}
            <input
              ref={titleRef}
              name="title"
              type="text"
              className={`${styles.title} ${titleError ? styles.titleError : ''}`}
              placeholder="Name this spot…"
              aria-label="Spot title"
              autoComplete="off"
              onChange={() => { setDirty(true); setTitleError(false) }}
            />
            {titleError && (
              <p className={styles.fieldError}>A title is required to save.</p>
            )}

            {/* Description */}
            <textarea
              ref={descRef}
              name="description"
              className={styles.desc}
              placeholder="Field notes, observations… use #words to tag this spot."
              aria-label="Field notes"
              rows={3}
              onInput={growDesc}
              onChange={() => setDirty(true)}
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

            {/* Auto-fill: date + author */}
            <div className={styles.autofill}>
              <AutofillItem label="Date" value={date} />
              <AutofillItem label="Author" value={username} />
            </div>

            {/* Discard banner */}
            {showDiscard && (
              <div className={styles.discardBanner} role="alert">
                <span>Discard unsaved notes?</span>
                <button type="button" className={styles.discardConfirm} onClick={onCancel}>
                  Yes, discard
                </button>
                <button type="button" className={styles.discardKeep} onClick={() => setShowDiscard(false)}>
                  Keep editing
                </button>
              </div>
            )}

            {/* Server error */}
            {error && <p className={styles.serverError} role="alert">{error}</p>}

            {/* Actions */}
            <div className={styles.actions}>
              <button type="submit" className={styles.btnPrimary} disabled={pending}>
                {pending ? 'Saving…' : 'Save Spot'}
              </button>
              <button type="button" className={styles.btnGhost} onClick={attemptCancel} disabled={pending}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// AutofillItem — read-only field, editable on click
// ---------------------------------------------------------------------------
function AutofillItem({ label, value }: { label: string; value: string }) {
  const [editable, setEditable] = useState(false)
  return (
    <div className={styles.autofillItem}>
      <span className={styles.autofillLabel}>{label}</span>
      <input
        type="text"
        className={styles.autofillValue}
        defaultValue={value}
        readOnly={!editable}
        onFocus={() => setEditable(true)}
        onBlur={() => setEditable(false)}
        aria-label={label}
      />
    </div>
  )
}

// ---------------------------------------------------------------------------
// UploadZone
// ---------------------------------------------------------------------------
interface UploadZoneProps {
  files: File[]
  onAdd: (files: FileList | null) => void
  onRemove: (file: File) => void
}

function UploadZone({ files, onAdd, onRemove }: UploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    onAdd(e.dataTransfer.files)
  }

  return (
    <div
      className={`${styles.uploadZone} ${dragging ? styles.uploadDragging : ''}`}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      role="button"
      tabIndex={0}
      aria-label="Upload photographs or sound files"
    >
      <span className={styles.cornerTL} />
      <span className={styles.cornerTR} />
      <span className={styles.cornerBL} />
      <span className={styles.cornerBR} />
      <div className={styles.dashedBorder} />

      {files.length === 0 ? (
        <div className={styles.uploadPlaceholder}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
            <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
            <circle cx="12" cy="13" r="4"/>
          </svg>
          <p className={styles.uploadLabel}>Attach photographs</p>
          <p className={styles.uploadHint}>drag &amp; drop or click to browse</p>
        </div>
      ) : (
        <div className={styles.thumbGrid} onClick={(e) => e.stopPropagation()}>
          {files.map((file, i) => (
            <div key={i} className={styles.thumbItem}>
              {ALLOWED_IMAGE_TYPES.includes(file.type) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  className={styles.thumbImg}
                />
              ) : (
                <div className={styles.thumbAudio}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>
                  </svg>
                  <span>{file.name}</span>
                </div>
              )}
              <button
                type="button"
                className={styles.thumbRemove}
                aria-label={`Remove ${file.name}`}
                onClick={(e) => { e.stopPropagation(); onRemove(file) }}
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            className={styles.addMoreBtn}
            onClick={() => inputRef.current?.click()}
            aria-label="Add more files"
          >
            +
          </button>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,audio/mpeg,audio/wav,audio/mp4"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => onAdd(e.target.files)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  )
}
