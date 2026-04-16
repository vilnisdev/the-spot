/**
 * Profile page / My Spots — Issue #14
 *
 * Verifies the DB-level behaviour that powers the /profile page:
 * PR14-1  Author's spot list includes correct network names
 * PR14-2  update_spot RPC edits title, description, date, networks, and tags
 * PR14-3  Author can delete own spot (cascade already verified in cascade.test.ts)
 * PR14-4  Non-author cannot update or delete another user's spot
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedMembership,
  seedSpot,
  admin,
} from '../helpers/seed'

let authorId: string
let otherUserId: string
let authorClient: SupabaseClient
let otherClient: SupabaseClient
let networkId: string
let secondNetworkId: string

beforeAll(async () => {
  const author = await createUser('pr14-author')
  const other = await createUser('pr14-other')

  authorId = author.id
  otherUserId = other.id

  authorClient = await signIn(author.email, author.password)
  otherClient = await signIn(other.email, other.password)

  networkId = await seedNetwork(authorId, 'PR14 Network A')
  secondNetworkId = await seedNetwork(authorId, 'PR14 Network B')

  // Give other user membership in networkId so visibility is non-trivial
  await seedMembership(otherUserId, networkId)
})

afterAll(async () => {
  await cleanupUsers([authorId, otherUserId])
})

// ---------------------------------------------------------------------------
// PR14-1: Author's spot list shows correct network names
// ---------------------------------------------------------------------------
describe('PR14-1: Author spot list — network names populated', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(authorId, [networkId, secondNetworkId], { title: 'PR14 Multi-net Spot' })
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('query returns spot with both network names', async () => {
    const { data, error } = await authorClient
      .from('spots')
      .select('id, title, spot_networks(network_id, networks(name))')
      .eq('id', spotId)
      .single()

    expect(error).toBeNull()
    expect(data).not.toBeNull()

    const networkNames = (
      data!.spot_networks as unknown as { networks: { name: string } | null }[]
    )
      .map((sn) => sn.networks?.name)
      .filter((n): n is string => !!n)
      .sort()

    expect(networkNames).toEqual(['PR14 Network A', 'PR14 Network B'])
  })

  it('author_id filter returns only own spots', async () => {
    // Seed a second spot by the other user in networkId
    const otherId = await seedSpot(otherUserId, [networkId], { title: 'Other User Spot' })

    try {
      const { data } = await authorClient
        .from('spots')
        .select('id, title')
        .eq('author_id', authorId)

      const titles = (data ?? []).map((s) => s.title)
      expect(titles).toContain('PR14 Multi-net Spot')
      // Author's query must not return other user's spot
      expect(titles).not.toContain('Other User Spot')
    } finally {
      await admin.from('spots').delete().eq('id', otherId)
    }
  })
})

// ---------------------------------------------------------------------------
// PR14-2: update_spot RPC updates fields and re-syncs networks + tags
// ---------------------------------------------------------------------------
describe('PR14-2: update_spot RPC — edit from list', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(authorId, [networkId], {
      title: 'Original Title',
      description: 'old desc #oldtag',
      date: '2026-01-01',
    })
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('title, description, and date are updated', async () => {
    const { error } = await authorClient.rpc('update_spot', {
      p_spot_id: spotId,
      p_title: 'Edited Title',
      p_description: 'new desc',
      p_date: '2026-03-15',
      p_network_ids: [networkId],
      p_tag_names: [],
    })
    expect(error).toBeNull()

    const { data: row } = await admin
      .from('spots')
      .select('title, description, date')
      .eq('id', spotId)
      .single()

    expect(row!.title).toBe('Edited Title')
    expect(row!.description).toBe('new desc')
    expect(row!.date).toBe('2026-03-15')
  })

  it('networks are re-synced to the new set', async () => {
    // Switch from networkId to secondNetworkId
    const { error } = await authorClient.rpc('update_spot', {
      p_spot_id: spotId,
      p_title: 'Edited Title',
      p_description: null,
      p_date: '2026-03-15',
      p_network_ids: [secondNetworkId],
      p_tag_names: [],
    })
    expect(error).toBeNull()

    const { data: nets } = await admin
      .from('spot_networks')
      .select('network_id')
      .eq('spot_id', spotId)

    expect(nets).toHaveLength(1)
    expect(nets![0].network_id).toBe(secondNetworkId)
  })

  it('tags are re-synced', async () => {
    const { error } = await authorClient.rpc('update_spot', {
      p_spot_id: spotId,
      p_title: 'Edited Title',
      p_description: null,
      p_date: '2026-03-15',
      p_network_ids: [secondNetworkId],
      p_tag_names: ['newtag', 'another'],
    })
    expect(error).toBeNull()

    const { data: tagRows } = await admin
      .from('spot_tags')
      .select('tags(name)')
      .eq('spot_id', spotId)

    const names = (tagRows ?? [])
      .map((r) => (r.tags as unknown as { name: string }).name)
      .sort()

    expect(names).toEqual(['another', 'newtag'])
  })
})

// ---------------------------------------------------------------------------
// PR14-3: Author deletes own spot via RLS-enforced DELETE
// ---------------------------------------------------------------------------
describe('PR14-3: Author can delete own spot from profile list', () => {
  it('author DELETE succeeds; spot row is gone', async () => {
    const spotId = await seedSpot(authorId, [networkId], { title: 'To Be Deleted' })

    const { error } = await authorClient.from('spots').delete().eq('id', spotId)
    expect(error).toBeNull()

    const { data } = await admin.from('spots').select('id').eq('id', spotId).maybeSingle()
    expect(data).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// PR14-4: Non-author cannot update or delete another user's spot
// ---------------------------------------------------------------------------
describe('PR14-4: Non-author cannot edit or delete another user\'s spot', () => {
  let spotId: string

  beforeAll(async () => {
    spotId = await seedSpot(authorId, [networkId], { title: 'Protected Spot' })
  })

  afterAll(async () => {
    if (spotId) await admin.from('spots').delete().eq('id', spotId)
  })

  it('update_spot RPC raises Not authorized for non-author', async () => {
    const { error } = await otherClient.rpc('update_spot', {
      p_spot_id: spotId,
      p_title: 'Hijacked',
      p_description: null,
      p_date: '2026-01-01',
      p_network_ids: [networkId],
      p_tag_names: [],
    })
    expect(error).not.toBeNull()
  })

  it('non-author DELETE is blocked by RLS', async () => {
    const { error } = await otherClient.from('spots').delete().eq('id', spotId)
    // RLS blocks the delete but returns no error (just deletes 0 rows)
    expect(error).toBeNull()

    // Spot still exists
    const { data } = await admin.from('spots').select('id').eq('id', spotId).single()
    expect(data).not.toBeNull()
  })
})
