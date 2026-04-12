/**
 * Cycle 8: Member leaves Network
 *
 * - Spots by other members remain visible to remaining members
 * - Ex-member loses SELECT access
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedMembership,
  seedSpot,
  admin,
} from '../helpers/seed'

describe('Member leave (RLS + data lifecycle)', () => {
  let ownerId: string
  let memberId: string
  let networkId: string
  let spotId: string

  let ownerEmail: string
  let ownerPassword: string
  let memberEmail: string
  let memberPassword: string

  beforeAll(async () => {
    const owner = await createUser('leave-owner')
    const member = await createUser('leave-member')

    ownerId = owner.id
    ownerEmail = owner.email
    ownerPassword = owner.password

    memberId = member.id
    memberEmail = member.email
    memberPassword = member.password

    networkId = await seedNetwork(ownerId, 'Leave Test Network')
    await seedMembership(memberId, networkId)
    spotId = await seedSpot(ownerId, [networkId], { title: 'Owner Spot' })
  })

  afterAll(async () => {
    await cleanupUsers([ownerId, memberId])
  })

  it('Cycle 8a: Member can SELECT Spot before leaving', async () => {
    const client = await signIn(memberEmail, memberPassword)
    const { data } = await client.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(1)
  })

  it('Cycle 8b: Owner Spot remains after Member leaves', async () => {
    // Member leaves (deletes own membership)
    const client = await signIn(memberEmail, memberPassword)
    await client
      .from('memberships')
      .delete()
      .eq('user_id', memberId)
      .eq('network_id', networkId)

    // Verify spot still exists via admin
    const { data } = await admin.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(1)
  })

  it('Cycle 8c: Ex-member loses SELECT access after leaving', async () => {
    const client = await signIn(memberEmail, memberPassword)
    const { data } = await client.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(0)
  })
})
