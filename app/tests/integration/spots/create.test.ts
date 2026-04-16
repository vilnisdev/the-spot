/**
 * Spot creation — Cycles SC1–SC7
 *
 * Verifies the create_spot RPC and related RLS rules against the live test DB.
 * The RPC is SECURITY DEFINER to solve the spot_networks bootstrapping problem
 * (spot_networks_insert policy checks spots.author_id via a subquery that is
 * blocked by spots_select RLS until at least one network is attached).
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedMembership,
  admin,
} from '../helpers/seed'

let authorId: string
let memberId: string
let outsiderId: string
let authorClient: SupabaseClient
let memberClient: SupabaseClient
let outsiderClient: SupabaseClient
let networkId: string
let secondNetworkId: string

beforeAll(async () => {
  const author = await createUser('sc-author')
  const member = await createUser('sc-member')
  const outsider = await createUser('sc-outsider')

  authorId = author.id
  memberId = member.id
  outsiderId = outsider.id

  authorClient = await signIn(author.email, author.password)
  memberClient = await signIn(member.email, member.password)
  outsiderClient = await signIn(outsider.email, outsider.password)

  networkId = await seedNetwork(authorId, 'SC Network A')
  await seedMembership(memberId, networkId)

  secondNetworkId = await seedNetwork(authorId, 'SC Network B')
})

afterAll(async () => {
  await cleanupUsers([authorId, memberId, outsiderId])
})

// ---------------------------------------------------------------------------
// SC1: create_spot RPC creates spot + spot_networks atomically
// ---------------------------------------------------------------------------
describe('SC1: create_spot RPC — basic creation', () => {
  let spotId: string

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('RPC returns a UUID; row exists with correct fields', async () => {
    const { data, error } = await authorClient.rpc('create_spot', {
      p_title: 'SC1 Spot',
      p_description: 'A red rock canyon. #utah #desert',
      p_lat: 38.7436,
      p_lng: -109.4993,
      p_state: 'Utah',
      p_date: '2026-04-13',
      p_network_ids: [networkId],
      p_tag_names: ['utah', 'desert'],
    })

    expect(error).toBeNull()
    expect(typeof data).toBe('string')
    spotId = data as string

    const { data: row } = await admin
      .from('spots')
      .select('title, lat, lng, state, author_id')
      .eq('id', spotId)
      .single()

    expect(row!.title).toBe('SC1 Spot')
    expect(row!.state).toBe('Utah')
    expect(row!.author_id).toBe(authorId)
  })

  it('spot_networks row exists after RPC', async () => {
    const { data } = await admin
      .from('spot_networks')
      .select('network_id')
      .eq('spot_id', spotId)

    expect(data).toHaveLength(1)
    expect(data![0].network_id).toBe(networkId)
  })
})

// ---------------------------------------------------------------------------
// SC2: Spot visibility after creation
// ---------------------------------------------------------------------------
describe('SC2: Spot visible to network member, invisible to outsider', () => {
  let spotId: string

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  beforeAll(async () => {
    const { data } = await authorClient.rpc('create_spot', {
      p_title: 'SC2 Spot',
      p_description: null,
      p_lat: 45.0,
      p_lng: -90.0,
      p_state: null,
      p_date: '2026-04-13',
      p_network_ids: [networkId],
    })
    spotId = data as string
  })

  it('network member can SELECT the spot', async () => {
    const { data, error } = await memberClient
      .from('spots')
      .select('id, title')
      .eq('id', spotId)
      .maybeSingle()

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.title).toBe('SC2 Spot')
  })

  it('outsider cannot SELECT the spot', async () => {
    const { data, error } = await outsiderClient
      .from('spots')
      .select('id')
      .eq('id', spotId)
      .maybeSingle()

    expect(error).toBeNull()
    expect(data).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// SC3: Spot across multiple networks
// ---------------------------------------------------------------------------
describe('SC3: Spot in two networks visible to members of either', () => {
  let spotId: string
  let secondMemberId: string
  let secondMemberClient: SupabaseClient

  beforeAll(async () => {
    const sm = await createUser('sc3-member2')
    secondMemberId = sm.id
    secondMemberClient = await signIn(sm.email, sm.password)
    await seedMembership(secondMemberId, secondNetworkId)

    const { data } = await authorClient.rpc('create_spot', {
      p_title: 'SC3 Spot',
      p_description: null,
      p_lat: 0,
      p_lng: 0,
      p_state: null,
      p_date: '2026-04-13',
      p_network_ids: [networkId, secondNetworkId],
    })
    spotId = data as string
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
    await cleanupUsers([secondMemberId])
  })

  it('member of network A can see spot', async () => {
    const { data } = await memberClient.from('spots').select('id').eq('id', spotId).maybeSingle()
    expect(data).not.toBeNull()
  })

  it('member of network B can see spot', async () => {
    const { data } = await secondMemberClient.from('spots').select('id').eq('id', spotId).maybeSingle()
    expect(data).not.toBeNull()
  })

  it('outsider sees nothing', async () => {
    const { data } = await outsiderClient.from('spots').select('id').eq('id', spotId).maybeSingle()
    expect(data).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// SC4: RPC requires at least one network
// ---------------------------------------------------------------------------
describe('SC4: create_spot requires at least one network', () => {
  it('RPC raises exception when p_network_ids is empty', async () => {
    const { data, error } = await authorClient.rpc('create_spot', {
      p_title: 'SC4 No Network',
      p_description: null,
      p_lat: 0,
      p_lng: 0,
      p_state: null,
      p_date: '2026-04-13',
      p_network_ids: [],
    })

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// SC5: Tags created and linked via RPC
// ---------------------------------------------------------------------------
describe('SC5: Tags upserted and linked by create_spot RPC', () => {
  let spotId: string

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('spot_tags rows exist; member can read tags', async () => {
    const { data } = await authorClient.rpc('create_spot', {
      p_title: 'SC5 Tagged',
      p_description: 'Notes #canyon #desert',
      p_lat: 0,
      p_lng: 0,
      p_state: null,
      p_date: '2026-04-13',
      p_network_ids: [networkId],
      p_tag_names: ['canyon', 'desert'],
    })
    spotId = data as string

    const { data: tags, error } = await memberClient
      .from('spot_tags')
      .select('tag_id')
      .eq('spot_id', spotId)

    expect(error).toBeNull()
    expect(tags).toHaveLength(2)
  })
})

// ---------------------------------------------------------------------------
// SC6: Media — author insert; member select; outsider blocked; type check
// ---------------------------------------------------------------------------
describe('SC6: Media RLS and constraints', () => {
  let spotId: string

  beforeAll(async () => {
    const { data } = await authorClient.rpc('create_spot', {
      p_title: 'SC6 Media Spot',
      p_description: null,
      p_lat: 0,
      p_lng: 0,
      p_state: null,
      p_date: '2026-04-13',
      p_network_ids: [networkId],
    })
    spotId = data as string
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('author inserts a media record; member can select it', async () => {
    const fakeUrl = `https://example.com/media/${spotId}/photo.jpg`
    const { error: insertErr } = await authorClient.from('media').insert({
      spot_id: spotId,
      url: fakeUrl,
      type: 'image',
    })
    expect(insertErr).toBeNull()

    const { data: media, error: selErr } = await memberClient
      .from('media')
      .select('url, type')
      .eq('spot_id', spotId)
    expect(selErr).toBeNull()
    expect(media).toHaveLength(1)
    expect(media![0].type).toBe('image')
  })

  it('outsider cannot select media', async () => {
    const { data, error } = await outsiderClient
      .from('media')
      .select('url')
      .eq('spot_id', spotId)
    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })

  it('media type check rejects invalid type', async () => {
    const { error } = await admin.from('media').insert({
      spot_id: spotId,
      url: 'https://example.com/x.mp4',
      type: 'video',
    })
    expect(error).not.toBeNull()
    expect(error!.message).toMatch(/check/i)
  })
})

// ---------------------------------------------------------------------------
// SC7: Unauthenticated caller cannot create spot
// ---------------------------------------------------------------------------
describe('SC7: Unauthenticated RPC call is rejected', () => {
  it('anon client gets error from create_spot', async () => {
    const { createClient } = await import('@supabase/supabase-js')
    const anon = createClient(
      process.env.SUPABASE_TEST_URL!,
      process.env.SUPABASE_TEST_ANON_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    const { data, error } = await anon.rpc('create_spot', {
      p_title: 'SC7 Anon',
      p_description: null,
      p_lat: 0,
      p_lng: 0,
      p_state: null,
      p_date: '2026-04-13',
      p_network_ids: [networkId],
    })

    expect(error).not.toBeNull()
    expect(data).toBeNull()
  })
})
