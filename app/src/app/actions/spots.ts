'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

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
