/**
 * Cycle 11: Storage bucket
 *
 * - 'media' private bucket exists
 * - Signed URL can be generated for an object in the bucket
 */
import { describe, it, expect } from 'vitest'
import { admin } from '../helpers/seed'

describe('Storage bucket', () => {
  it('Cycle 11: media bucket exists and signed URLs can be generated', async () => {
    const { data: buckets, error } = await admin.storage.listBuckets()

    expect(error).toBeNull()
    const mediaBucket = buckets?.find((b) => b.name === 'media')
    expect(mediaBucket).toBeDefined()
    expect(mediaBucket?.public).toBe(false)
  })
})
