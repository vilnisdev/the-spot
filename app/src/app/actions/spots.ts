'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { SpotForModal, SpotMedia, SpotComment } from '@/components/map/spotTypes'

export interface CreatedSpot {
  id: string
  title: string
  lat: number
  lng: number
  spot_networks: { network_id: string }[]
}

export type SpotActionResult =
  | { spot: CreatedSpot; error?: never }
  | { error: string; spot?: never }

export type SpotDetailActionResult =
  | { spot: SpotForModal; isAuthor: boolean; error?: never }
  | { error: string; spot?: never }

export type CommentActionResult =
  | { comment: SpotComment; error?: never }
  | { error: string; comment?: never }

// ---------------------------------------------------------------------------
// Reverse-geocode lat/lng → US state name via Nominatim (best-effort).
// Returns null on any error — the state field is optional.
// ---------------------------------------------------------------------------
async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
    const res = await fetch(url, {
      headers: { 'User-Agent': 'TheSpot/1.0 (contact@thespot.app)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    const json = await res.json()
    return (json?.address?.state as string | undefined) ?? null
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Extract #hashtag words from a description string.
// Returns lowercase strings with no duplicates.
// ---------------------------------------------------------------------------
function extractTags(text: string | null | undefined): string[] {
  if (!text) return []
  const matches = text.match(/#([a-z0-9][a-z0-9-]*)/gi) ?? []
  return [...new Set(matches.map((t) => t.slice(1).toLowerCase()))]
}

// ---------------------------------------------------------------------------
// Parse storage path from a URL or return as-is if already a path.
// Handles both old format (full publicUrl) and new format (path only).
// ---------------------------------------------------------------------------
function parseStoragePath(urlOrPath: string): string {
  const marker = '/storage/v1/object/public/media/'
  const idx = urlOrPath.indexOf(marker)
  if (idx !== -1) return urlOrPath.slice(idx + marker.length)
  // Also handle signed URL format
  const signedMarker = '/storage/v1/object/sign/media/'
  const signedIdx = urlOrPath.indexOf(signedMarker)
  if (signedIdx !== -1) return urlOrPath.slice(signedIdx + signedMarker.length).split('?')[0]
  return urlOrPath
}

function formatDate(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// ---------------------------------------------------------------------------
// createSpotAction — called directly (not via useActionState) from client.
// Performs Nominatim geocoding, then calls create_spot RPC.
// Media upload is handled client-side after this returns.
// ---------------------------------------------------------------------------
export async function createSpotAction(formData: FormData): Promise<SpotActionResult> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const title = (formData.get('title') as string | null)?.trim()
  if (!title) return { error: 'Title is required.' }

  const lat = parseFloat(formData.get('lat') as string)
  const lng = parseFloat(formData.get('lng') as string)
  if (isNaN(lat) || isNaN(lng)) return { error: 'Invalid coordinates.' }

  const date = (formData.get('date') as string | null) ?? new Date().toISOString().split('T')[0]
  const description = (formData.get('description') as string | null)?.trim() || null
  const networkIds = formData.getAll('networks') as string[]

  if (networkIds.length === 0) return { error: 'At least one network is required.' }

  const tagNames = extractTags(description)
  const state = await reverseGeocode(lat, lng)

  const { data: spotId, error: rpcError } = await supabase.rpc('create_spot', {
    p_title: title,
    p_description: description,
    p_lat: lat,
    p_lng: lng,
    p_state: state,
    p_date: date,
    p_network_ids: networkIds,
    p_tag_names: tagNames,
  })

  if (rpcError) return { error: rpcError.message }

  return {
    spot: {
      id: spotId as string,
      title,
      lat,
      lng,
      spot_networks: networkIds.map((network_id) => ({ network_id })),
    },
  }
}

// ---------------------------------------------------------------------------
// getSpotDetailAction — fetch full spot detail for the modal.
// ---------------------------------------------------------------------------
export async function getSpotDetailAction(spotId: string): Promise<SpotDetailActionResult> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Spot + author
  const { data: spot, error: spotErr } = await supabase
    .from('spots')
    .select('id, title, description, lat, lng, state, date, author_id, profiles!author_id(username)')
    .eq('id', spotId)
    .single()

  if (spotErr || !spot) return { error: spotErr?.message ?? 'Spot not found.' }

  // Tags
  const { data: spotTagRows } = await supabase
    .from('spot_tags')
    .select('tags!inner(name)')
    .eq('spot_id', spotId)

  const tags = (spotTagRows ?? []).map(
    (row) => (row.tags as unknown as { name: string }).name
  )

  // Media — generate signed URLs
  const { data: mediaRows } = await supabase
    .from('media')
    .select('id, url, type, name')
    .eq('spot_id', spotId)
    .order('created_at')

  const media: SpotMedia[] = []
  for (const m of mediaRows ?? []) {
    const path = parseStoragePath(m.url)
    const { data: signed } = await supabase.storage.from('media').createSignedUrl(path, 3600)
    media.push({
      id: m.id,
      type: m.type as 'image' | 'audio',
      url: signed?.signedUrl ?? m.url,
      name: m.name ?? undefined,
    })
  }

  // Comments + authors
  const { data: commentRows } = await supabase
    .from('comments')
    .select('id, body, created_at, profiles!author_id(username)')
    .eq('spot_id', spotId)
    .order('created_at')

  const comments: SpotComment[] = (commentRows ?? []).map((c) => ({
    id: c.id,
    author: (c.profiles as unknown as { username: string } | null)?.username ?? 'Unknown',
    body: c.body,
    date: formatDate(c.created_at.split('T')[0]),
  }))

  // Networks (for edit form pre-selection)
  const { data: spotNetworks } = await supabase
    .from('spot_networks')
    .select('network_id')
    .eq('spot_id', spotId)

  const author = (spot.profiles as unknown as { username: string } | null)?.username

  return {
    spot: {
      id: spot.id,
      title: spot.title,
      description: spot.description ?? undefined,
      lat: spot.lat,
      lng: spot.lng,
      state: spot.state ?? undefined,
      date: spot.date ? formatDate(spot.date) : undefined,
      author: author ?? undefined,
      tags,
      media,
      comments,
      spot_networks: (spotNetworks ?? []),
    },
    isAuthor: !!user && user.id === spot.author_id,
  }
}

// ---------------------------------------------------------------------------
// postCommentAction — insert a comment and return it with author username.
// ---------------------------------------------------------------------------
export async function postCommentAction(spotId: string, body: string): Promise<CommentActionResult> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const trimmed = body.trim()
  if (!trimmed) return { error: 'Comment cannot be empty.' }

  const { data: comment, error } = await supabase
    .from('comments')
    .insert({ spot_id: spotId, author_id: user.id, body: trimmed })
    .select('id, body, created_at, profiles!author_id(username)')
    .single()

  if (error || !comment) return { error: error?.message ?? 'Failed to post comment.' }

  return {
    comment: {
      id: comment.id,
      author: (comment.profiles as unknown as { username: string } | null)?.username ?? 'Unknown',
      body: comment.body,
      date: formatDate(comment.created_at.split('T')[0]),
    },
  }
}

// ---------------------------------------------------------------------------
// updateSpotAction — update spot fields via update_spot RPC.
// ---------------------------------------------------------------------------
export async function updateSpotAction(
  spotId: string,
  formData: FormData
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const title = (formData.get('title') as string | null)?.trim()
  if (!title) return { error: 'Title is required.' }

  const description = (formData.get('description') as string | null)?.trim() || null
  const date = (formData.get('date') as string | null) || new Date().toISOString().split('T')[0]
  const networkIds = formData.getAll('networks') as string[]
  if (networkIds.length === 0) return { error: 'At least one network is required.' }

  const tagNames = extractTags(description)

  const { error: rpcError } = await supabase.rpc('update_spot', {
    p_spot_id: spotId,
    p_title: title,
    p_description: description,
    p_date: date,
    p_network_ids: networkIds,
    p_tag_names: tagNames,
  })

  return rpcError ? { error: rpcError.message } : {}
}

// ---------------------------------------------------------------------------
// deleteSpotAction — delete spot; cascades to all child rows via FK.
// RLS enforces author check on the DB side.
// ---------------------------------------------------------------------------
export async function deleteSpotAction(spotId: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.from('spots').delete().eq('id', spotId)
  return error ? { error: error.message } : {}
}

// ---------------------------------------------------------------------------
// removeMediaAction — delete one media item from storage and DB.
// storagePath: the path stored in media.url (may be full URL or path).
// ---------------------------------------------------------------------------
export async function removeMediaAction(
  mediaId: string,
  storagePath: string
): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const path = parseStoragePath(storagePath)
  // Best-effort storage delete (don't fail if file missing)
  await supabase.storage.from('media').remove([path])

  const { error } = await supabase.from('media').delete().eq('id', mediaId)
  return error ? { error: error.message } : {}
}

// ---------------------------------------------------------------------------
// getMySpotsAction — return authenticated user's spots for the profile page.
// Includes first signed image URL per spot + network names.
// ---------------------------------------------------------------------------
export interface MySpot {
  id: string
  title: string
  date: string | null
  state: string | null
  lat: number
  lng: number
  thumb_url: string | null
  network_names: string[]
  isFavorite: boolean
}

export type MySpotListResult =
  | { spots: MySpot[]; username: string; favoriteSpotId: string | null }
  | { error: string }

export async function getMySpotsAction(): Promise<MySpotListResult> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('username, favorite_spot_id')
    .eq('id', user.id)
    .single()

  const favoriteSpotId = (profile?.favorite_spot_id as string | null) ?? null

  const { data: rows, error } = await supabase
    .from('spots')
    .select('id, title, date, state, lat, lng, spot_networks(network_id, networks(name)), media(url, type)')
    .eq('author_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }

  const spots: MySpot[] = []
  for (const s of rows ?? []) {
    const networkNames = (s.spot_networks as unknown as { networks: { name: string } | null }[])
      .map((sn) => sn.networks?.name)
      .filter((n): n is string => !!n)

    const firstImage = (s.media as { url: string; type: string }[]).find((m) => m.type === 'image')
    let thumbUrl: string | null = null
    if (firstImage) {
      const path = parseStoragePath(firstImage.url)
      const { data: signed } = await supabase.storage.from('media').createSignedUrl(path, 3600)
      thumbUrl = signed?.signedUrl ?? null
    }

    spots.push({
      id: s.id,
      title: s.title,
      date: s.date ?? null,
      state: s.state ?? null,
      lat: s.lat,
      lng: s.lng,
      thumb_url: thumbUrl,
      network_names: networkNames,
      isFavorite: s.id === favoriteSpotId,
    })
  }

  return { spots, username: profile?.username ?? user.email ?? 'User', favoriteSpotId }
}

// ---------------------------------------------------------------------------
// getMapSpotsAction — return all visible spots for the map, including a
// signed thumbnail URL for the first image (used in pin hover tooltips).
// Uses batch signing to avoid N individual storage API calls.
// ---------------------------------------------------------------------------
export interface MapSpot {
  id: string
  title: string
  lat: number
  lng: number
  spot_networks: { network_id: string }[]
  thumb_url: string | null
}

export interface MapSpotsResult {
  spots: MapSpot[]
  favoriteSpot: { id: string; lat: number; lng: number } | null
}

export async function getMapSpotsAction(): Promise<MapSpotsResult> {
  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const { data: rows } = await supabase
    .from('spots')
    .select('id, title, lat, lng, spot_networks(network_id), media(url, type)')

  if (!rows) return { spots: [], favoriteSpot: null }

  let favoriteSpot: { id: string; lat: number; lng: number } | null = null
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', user.id)
      .single()
    const favId = (profile?.favorite_spot_id as string | null) ?? null
    if (favId) {
      const match = rows.find((r) => r.id === favId)
      if (match) {
        favoriteSpot = { id: match.id, lat: match.lat, lng: match.lng }
      } else {
        // Orphan: user no longer sees the favorited Spot — auto-clear
        await supabase.from('profiles').update({ favorite_spot_id: null }).eq('id', user.id)
      }
    }
  }

  // Collect first-image paths indexed by row position for batch signing
  const toSign: { rowIdx: number; path: string }[] = []
  rows.forEach((s, i) => {
    const first = (s.media as { url: string; type: string }[]).find((m) => m.type === 'image')
    if (first) toSign.push({ rowIdx: i, path: parseStoragePath(first.url) })
  })

  const signedByRow: Record<number, string> = {}
  if (toSign.length > 0) {
    const { data: signed } = await supabase.storage
      .from('media')
      .createSignedUrls(toSign.map((x) => x.path), 3600)
    ;(signed ?? []).forEach((s, idx) => {
      if (s.signedUrl) signedByRow[toSign[idx].rowIdx] = s.signedUrl
    })
  }

  const spots = rows.map((s, i) => ({
    id: s.id,
    title: s.title,
    lat: s.lat,
    lng: s.lng,
    spot_networks: s.spot_networks as { network_id: string }[],
    thumb_url: signedByRow[i] ?? null,
  }))

  return { spots, favoriteSpot }
}

// ---------------------------------------------------------------------------
// searchSpotsAction — search spots by title or tag name, RLS-enforced.
// Empty query returns [] without a DB round-trip.
// ---------------------------------------------------------------------------
export type SearchSpotResult = { id: string; title: string; lat: number; lng: number }

export type SearchSpotsActionResult =
  | { results: SearchSpotResult[] }
  | { error: string }

export async function searchSpotsAction(query: string): Promise<SearchSpotsActionResult> {
  const trimmed = query.trim()
  if (!trimmed) return { results: [] }

  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.rpc('search_spots', { p_query: trimmed })

  if (error) return { error: error.message }
  return { results: (data ?? []) as SearchSpotResult[] }
}
