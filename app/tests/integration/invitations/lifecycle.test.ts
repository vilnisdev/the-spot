/**
 * Invitation lifecycle — Cycles I1–I11
 *
 * Verifies RLS + schema + RPCs support the full invitation lifecycle:
 * generate, join (valid/idempotent), reject (expired/revoked/not-found),
 * revoke (owner only), and public token lookup.
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedMembership,
  seedInvitation,
  anonClient,
  admin,
} from '../helpers/seed'

// ---------------------------------------------------------------------------
// Shared test principals
// ---------------------------------------------------------------------------
let ownerId: string
let memberId: string
let outsiderId: string
let ownerClient: SupabaseClient
let memberClient: SupabaseClient
let outsiderClient: SupabaseClient
let networkId: string

beforeAll(async () => {
  const owner = await createUser('inv-lc-owner')
  const member = await createUser('inv-lc-member')
  const outsider = await createUser('inv-lc-outsider')

  ownerId = owner.id
  memberId = member.id
  outsiderId = outsider.id

  ownerClient = await signIn(owner.email, owner.password)
  memberClient = await signIn(member.email, member.password)
  outsiderClient = await signIn(outsider.email, outsider.password)

  networkId = await seedNetwork(ownerId, 'Invite Test Network')
  await seedMembership(memberId, networkId, 'member')
})

afterAll(async () => {
  await cleanupUsers([ownerId, memberId, outsiderId])
})

// ---------------------------------------------------------------------------
// Cycle I1: Member can create an invitation (RLS allows)
// ---------------------------------------------------------------------------
describe('I1: Member creates an invitation', () => {
  it('member can insert an invitation for their network', async () => {
    const { data, error } = await memberClient
      .from('invitations')
      .insert({ network_id: networkId, created_by: memberId })
      .select('id, token, expires_at, revoked_at')
      .single()

    expect(error).toBeNull()
    expect(data?.token).toBeTruthy()
    expect(data?.revoked_at).toBeNull()
    expect(new Date(data!.expires_at).getTime()).toBeGreaterThan(Date.now())

    await admin.from('invitations').delete().eq('id', data!.id)
  })
})

// ---------------------------------------------------------------------------
// Cycle I2: Non-member cannot create an invitation (RLS blocks)
// ---------------------------------------------------------------------------
describe('I2: Non-member cannot create an invitation', () => {
  it('outsider insert is blocked by RLS', async () => {
    const { error } = await outsiderClient
      .from('invitations')
      .insert({ network_id: networkId, created_by: outsiderId })
      .select('id')
      .single()

    expect(error).not.toBeNull()
  })
})

// ---------------------------------------------------------------------------
// Cycle I3–I6: lookup_invitation RPC returns correct status
// ---------------------------------------------------------------------------
describe('I3: lookup_invitation returns valid for a fresh token', () => {
  it('anon client can call lookup_invitation with valid token', async () => {
    const { token } = await seedInvitation(networkId, ownerId)
    const anon = anonClient()
    const { data, error } = await anon.rpc('lookup_invitation', { p_token: token })

    expect(error).toBeNull()
    const row = data?.[0]
    expect(row?.status).toBe('valid')
    expect(row?.network_name).toBe('Invite Test Network')
    expect(row?.network_id).toBe(networkId)

    await admin.from('invitations').delete().match({ network_id: networkId, token })
  })
})

describe('I4: lookup_invitation returns expired for past-expiry token', () => {
  it('returns expired status', async () => {
    const { token } = await seedInvitation(networkId, ownerId, {
      expires_at: new Date(Date.now() - 1000).toISOString(),
    })
    const anon = anonClient()
    const { data } = await anon.rpc('lookup_invitation', { p_token: token })

    expect(data?.[0]?.status).toBe('expired')

    await admin.from('invitations').delete().match({ network_id: networkId, token })
  })
})

describe('I5: lookup_invitation returns revoked for revoked token', () => {
  it('returns revoked status', async () => {
    const { id, token } = await seedInvitation(networkId, ownerId)
    await admin
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', id)

    const anon = anonClient()
    const { data } = await anon.rpc('lookup_invitation', { p_token: token })

    expect(data?.[0]?.status).toBe('revoked')

    await admin.from('invitations').delete().eq('id', id)
  })
})

describe('I6: lookup_invitation returns not_found for unknown token', () => {
  it('returns not_found for a nonexistent token', async () => {
    const anon = anonClient()
    const { data } = await anon.rpc('lookup_invitation', { p_token: 'doesnotexist0000' })

    expect(data?.[0]?.status).toBe('not_found')
  })
})

// ---------------------------------------------------------------------------
// Cycle I7: join_by_token inserts membership for a valid token
// ---------------------------------------------------------------------------
describe('I7: join_by_token succeeds for valid token', () => {
  let joiner: SupabaseClient
  let joinerId: string
  let token: string
  let invitationId: string

  beforeAll(async () => {
    const u = await createUser('inv-joiner')
    joinerId = u.id
    joiner = await signIn(u.email, u.password)
    const inv = await seedInvitation(networkId, ownerId)
    token = inv.token
    invitationId = inv.id
  })

  afterAll(async () => {
    await admin.from('memberships').delete().eq('user_id', joinerId).eq('network_id', networkId)
    await admin.from('invitations').delete().eq('id', invitationId)
    await cleanupUsers([joinerId])
  })

  it('returns network_id and inserts membership', async () => {
    const { data, error } = await joiner.rpc('join_by_token', { p_token: token })

    expect(error).toBeNull()
    expect(data).toBe(networkId)

    const { data: mem } = await admin
      .from('memberships')
      .select('role')
      .eq('user_id', joinerId)
      .eq('network_id', networkId)
      .single()

    expect(mem?.role).toBe('member')
  })
})

// ---------------------------------------------------------------------------
// Cycle I8: join_by_token is idempotent (already a member)
// ---------------------------------------------------------------------------
describe('I8: join_by_token is idempotent for existing member', () => {
  let token: string
  let invitationId: string

  beforeAll(async () => {
    const inv = await seedInvitation(networkId, ownerId)
    token = inv.token
    invitationId = inv.id
  })

  afterAll(async () => {
    await admin.from('invitations').delete().eq('id', invitationId)
  })

  it('does not error when already a member (ON CONFLICT DO NOTHING)', async () => {
    // ownerClient is already a member
    const { data, error } = await ownerClient.rpc('join_by_token', { p_token: token })

    expect(error).toBeNull()
    expect(data).toBe(networkId)
  })
})

// ---------------------------------------------------------------------------
// Cycle I9: join_by_token raises exception for expired token
// ---------------------------------------------------------------------------
describe('I9: join_by_token rejects expired token', () => {
  let token: string
  let invitationId: string

  beforeAll(async () => {
    const inv = await seedInvitation(networkId, ownerId, {
      expires_at: new Date(Date.now() - 1000).toISOString(),
    })
    token = inv.token
    invitationId = inv.id
  })

  afterAll(async () => {
    await admin.from('invitations').delete().eq('id', invitationId)
  })

  it('returns an error for expired token', async () => {
    const { error } = await memberClient.rpc('join_by_token', { p_token: token })
    expect(error).not.toBeNull()
    expect(error?.message).toMatch(/expired/i)
  })
})

// ---------------------------------------------------------------------------
// Cycle I10: join_by_token raises exception for revoked token
// ---------------------------------------------------------------------------
describe('I10: join_by_token rejects revoked token', () => {
  let token: string
  let invitationId: string

  beforeAll(async () => {
    const inv = await seedInvitation(networkId, ownerId)
    token = inv.token
    invitationId = inv.id
    await admin
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', invitationId)
  })

  afterAll(async () => {
    await admin.from('invitations').delete().eq('id', invitationId)
  })

  it('returns an error for revoked token', async () => {
    const { error } = await memberClient.rpc('join_by_token', { p_token: token })
    expect(error).not.toBeNull()
    expect(error?.message).toMatch(/revoked/i)
  })
})

// ---------------------------------------------------------------------------
// Cycle I11: Owner can revoke; member cannot (RLS blocks UPDATE)
// ---------------------------------------------------------------------------
describe('I11: Owner can revoke; member cannot', () => {
  let invId: string

  beforeAll(async () => {
    const inv = await seedInvitation(networkId, ownerId)
    invId = inv.id
  })

  afterAll(async () => {
    await admin.from('invitations').delete().eq('id', invId)
  })

  it('member cannot revoke an invitation (RLS blocks)', async () => {
    const { data, error } = await memberClient
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', invId)
      .select('revoked_at')

    expect(error).toBeNull()
    // RLS silently returns 0 rows
    expect(data).toHaveLength(0)

    const { data: inv } = await admin
      .from('invitations')
      .select('revoked_at')
      .eq('id', invId)
      .single()
    expect(inv?.revoked_at).toBeNull()
  })

  it('owner can revoke an invitation', async () => {
    const { data, error } = await ownerClient
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', invId)
      .select('revoked_at')
      .single()

    expect(error).toBeNull()
    expect(data?.revoked_at).not.toBeNull()
  })
})
