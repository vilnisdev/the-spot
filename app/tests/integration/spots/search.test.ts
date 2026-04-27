/**
 * Spot search — Cycles S18-1–S18-7 (Issue #18, module 4)
 *
 * Covers the search_spots(p_query) RPC at migrations/0012_search_spots_fn.sql.
 * RPC is SECURITY INVOKER, so spots_select RLS transparently network-filters
 * the result — we verify that layered behaviour here rather than in the RPC body.
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
  anonClient,
} from '../helpers/seed'

const RUN = Date.now()
const UNIQ = (s: string) => `${s}-${RUN}`

let memberId: string
let outsiderId: string
let memberClient: SupabaseClient
let outsiderClient: SupabaseClient
let networkId: string

const createdSpotIds: string[] = []
const createdTagIds: string[] = []

async function attachTag(spotId: string, tagName: string) {
  const { data, error } = await admin
    .from('tags')
    .insert({ name: tagName })
    .select('id')
    .single()
  if (error) throw new Error(`tag insert failed: ${error.message}`)
  createdTagIds.push(data.id as string)
  const { error: linkErr } = await admin
    .from('spot_tags')
    .insert({ spot_id: spotId, tag_id: data.id })
  if (linkErr) throw new Error(`spot_tags insert failed: ${linkErr.message}`)
}

beforeAll(async () => {
  const member = await createUser('s18-member')
  const outsider = await createUser('s18-outsider')
  memberId = member.id
  outsiderId = outsider.id

  memberClient = await signIn(member.email, member.password)
  outsiderClient = await signIn(outsider.email, outsider.password)

  networkId = await seedNetwork(memberId, UNIQ('S18 Network'))
})

afterAll(async () => {
  if (createdSpotIds.length) {
    await admin.from('spots').delete().in('id', createdSpotIds)
  }
  if (createdTagIds.length) {
    await admin.from('tags').delete().in('id', createdTagIds)
  }
  await cleanupUsers([memberId, outsiderId])
})

// ---------------------------------------------------------------------------
// S18-1: title match
// ---------------------------------------------------------------------------
describe('S18-1: title substring match', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(memberId, [networkId], { title: UNIQ('Hidden Cove') })
    createdSpotIds.push(spotId)
  })

  it('returns spot when query matches a substring of the title', async () => {
    const { data, error } = await memberClient.rpc('search_spots', { p_query: 'Hidden Cove' })
    expect(error).toBeNull()
    const ids = (data ?? []).map((r: { id: string }) => r.id)
    expect(ids).toContain(spotId)
  })
})

// ---------------------------------------------------------------------------
// S18-2: case insensitive (ilike)
// ---------------------------------------------------------------------------
describe('S18-2: case-insensitive title match', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(memberId, [networkId], { title: UNIQ('Quiet Ridge') })
    createdSpotIds.push(spotId)
  })

  it('uppercase query still matches lowercase title', async () => {
    const { data, error } = await memberClient.rpc('search_spots', { p_query: 'QUIET RIDGE' })
    expect(error).toBeNull()
    const ids = (data ?? []).map((r: { id: string }) => r.id)
    expect(ids).toContain(spotId)
  })
})

// ---------------------------------------------------------------------------
// S18-3: tag match (title doesn't contain the term)
// ---------------------------------------------------------------------------
describe('S18-3: tag substring match', () => {
  let spotId: string
  const tagName = UNIQ('surfbreak')

  beforeAll(async () => {
    spotId = await seedSpot(memberId, [networkId], { title: UNIQ('Unrelated Title') })
    createdSpotIds.push(spotId)
    await attachTag(spotId, tagName)
  })

  it('returns spot when query matches a linked tag name', async () => {
    const { data, error } = await memberClient.rpc('search_spots', { p_query: 'surfbreak' })
    expect(error).toBeNull()
    const ids = (data ?? []).map((r: { id: string }) => r.id)
    expect(ids).toContain(spotId)
  })
})

// ---------------------------------------------------------------------------
// S18-4: no match returns empty
// ---------------------------------------------------------------------------
describe('S18-4: no match', () => {
  it('returns empty array when nothing matches', async () => {
    const { data, error } = await memberClient.rpc('search_spots', {
      p_query: `zzz-nomatch-${RUN}`,
    })
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})

// ---------------------------------------------------------------------------
// S18-5: out-of-network spots are excluded by RLS
// ---------------------------------------------------------------------------
describe('S18-5: RLS excludes out-of-network spots', () => {
  let spotId: string
  const uniqueTitle = UNIQ('Private Mesa')

  beforeAll(async () => {
    spotId = await seedSpot(memberId, [networkId], { title: uniqueTitle })
    createdSpotIds.push(spotId)
  })

  it('outsider searching for the exact title gets no rows', async () => {
    const { data, error } = await outsiderClient.rpc('search_spots', { p_query: uniqueTitle })
    expect(error).toBeNull()
    const ids = (data ?? []).map((r: { id: string }) => r.id)
    expect(ids).not.toContain(spotId)
  })
})

// ---------------------------------------------------------------------------
// S18-6: result capped at 10
// ---------------------------------------------------------------------------
describe('S18-6: result set capped at 10', () => {
  const marker = UNIQ('bulkmarker')

  beforeAll(async () => {
    for (let i = 0; i < 12; i++) {
      const id = await seedSpot(memberId, [networkId], { title: `${marker} #${i}` })
      createdSpotIds.push(id)
    }
  })

  it('returns at most 10 rows when more than 10 match', async () => {
    const { data, error } = await memberClient.rpc('search_spots', { p_query: marker })
    expect(error).toBeNull()
    expect(data!.length).toBeLessThanOrEqual(10)
    expect(data!.length).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// S18-7: anonymous callers see nothing (RLS filters spots to zero rows)
// ---------------------------------------------------------------------------
describe('S18-7: anon caller sees no results', () => {
  const uniqueTitle = UNIQ('Anon Test Spot')
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(memberId, [networkId], { title: uniqueTitle })
    createdSpotIds.push(spotId)
  })

  it('anon search returns empty even for a title that exists', async () => {
    const anon = anonClient()
    const { data, error } = await anon.rpc('search_spots', { p_query: uniqueTitle })
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
