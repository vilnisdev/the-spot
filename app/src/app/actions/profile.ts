'use server'

import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isThemePreference, THEME_COOKIE, type ThemePreference } from '@/lib/theme'

/**
 * updateUsernameAction — update the current user's username.
 * Returns { error } if username is taken or user is not authenticated.
 */
export async function updateUsernameAction(
  username: string
): Promise<{ error?: string }> {
  const trimmed = username.trim()
  if (!trimmed) return { error: 'Username cannot be empty.' }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ username: trimmed })
    .eq('id', user.id)

  if (error) {
    if (error.code === '23505') return { error: 'Username already taken.' }
    return { error: error.message }
  }

  return {}
}

/**
 * updateThemePreferenceAction — update the current user's theme_preference.
 * Mirrors the DB value into a cookie so the root layout can SSR the correct
 * `data-theme` attribute on subsequent page loads without a flash.
 */
export async function updateThemePreferenceAction(
  preference: ThemePreference
): Promise<{ error?: string }> {
  if (!isThemePreference(preference)) return { error: 'Invalid theme.' }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ theme_preference: preference })
    .eq('id', user.id)

  if (error) return { error: error.message }

  const cookieStore = await cookies()
  cookieStore.set(THEME_COOKIE, preference, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  return {}
}
