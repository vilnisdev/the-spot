/**
 * Settings / username edit — Issue #15
 *
 * Verifies DB-level behaviour for the /settings page:
 * S15-1  updateUsernameAction — updates username successfully
 * S15-2  updateUsernameAction — rejects duplicate username (unique constraint)
 * S15-3  Non-owner cannot update another user's profile (RLS blocks)
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUser, signIn, cleanupUsers, admin } from '../helpers/seed'

let userId: string
let otherUserId: string
let userClient: SupabaseClient
let otherClient: SupabaseClient
let originalUsername: string
let otherUsername: string

beforeAll(async () => {
  const user = await createUser('s15-user')
  const other = await createUser('s15-other')

  userId = user.id
  otherUserId = other.id
  originalUsername = user.username
  otherUsername = other.username

  userClient = await signIn(user.email, user.password)
  otherClient = await signIn(other.email, other.password)
})

afterAll(async () => {
  await cleanupUsers([userId, otherUserId])
})

// ---------------------------------------------------------------------------
// S15-1: User can update their own username
// ---------------------------------------------------------------------------
describe('S15-1: user updates own username', () => {
  it('UPDATE succeeds and row reflects new value', async () => {
    const newName = `updated-${Date.now()}`

    const { error } = await userClient
      .from('profiles')
      .update({ username: newName })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    expect(data!.username).toBe(newName)
    // Restore for subsequent tests
    await admin.from('profiles').update({ username: originalUsername }).eq('id', userId)
  })
})

// ---------------------------------------------------------------------------
// S15-2: Duplicate username rejected (unique constraint)
// ---------------------------------------------------------------------------
describe('S15-2: duplicate username rejected', () => {
  it('UPDATE with existing username returns an error', async () => {
    // Try to set user's username to other's username (already taken)
    const { error } = await userClient
      .from('profiles')
      .update({ username: otherUsername })
      .eq('id', userId)

    expect(error).not.toBeNull()
    // Postgres unique violation = code 23505
    expect(error!.code).toBe('23505')
  })
})

// ---------------------------------------------------------------------------
// S15-3: Non-owner cannot update another user's profile
// ---------------------------------------------------------------------------
describe('S15-3: non-owner cannot update another profile', () => {
  it('UPDATE on another row is blocked by RLS (0 rows affected, no error)', async () => {
    const hijacked = `hijacked-${Date.now()}`

    const { error } = await otherClient
      .from('profiles')
      .update({ username: hijacked })
      .eq('id', userId) // targeting user's row from otherClient

    // RLS silently blocks: no error, but no change
    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('username')
      .eq('id', userId)
      .single()

    expect(data!.username).toBe(originalUsername)
  })
})
