/**
 * Settings / UI size preference — Issues #42, #52
 *
 * Verifies DB-level behaviour for UI size persistence:
 * S52-1  User can update their own ui_size across all tiers (small/medium/xl/xxl)
 * S52-2  Invalid value rejected by check constraint
 * S52-3  Non-owner cannot update another user's ui_size (RLS)
 * S52-4  Default value for new users is 'medium'
 */
import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { SupabaseClient } from '@supabase/supabase-js'
import { createUser, signIn, cleanupUsers, admin } from '../helpers/seed'

let userId: string
let otherUserId: string
let userClient: SupabaseClient
let otherClient: SupabaseClient

beforeAll(async () => {
  const user = await createUser('s52-user')
  const other = await createUser('s52-other')

  userId = user.id
  otherUserId = other.id

  userClient = await signIn(user.email, user.password)
  otherClient = await signIn(other.email, other.password)
})

afterAll(async () => {
  await cleanupUsers([userId, otherUserId])
})

// ---------------------------------------------------------------------------
// S52-1: User can update their own ui_size across all tiers
// ---------------------------------------------------------------------------
describe('S52-1: user updates own ui_size', () => {
  it.each(['small', 'medium', 'xl', 'xxl'] as const)(
    'UPDATE to %s succeeds and row reflects new value',
    async (size) => {
      const { error } = await userClient
        .from('profiles')
        .update({ ui_size: size })
        .eq('id', userId)

      expect(error).toBeNull()

      const { data } = await admin
        .from('profiles')
        .select('ui_size')
        .eq('id', userId)
        .single()

      expect(data!.ui_size).toBe(size)
    }
  )
})

// ---------------------------------------------------------------------------
// S52-2: Invalid ui_size value rejected by check constraint
// ---------------------------------------------------------------------------
describe('S52-2: invalid value rejected', () => {
  it('UPDATE with invalid size returns a check constraint error', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ ui_size: 'huge' })
      .eq('id', userId)

    expect(error).not.toBeNull()
    // Postgres check_violation = code 23514
    expect(error!.code).toBe('23514')
  })

  it('UPDATE with legacy value "regular" is rejected', async () => {
    const { error } = await userClient
      .from('profiles')
      .update({ ui_size: 'regular' })
      .eq('id', userId)

    expect(error).not.toBeNull()
    expect(error!.code).toBe('23514')
  })
})

// ---------------------------------------------------------------------------
// S52-3: Non-owner cannot update another user's ui_size (RLS)
// ---------------------------------------------------------------------------
describe('S52-3: non-owner cannot update another profile', () => {
  it('UPDATE on another row is blocked by RLS (0 rows affected, no error)', async () => {
    await admin.from('profiles').update({ ui_size: 'small' }).eq('id', userId)

    const { error } = await otherClient
      .from('profiles')
      .update({ ui_size: 'xl' })
      .eq('id', userId)

    expect(error).toBeNull()

    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', userId)
      .single()

    expect(data!.ui_size).toBe('small')
  })
})

// ---------------------------------------------------------------------------
// S52-4: Default for new users is 'medium'
// ---------------------------------------------------------------------------
describe('S52-4: default ui_size is medium', () => {
  it('freshly created profile has ui_size = medium', async () => {
    const { data } = await admin
      .from('profiles')
      .select('ui_size')
      .eq('id', otherUserId)
      .single()

    expect(data!.ui_size).toBe('medium')
  })
})
