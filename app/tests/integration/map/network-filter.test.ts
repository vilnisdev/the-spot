/**
 * Map data queries — spot visibility and network filtering
 *
 * Cycle 1: Spots query with spot_networks join returns correct network_id associations
 * Cycle 2: Member with two networks sees spots from both in unfiltered query
 * Cycle 3: Filtering by network_id returns only that network's spots; other network's spots absent
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedMembership,
  seedSpot,
} from '../helpers/seed'

describe('Map network filter (data layer)', () => {
  let userId: string
  let email: string
  let password: string
  let networkAId: string
  let networkBId: string
  let spotAId: string
  let spotBId: string

  beforeAll(async () => {
    const user = await createUser('mapuser')
    userId = user.id
    email = user.email
    password = user.password

    networkAId = await seedNetwork(userId, 'Network A')
    networkBId = await seedNetwork(userId, 'Network B')
    // Also add user as member of network B (they own both via seedNetwork, but membership is already set)

    spotAId = await seedSpot(userId, [networkAId], { title: 'Spot in A', lat: 51.5, lng: -0.1 })
    spotBId = await seedSpot(userId, [networkBId], { title: 'Spot in B', lat: 48.8, lng: 2.3 })
  })

  afterAll(async () => {
    await cleanupUsers([userId])
  })

  it('Cycle 1: Spots query with spot_networks join returns network_id for each spot', async () => {
    const client = await signIn(email, password)
    const { data, error } = await client
      .from('spots')
      .select('id, title, lat, lng, spot_networks(network_id)')
      .eq('id', spotAId)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].spot_networks).toHaveLength(1)
    expect(data![0].spot_networks[0].network_id).toBe(networkAId)
  })

  it('Cycle 2: Unfiltered query returns spots from all user networks', async () => {
    const client = await signIn(email, password)
    const { data, error } = await client
      .from('spots')
      .select('id, title, spot_networks(network_id)')
      .in('id', [spotAId, spotBId])

    expect(error).toBeNull()
    expect(data).toHaveLength(2)
    const ids = data!.map((s) => s.id)
    expect(ids).toContain(spotAId)
    expect(ids).toContain(spotBId)
  })

  it('Cycle 3: Filtering spots by network_id returns only that network\'s spots', async () => {
    const client = await signIn(email, password)

    // Fetch all visible spots
    const { data: allSpots, error } = await client
      .from('spots')
      .select('id, title, spot_networks(network_id)')
      .in('id', [spotAId, spotBId])

    expect(error).toBeNull()

    // Simulate client-side network filter (as MapPage does it)
    const filtered = allSpots!.filter((spot) =>
      spot.spot_networks.some(
        (sn: { network_id: string }) => sn.network_id === networkAId
      )
    )

    expect(filtered).toHaveLength(1)
    expect(filtered[0].id).toBe(spotAId)
    expect(filtered.find((s) => s.id === spotBId)).toBeUndefined()
  })
})
