/**
 * Cycles 1–2: Spot visibility via RLS
 *
 * Cycle 1: Member can SELECT a Spot in their Network
 * Cycle 2: Outsider (no membership) cannot SELECT that Spot
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

describe('Spot visibility (RLS)', () => {
  let memberUserId: string
  let outsiderUserId: string
  let networkId: string
  let spotId: string

  let memberEmail: string
  let memberPassword: string
  let outsiderEmail: string
  let outsiderPassword: string

  beforeAll(async () => {
    const member = await createUser('member')
    const outsider = await createUser('outsider')

    memberUserId = member.id
    memberEmail = member.email
    memberPassword = member.password

    outsiderUserId = outsider.id
    outsiderEmail = outsider.email
    outsiderPassword = outsider.password

    networkId = await seedNetwork(memberUserId, 'Visibility Test Network')
    spotId = await seedSpot(memberUserId, [networkId], { title: 'Hidden Waterfall' })
  })

  afterAll(async () => {
    await cleanupUsers([memberUserId, outsiderUserId])
  })

  it('Cycle 1: Member can SELECT a Spot in their Network', async () => {
    const client = await signIn(memberEmail, memberPassword)
    const { data, error } = await client.from('spots').select('id, title').eq('id', spotId)

    expect(error).toBeNull()
    expect(data).toHaveLength(1)
    expect(data![0].title).toBe('Hidden Waterfall')
  })

  it('Cycle 2: Outsider with no membership cannot SELECT that Spot', async () => {
    const client = await signIn(outsiderEmail, outsiderPassword)
    const { data, error } = await client.from('spots').select('id, title').eq('id', spotId)

    expect(error).toBeNull() // RLS returns empty, not an error
    expect(data).toHaveLength(0)
  })
})
