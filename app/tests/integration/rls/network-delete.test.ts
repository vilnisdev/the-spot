/**
 * Cycle 9: Network delete
 *
 * - Spot shared with two Networks: deleting one Network removes
 *   that spot_networks row but the Spot survives
 * - Member of remaining Network still sees the Spot
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

describe('Network delete (data lifecycle)', () => {
  let ownerId: string
  let observerId: string
  let networkAId: string
  let networkBId: string
  let spotId: string

  let observerEmail: string
  let observerPassword: string

  beforeAll(async () => {
    const owner = await createUser('netdel-owner')
    const observer = await createUser('netdel-observer')

    ownerId = owner.id
    observerEmail = observer.email
    observerPassword = observer.password
    observerId = observer.id

    networkAId = await seedNetwork(ownerId, 'Network A')
    networkBId = await seedNetwork(ownerId, 'Network B')

    // Observer is member of Network B only
    await seedMembership(observerId, networkBId)

    // Spot belongs to both networks
    spotId = await seedSpot(ownerId, [networkAId, networkBId], { title: 'Shared Spot' })
  })

  afterAll(async () => {
    await cleanupUsers([ownerId, observerId])
  })

  it('Cycle 9a: Observer (Network B member) can see Spot before Network A is deleted', async () => {
    const client = await signIn(observerEmail, observerPassword)
    const { data } = await client.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(1)
  })

  it('Cycle 9b: Deleting Network A removes that spot_networks row but Spot survives', async () => {
    // Owner deletes Network A (admin bypass — owner RLS tested elsewhere)
    await admin.from('networks').delete().eq('id', networkAId)

    // spot_networks row for Network A should be gone (CASCADE)
    const { data: snRows } = await admin
      .from('spot_networks')
      .select()
      .eq('spot_id', spotId)
      .eq('network_id', networkAId)
    expect(snRows).toHaveLength(0)

    // Spot itself still exists
    const { data: spots } = await admin.from('spots').select('id').eq('id', spotId)
    expect(spots).toHaveLength(1)
  })

  it('Cycle 9c: Observer (Network B member) still sees Spot after Network A deleted', async () => {
    const client = await signIn(observerEmail, observerPassword)
    const { data } = await client.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(1)
  })
})
