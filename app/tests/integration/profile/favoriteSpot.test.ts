/**
 * Favorite Spot — Issue #53
 *
 * DB-level behaviour for per-user favorite_spot_id:
 * S53-1  User can set their own favorite_spot_id
 * S53-2  Overwriting replaces previous value
 * S53-3  User can clear favorite_spot_id by setting null
 * S53-4  Non-owner cannot update another user's favorite_spot_id (RLS)
 * S53-5  Deleting the favorited Spot NULLs the FK (ON DELETE SET NULL)
 * S53-6  Default value for new users is null
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import {
  createUser,
  signIn,
  cleanupUsers,
  seedNetwork,
  seedSpot,
  admin,
} from '../helpers/seed'

let userId: string
let otherUserId: string
let networkId: string
let spotA: string
let spotB: string
let userClient: SupabaseClient
let otherClient: SupabaseClient

beforeAll(async () => {
  const user = await createUser('s53-user')
  const other = await createUser('s53-other')

  userId = user.id
  otherUserId = other.id

  networkId = await seedNetwork(userId, 'S53 Net')
  spotA = await seedSpot(userId, [networkId], { title: 'A' })
  spotB = await seedSpot(userId, [networkId], { title: 'B' })

  userClient = await signIn(user.email, user.password)
  otherClient = await signIn(other.email, other.password)
})

afterAll(async () => {
  await cleanupUsers([userId, otherUserId])
})

// ---------------------------------------------------------------------------
// S53-1: User can set their own favorite_spot_id
// ---------------------------------------------------------------------------
describe('S53-1: user sets own favorite_spot_id', () => {
  it('UPDATE succeeds and row reflects new value', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ favorite_spot_id: spotA })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', userId)
      .single()

    expect(data!.favorite_spot_id).toBe(spotA)
  })
})

// ---------------------------------------------------------------------------
// S53-2: Overwriting replaces previous value
// ---------------------------------------------------------------------------
describe('S53-2: overwrite replaces previous favorite', () => {
  it('second UPDATE wins', async () => {
    await userClient.from('profiles').update({ favorite_spot_id: spotA }).eq('id', userId)
    const { error } = await userClient
      .from('profiles')
      .update({ favorite_spot_id: spotB })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', userId)
      .single()

    expect(data!.favorite_spot_id).toBe(spotB)
  })
})

// ---------------------------------------------------------------------------
// S53-3: User can clear favorite by setting null
// ---------------------------------------------------------------------------
describe('S53-3: user clears favorite', () => {
  it('UPDATE to null succeeds', async () => {
    await userClient.from('profiles').update({ favorite_spot_id: spotA }).eq('id', userId)
    const { error } = await userClient
      .from('profiles')
      .update({ favorite_spot_id: null })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', userId)
      .single()

    expect(data!.favorite_spot_id).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// S53-4: Non-owner cannot update another user's favorite_spot_id
// ---------------------------------------------------------------------------
describe('S53-4: non-owner cannot update another profile', () => {
  it('UPDATE on another row is blocked by RLS (0 rows affected, no error)', async () => {
    await admin.from('profiles').update({ favorite_spot_id: null }).eq('id', userId)

    const { error } = await otherClient
      .from('profiles')
      .update({ favorite_spot_id: spotA })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', userId)
      .single()

    expect(data!.favorite_spot_id).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// S53-5: Deleting the favorited Spot nulls the FK
// ---------------------------------------------------------------------------
describe('S53-5: FK ON DELETE SET NULL', () => {
  it('deleting favorited Spot clears favorite_spot_id', async () => {
    const ephemeral = await seedSpot(userId, [networkId], { title: 'Ephemeral' })
    await userClient.from('profiles').update({ favorite_spot_id: ephemeral }).eq('id', userId)

    const { error } = await admin.from('spots').delete().eq('id', ephemeral)
    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', userId)
      .single()

    expect(data!.favorite_spot_id).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// S53-6: Default for new users is null
// ---------------------------------------------------------------------------
describe('S53-6: default favorite_spot_id is null', () => {
  it('freshly created profile has favorite_spot_id = null', async () => {
    const { data } = await admin
      .from('profiles')
      .select('favorite_spot_id')
      .eq('id', otherUserId)
      .single()

    expect(data!.favorite_spot_id).toBeNull()
  })
})
