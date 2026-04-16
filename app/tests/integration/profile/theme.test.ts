/**
 * Settings / theme preference — Issue #16
 *
 * Verifies DB-level behaviour for dark/light mode persistence:
 * S16-1  User can update their own theme_preference
 * S16-2  Invalid value rejected by check constraint
 * S16-3  Non-owner cannot update another user's theme_preference (RLS)
 * S16-4  Default value for new users is 'system'
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUser, signIn, cleanupUsers, admin } from '../helpers/seed'

let userId: string
let otherUserId: string
let userClient: SupabaseClient
let otherClient: SupabaseClient

beforeAll(async () => {
  const user = await createUser('s16-user')
  const other = await createUser('s16-other')

  userId = user.id
  otherUserId = other.id

  userClient = await signIn(user.email, user.password)
  otherClient = await signIn(other.email, other.password)
})

afterAll(async () => {
  await cleanupUsers([userId, otherUserId])
})

// ---------------------------------------------------------------------------
// S16-1: User can update their own theme_preference
// ---------------------------------------------------------------------------
describe('S16-1: user updates own theme_preference', () => {
  it('UPDATE succeeds and row reflects new value', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ theme_preference: 'dark' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('theme_preference')
      .eq('id', userId)
      .single()

    expect(data!.theme_preference).toBe('dark')
  })
})

// ---------------------------------------------------------------------------
// S16-2: Invalid theme value rejected by check constraint
// ---------------------------------------------------------------------------
describe('S16-2: invalid value rejected', () => {
  it('UPDATE with invalid preference returns a check constraint error', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ theme_preference: 'neon' })
      .eq('id', userId)

    expect(error).not.toBeNull()
    // Postgres check_violation = code 23514
    expect(error!.code).toBe('23514')
  })
})

// ---------------------------------------------------------------------------
// S16-3: Non-owner cannot update another user's theme_preference
// ---------------------------------------------------------------------------
describe('S16-3: non-owner cannot update another profile', () => {
  it('UPDATE on another row is blocked by RLS (0 rows affected, no error)', async () => {
    // Seed a known baseline via admin
    await admin.from('profiles').update({ theme_preference: 'light' }).eq('id', userId)

    const { error } = await otherClient
      .from('profiles')
      .update({ theme_preference: 'dark' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('theme_preference')
      .eq('id', userId)
      .single()

    expect(data!.theme_preference).toBe('light')
  })
})

// ---------------------------------------------------------------------------
// S16-4: Default for new users is 'system'
// ---------------------------------------------------------------------------
describe('S16-4: default theme_preference is system', () => {
  it('freshly created profile has theme_preference = system', async () => {
    const { data } = await admin
      .from('profiles')
      .select('theme_preference')
      .eq('id', otherUserId)
      .single()

    expect(data!.theme_preference).toBe('system')
  })
})
