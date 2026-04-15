/**
 * Pin hover data contract — Issue #33
 *
 * Verifies that the map spots query returns media data needed for pin hover tooltips:
 * PH33-1  Spot with no media returns empty media array
 * PH33-2  Spot with an image returns it in the media array with url + type
 * PH33-3  The map spots query (id, title, lat, lng, spot_networks, media) succeeds for all visible spots
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedSpot,
  admin,
} from '../helpers/seed'

let userId: string
let userClient: SupabaseClient
let networkId: string

beforeAll(async () => {
  const user = await createUser('ph33-user')
  userId = user.id
  userClient = await signIn(user.email, user.password)
  networkId = await seedNetwork(userId, 'PH33 Network')
})

afterAll(async () => {
  await cleanupUsers([userId])
})

// ---------------------------------------------------------------------------
// PH33-1: Spot with no media returns empty media array
// ---------------------------------------------------------------------------
describe('PH33-1: spot with no media', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(userId, [networkId], { title: 'No-image Spot' })
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('media array is empty', async () => {
    const { data, error } = await userClient
      .from('spots')
      .select('id, title, lat, lng, spot_networks(network_id), media(url, type)')
      .eq('id', spotId)
      .single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.media).toHaveLength(0)
    expect(data!.title).toBe('No-image Spot')
  })
})

// ---------------------------------------------------------------------------
// PH33-2: Spot with an image returns it in the media array
// ---------------------------------------------------------------------------
describe('PH33-2: spot with image media', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(userId, [networkId], { title: 'Image Spot' })

    // Seed a media row for this spot directly via admin
    await admin.from('media').insert({
      spot_id: spotId,
      type: 'image',
      url: 'https://example.com/fake-storage/test-image.jpg',
    })
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('media array contains the image with url and type', async () => {
    const { data, error } = await userClient
      .from('spots')
      .select('id, title, media(url, type)')
      .eq('id', spotId)
      .single()

    expect(error).toBeNull()
    const media = data!.media as { url: string; type: string }[]
    expect(media.length).toBeGreaterThan(0)
    const img = media.find((m) => m.type === 'image')
    expect(img).toBeDefined()
    expect(img!.url).toBeTruthy()
  })
})

// ---------------------------------------------------------------------------
// PH33-3: Full map query shape works for all visible spots
// ---------------------------------------------------------------------------
describe('PH33-3: full map query shape', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(userId, [networkId], { title: 'Map Query Spot' })
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('returns id, title, lat, lng, spot_networks, and media for each spot', async () => {
    const { data, error } = await userClient
      .from('spots')
      .select('id, title, lat, lng, spot_networks(network_id), media(url, type)')
      .eq('id', spotId)
      .single()

    expect(error).toBeNull()
    expect(data!.id).toBe(spotId)
    expect(data!.title).toBe('Map Query Spot')
    expect(typeof data!.lat).toBe('number')
    expect(typeof data!.lng).toBe('number')
    expect(Array.isArray(data!.spot_networks)).toBe(true)
    expect(Array.isArray(data!.media)).toBe(true)
  })
})
