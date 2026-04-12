/**
 * Cycle 10: Invitation schema
 *
 * - Table exists with required columns
 * - Valid invitation: not expired, not revoked
 * - Expired invitation filtered out
 * - Revoked invitation filtered out
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createUser, cleanupUsers, seedNetwork, admin } from '../helpers/seed'

describe('Invitation schema', () => {
  let ownerId: string
  let networkId: string

  beforeAll(async () => {
    const owner = await createUser('inv-owner')
    ownerId = owner.id
    networkId = await seedNetwork(ownerId, 'Invitation Test Network')
  })

  afterAll(async () => {
    await cleanupUsers([ownerId])
  })

  it('Cycle 10a: Can insert an invitation with required fields', async () => {
    const { data, error } = await admin
      .from('invitations')
      .insert({ network_id: networkId, created_by: ownerId })
      .select('id, token, expires_at, revoked_at')
      .single()

    expect(error).toBeNull()
    expect(data?.token).toBeTruthy()
    expect(data?.revoked_at).toBeNull()
    expect(new Date(data!.expires_at).getTime()).toBeGreaterThan(Date.now())

    await admin.from('invitations').delete().eq('id', data!.id)
  })

  it('Cycle 10b: Query for valid invitations excludes expired ones', async () => {
    // Insert an expired invitation directly
    const { data: expired } = await admin
      .from('invitations')
      .insert({
        network_id: networkId,
        created_by: ownerId,
        expires_at: new Date(Date.now() - 1000).toISOString(), // 1 second in the past
      })
      .select('id')
      .single()

    const { data: valid } = await admin
      .from('invitations')
      .select('id')
      .eq('network_id', networkId)
      .gt('expires_at', new Date().toISOString())
      .is('revoked_at', null)

    const ids = valid?.map((r) => r.id) ?? []
    expect(ids).not.toContain(expired!.id)

    await admin.from('invitations').delete().eq('id', expired!.id)
  })

  it('Cycle 10c: Query for valid invitations excludes revoked ones', async () => {
    const { data: inv } = await admin
      .from('invitations')
      .insert({ network_id: networkId, created_by: ownerId })
      .select('id')
      .single()

    // Revoke it
    await admin
      .from('invitations')
      .update({ revoked_at: new Date().toISOString() })
      .eq('id', inv!.id)

    const { data: valid } = await admin
      .from('invitations')
      .select('id')
      .eq('network_id', networkId)
      .gt('expires_at', new Date().toISOString())
      .is('revoked_at', null)

    const ids = valid?.map((r) => r.id) ?? []
    expect(ids).not.toContain(inv!.id)

    await admin.from('invitations').delete().eq('id', inv!.id)
  })
})
