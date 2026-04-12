/**
 * Cycles 3–6: Author-only UPDATE and DELETE
 *
 * Cycle 3: Author can UPDATE own Spot
 * Cycle 4: Non-author Member cannot UPDATE
 * Cycle 5: Author can DELETE own Spot
 * Cycle 6: Non-author Member cannot DELETE
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

describe('Author-only write (RLS)', () => {
  let authorId: string
  let nonAuthorId: string
  let networkId: string

  let authorEmail: string
  let authorPassword: string
  let nonAuthorEmail: string
  let nonAuthorPassword: string

  beforeAll(async () => {
    const author = await createUser('author')
    const nonAuthor = await createUser('nonAuthor')

    authorId = author.id
    authorEmail = author.email
    authorPassword = author.password

    nonAuthorId = nonAuthor.id
    nonAuthorEmail = nonAuthor.email
    nonAuthorPassword = nonAuthor.password

    networkId = await seedNetwork(authorId, 'Write Test Network')
    await seedMembership(nonAuthorId, networkId)
  })

  afterAll(async () => {
    await cleanupUsers([authorId, nonAuthorId])
  })

  it('Cycle 3: Author can UPDATE own Spot title', async () => {
    const spotId = await seedSpot(authorId, [networkId], { title: 'Original Title' })
    const client = await signIn(authorEmail, authorPassword)

    const { error } = await client
      .from('spots')
      .update({ title: 'Updated Title' })
      .eq('id', spotId)

    expect(error).toBeNull()

    // Verify via admin
    const { data } = await admin.from('spots').select('title').eq('id', spotId).single()
    expect(data?.title).toBe('Updated Title')

    // cleanup
    await admin.from('spots').delete().eq('id', spotId)
  })

  it('Cycle 4: Non-author Member cannot UPDATE the Spot', async () => {
    const spotId = await seedSpot(authorId, [networkId], { title: 'Protected Title' })
    const client = await signIn(nonAuthorEmail, nonAuthorPassword)

    const { error } = await client
      .from('spots')
      .update({ title: 'Hijacked Title' })
      .eq('id', spotId)

    // RLS blocks the update; no error thrown but no rows affected
    const { data } = await admin.from('spots').select('title').eq('id', spotId).single()
    expect(data?.title).toBe('Protected Title')

    await admin.from('spots').delete().eq('id', spotId)
  })

  it('Cycle 5: Author can DELETE own Spot', async () => {
    const spotId = await seedSpot(authorId, [networkId], { title: 'To Be Deleted' })
    const client = await signIn(authorEmail, authorPassword)

    const { error } = await client.from('spots').delete().eq('id', spotId)
    expect(error).toBeNull()

    const { data } = await admin.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(0)
  })

  it('Cycle 6: Non-author Member cannot DELETE the Spot', async () => {
    const spotId = await seedSpot(authorId, [networkId], { title: 'Not Yours To Delete' })
    const client = await signIn(nonAuthorEmail, nonAuthorPassword)

    await client.from('spots').delete().eq('id', spotId)

    // Spot must still exist
    const { data } = await admin.from('spots').select('id').eq('id', spotId)
    expect(data).toHaveLength(1)

    await admin.from('spots').delete().eq('id', spotId)
  })
})
