/**
 * Settings / UI size preference — Issue #42
 *
 * Verifies DB-level behaviour for UI size persistence:
 * S42-1  User can update their own ui_size
 * S42-2  Invalid value rejected by check constraint
 * S42-3  Non-owner cannot update another user's ui_size (RLS)
 * S42-4  Default value for new users is 'regular'
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUser, signIn, cleanupUsers, admin } from '../helpers/seed'

let userId: string
let otherUserId: string
let userClient: SupabaseClient
let otherClient: SupabaseClient

beforeAll(async () => {
  const user = await createUser('s42-user')
  const other = await createUser('s42-other')

  userId = user.id
  otherUserId = other.id

  userClient = await signIn(user.email, user.password)
  otherClient = await signIn(other.email, other.password)
})

afterAll(async () => {
  await cleanupUsers([userId, otherUserId])
})

// ---------------------------------------------------------------------------
// S42-1: User can update their own ui_size
// ---------------------------------------------------------------------------
describe('S42-1: user updates own ui_size', () => {
  it('UPDATE succeeds and row reflects new value', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ ui_size: 'large' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', userId)
      .single()

    expect(data!.ui_size).toBe('large')
  })

  it('UPDATE to xlarge succeeds', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ ui_size: 'xlarge' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', userId)
      .single()

    expect(data!.ui_size).toBe('xlarge')
  })

  it('UPDATE back to regular succeeds', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ ui_size: 'regular' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', userId)
      .single()

    expect(data!.ui_size).toBe('regular')
  })
})

// ---------------------------------------------------------------------------
// S42-2: Invalid ui_size value rejected by check constraint
// ---------------------------------------------------------------------------
describe('S42-2: invalid value rejected', () => {
  it('UPDATE with invalid size returns a check constraint error', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ ui_size: 'huge' })
      .eq('id', userId)

    expect(error).not.toBeNull()
    // Postgres check_violation = code 23514
    expect(error!.code).toBe('23514')
  })
})

// ---------------------------------------------------------------------------
// S42-3: Non-owner cannot update another user's ui_size (RLS)
// ---------------------------------------------------------------------------
describe('S42-3: non-owner cannot update another profile', () => {
  it('UPDATE on another row is blocked by RLS (0 rows affected, no error)', async () => {
    // Seed a known baseline via admin
    await admin.from('profiles').update({ ui_size: 'regular' }).eq('id', userId)

    const { error } = await otherClient
      .from('profiles')
      .update({ ui_size: 'large' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', userId)
      .single()

    expect(data!.ui_size).toBe('regular')
  })
})

// ---------------------------------------------------------------------------
// S42-4: Default for new users is 'regular'
// ---------------------------------------------------------------------------
describe('S42-4: default ui_size is regular', () => {
  it('freshly created profile has ui_size = regular', async () => {
    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', otherUserId)
      .single()

    expect(data!.ui_size).toBe('regular')
  })
})
