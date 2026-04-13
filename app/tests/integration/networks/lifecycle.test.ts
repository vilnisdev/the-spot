/**
 * Networks lifecycle — Cycles N1–N8
 *
 * Verifies RLS + schema support the full Network lifecycle:
 * create, rename, delete, member management, multi-network membership,
 * and spot survival across network deletes.
 *
 * Design: one module-level beforeAll creates 3 shared clients (owner,
 * member, outsider) to minimise signInWithPassword calls and avoid rate limits.
 * Each describe creates its own network via admin (bypasses RLS) so cycles
 * stay independent.
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

// ---------------------------------------------------------------------------
// Shared test principals — created once for all cycles
// ---------------------------------------------------------------------------
let ownerId: string
let memberId: string
let outsiderId: string
let ownerClient: SupabaseClient
let memberClient: SupabaseClient
let outsiderClient: SupabaseClient

beforeAll(async () => {
  const owner = await createUser('nlc-owner')
  const member = await createUser('nlc-member')
  const outsider = await createUser('nlc-outsider')

  ownerId = owner.id
  memberId = member.id
  outsiderId = outsider.id

  // 3 signIn calls total for the entire suite
  ownerClient = await signIn(owner.email, owner.password)
  memberClient = await signIn(member.email, member.password)
  outsiderClient = await signIn(outsider.email, outsider.password)
})

afterAll(async () => {
  await cleanupUsers([ownerId, memberId, outsiderId])
})

// ---------------------------------------------------------------------------
// Cycle N1: Owner creates a Network
//
// RLS note: networks_select uses is_network_member(id), so after INSERT the
// owner cannot SELECT the row yet (no membership). Do NOT chain .select() —
// get the ID via admin, insert membership, then verify SELECT works.
// ---------------------------------------------------------------------------
describe('N1: Owner creates a Network', () => {
  it('RLS allows INSERT with owner_id = auth.uid(); SELECT works after membership added', async () => {
    // INSERT without .select() — user can't see their own network yet (no membership)
    const { error: netErr } = await ownerClient
      .from('networks')
      .insert({ name: 'N1 Network', owner_id: ownerId })

    expect(netErr).toBeNull()

    // Retrieve ID via admin
    const { data: net } = await admin
      .from('networks')
      .select('id, name, owner_id')
      .eq('owner_id', ownerId)
      .eq('name', 'N1 Network')
      .single()

    expect(net).not.toBeNull()
    expect(net!.owner_id).toBe(ownerId)

    // Insert owner membership
    const { error: memErr } = await ownerClient
      .from('memberships')
      .insert({ user_id: ownerId, network_id: net!.id, role: 'owner' })

    expect(memErr).toBeNull()

    // Owner can now SELECT own network (has membership)
    const { data: visible } = await ownerClient
      .from('networks')
      .select('id, name')
      .eq('id', net!.id)
      .single()

    expect(visible!.name).toBe('N1 Network')

    // Cleanup
    await admin.from('networks').delete().eq('id', net!.id)
  })
})

// ---------------------------------------------------------------------------
// Cycle N2: Owner renames; non-owner is blocked
// ---------------------------------------------------------------------------
describe('N2: Owner renames a Network', () => {
  let networkId: string

  beforeAll(async () => {
    networkId = await seedNetwork(ownerId, 'N2 Original')
    await seedMembership(memberId, networkId, 'member')
  })

  afterAll(async () => {
    await admin.from('networks').delete().eq('id', networkId)
  })

  it('owner can rename the network', async () => {
    const { data, error } = await ownerClient
      .from('networks')
      .update({ name: 'N2 Renamed' })
      .eq('id', networkId)
      .select('name')
      .single()

    expect(error).toBeNull()
    expect(data!.name).toBe('N2 Renamed')
  })

  it('non-owner cannot rename (RLS blocks update)', async () => {
    const { data, error } = await memberClient
      .from('networks')
      .update({ name: 'N2 Hacked' })
      .eq('id', networkId)
      .select('name')

    expect(error).toBeNull()
    expect(data).toHaveLength(0)

    const { data: net } = await admin
      .from('networks')
      .select('name')
      .eq('id', networkId)
      .single()
    expect(net!.name).toBe('N2 Renamed')
  })
})

// ---------------------------------------------------------------------------
// Cycle N3: Owner deletes; memberships cascade
// ---------------------------------------------------------------------------
describe('N3: Owner deletes a Network', () => {
  let networkId: string

  beforeAll(async () => {
    networkId = await seedNetwork(ownerId, 'N3 Delete Me')
    await seedMembership(memberId, networkId, 'member')
  })

  // No afterAll — network is deleted in the test

  it('owner can delete; memberships cascade', async () => {
    const { error } = await ownerClient.from('networks').delete().eq('id', networkId)
    expect(error).toBeNull()

    const { data: nets } = await admin.from('networks').select('id').eq('id', networkId)
    expect(nets).toHaveLength(0)

    const { data: mems } = await admin
      .from('memberships')
      .select('user_id')
      .eq('network_id', networkId)
    expect(mems).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Cycle N4: Owner removes a member; non-owner cannot remove others
// ---------------------------------------------------------------------------
describe('N4: Owner removes a member', () => {
  let networkId: string

  beforeAll(async () => {
    networkId = await seedNetwork(ownerId, 'N4 Manage')
    await seedMembership(memberId, networkId, 'member')
    await seedMembership(outsiderId, networkId, 'member') // outsider plays memberB role here
  })

  afterAll(async () => {
    await admin.from('networks').delete().eq('id', networkId)
  })

  it('non-owner cannot remove another member (RLS blocks)', async () => {
    const { error } = await memberClient
      .from('memberships')
      .delete()
      .eq('user_id', outsiderId)
      .eq('network_id', networkId)

    expect(error).toBeNull()

    // outsider still in network
    const { data: mems } = await admin
      .from('memberships')
      .select('user_id')
      .eq('user_id', outsiderId)
      .eq('network_id', networkId)
    expect(mems).toHaveLength(1)
  })

  it('owner can remove a member', async () => {
    const { error } = await ownerClient
      .from('memberships')
      .delete()
      .eq('user_id', outsiderId)
      .eq('network_id', networkId)

    expect(error).toBeNull()

    const { data: mems } = await admin
      .from('memberships')
      .select('user_id')
      .eq('user_id', outsiderId)
      .eq('network_id', networkId)
    expect(mems).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Cycle N5: Member leaves a Network
// ---------------------------------------------------------------------------
describe('N5: Member leaves a Network', () => {
  let networkId: string

  beforeAll(async () => {
    networkId = await seedNetwork(ownerId, 'N5 Leave')
    await seedMembership(memberId, networkId, 'member')
  })

  afterAll(async () => {
    await admin.from('networks').delete().eq('id', networkId)
  })

  it('member can delete own membership (leave)', async () => {
    const { error } = await memberClient
      .from('memberships')
      .delete()
      .eq('user_id', memberId)
      .eq('network_id', networkId)

    expect(error).toBeNull()

    const { data: mems } = await admin
      .from('memberships')
      .select('user_id')
      .eq('user_id', memberId)
      .eq('network_id', networkId)
    expect(mems).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Cycle N6: Member list shows usernames and roles
// ---------------------------------------------------------------------------
describe('N6: Member list shows usernames and roles', () => {
  let networkId: string

  beforeAll(async () => {
    networkId = await seedNetwork(ownerId, 'N6 Members')
    await seedMembership(memberId, networkId, 'member')
    // outsider NOT added — used to test visibility block
  })

  afterAll(async () => {
    await admin.from('networks').delete().eq('id', networkId)
  })

  it('member sees all members with usernames and roles', async () => {
    const { data, error } = await memberClient
      .from('memberships')
      .select('role, user_id, profiles(username)')
      .eq('network_id', networkId)
      .order('role')

    expect(error).toBeNull()
    expect(data).not.toBeNull()
    expect(data!.length).toBe(2)

    const roles = data!.map((m) => m.role).sort()
    expect(roles).toContain('owner')
    expect(roles).toContain('member')

    for (const row of data!) {
      // PostgREST returns a single object for many-to-one FK joins at runtime.
      // TypeScript infers array without generated types — cast via unknown.
      const profile = row.profiles as unknown as { username: string } | null
      expect(profile?.username).toBeTruthy()
    }
  })

  it('outsider cannot see the member list (RLS blocks)', async () => {
    const { data, error } = await outsiderClient
      .from('memberships')
      .select('role, profiles(username)')
      .eq('network_id', networkId)

    expect(error).toBeNull()
    expect(data).toHaveLength(0)
  })
})

// ---------------------------------------------------------------------------
// Cycle N7: User belongs to multiple Networks simultaneously
// ---------------------------------------------------------------------------
describe('N7: User belongs to multiple Networks simultaneously', () => {
  let networkAId: string
  let networkBId: string

  beforeAll(async () => {
    networkAId = await seedNetwork(ownerId, 'N7 Alpha')
    networkBId = await seedNetwork(ownerId, 'N7 Beta')
    await seedMembership(memberId, networkAId, 'member')
    await seedMembership(memberId, networkBId, 'member')
  })

  afterAll(async () => {
    await admin.from('networks').delete().eq('id', networkAId)
    await admin.from('networks').delete().eq('id', networkBId)
  })

  it('user sees both networks in membership list', async () => {
    const { data, error } = await memberClient
      .from('memberships')
      .select('network_id')
      .eq('user_id', memberId)
      .in('network_id', [networkAId, networkBId])

    expect(error).toBeNull()
    const ids = data!.map((m) => m.network_id)
    expect(ids).toContain(networkAId)
    expect(ids).toContain(networkBId)
  })
})

// ---------------------------------------------------------------------------
// Cycle N8: Delete Network removes memberships; shared Spot survives
// ---------------------------------------------------------------------------
describe('N8: Delete Network cleans up memberships; shared Spots survive', () => {
  let networkToDeleteId: string
  let networkKeepId: string
  let spotId: string

  beforeAll(async () => {
    networkToDeleteId = await seedNetwork(ownerId, 'N8 Delete Me')
    networkKeepId = await seedNetwork(ownerId, 'N8 Keep Me')

    await seedMembership(memberId, networkToDeleteId, 'member')
    await seedMembership(memberId, networkKeepId, 'member')

    spotId = await seedSpot(ownerId, [networkToDeleteId, networkKeepId], { title: 'N8 Survivor' })
  })

  afterAll(async () => {
    await admin.from('networks').delete().eq('id', networkKeepId)
  })

  it('deleting a Network removes its memberships', async () => {
    await admin.from('networks').delete().eq('id', networkToDeleteId)

    const { data: mems } = await admin
      .from('memberships')
      .select('user_id')
      .eq('network_id', networkToDeleteId)
    expect(mems).toHaveLength(0)
  })

  it('Spot shared with remaining Network still visible to its member', async () => {
    const { data } = await memberClient.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(1)
  })
})
