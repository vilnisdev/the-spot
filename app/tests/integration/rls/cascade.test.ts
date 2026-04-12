/**
 * Cycle 7: Cascade delete — comments, tags, and media deleted with Spot
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedSpot,
  admin,
} from '../helpers/seed'

describe('Cascade delete on Spot (FK constraints)', () => {
  let authorId: string
  let authorEmail: string
  let authorPassword: string
  let networkId: string

  beforeAll(async () => {
    const author = await createUser('cascade-author')
    authorId = author.id
    authorEmail = author.email
    authorPassword = author.password
    networkId = await seedNetwork(authorId, 'Cascade Test Network')
  })

  afterAll(async () => {
    await cleanupUsers([authorId])
  })

  it('Cycle 7: Deleting a Spot cascades to spot_tags, comments, and media', async () => {
    const spotId = await seedSpot(authorId, [networkId])

    // Seed a tag + spot_tag
    const { data: tagData } = await admin
      .from('tags')
      .insert({ name: `cascade-tag-${Date.now()}` })
      .select('id')
      .single()
    await admin.from('spot_tags').insert({ spot_id: spotId, tag_id: tagData!.id })

    // Seed a comment
    await admin.from('comments').insert({ spot_id: spotId, author_id: authorId, body: 'Nice spot' })

    // Seed media
    await admin.from('media').insert({ spot_id: spotId, url: 'https://example.com/photo.jpg', type: 'image' })

    // Author deletes the spot
    const client = await signIn(authorEmail, authorPassword)
    const { error } = await client.from('spots').delete().eq('id', spotId)
    expect(error).toBeNull()

    // Verify cascades
    const { data: spotTags } = await admin.from('spot_tags').select().eq('spot_id', spotId)
    const { data: comments } = await admin.from('comments').select().eq('spot_id', spotId)
    const { data: media } = await admin.from('media').select().eq('spot_id', spotId)

    expect(spotTags).toHaveLength(0)
    expect(comments).toHaveLength(0)
    expect(media).toHaveLength(0)
  })
})
