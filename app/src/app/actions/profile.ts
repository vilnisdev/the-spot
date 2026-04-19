'use server'

import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { isThemePreference, THEME_COOKIE, type ThemePreference } from '@/lib/theme'
import { isUiSizePreference, UI_SIZE_COOKIE, type UiSizePreference } from '@/lib/uiSize'

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

/**
 * updateUiSizeAction — update the current user's ui_size preference.
 * Mirrors the DB value into a cookie so the root layout can SSR the correct
 * `data-size` attribute on subsequent page loads without a flash.
 */
export async function updateUiSizeAction(
  preference: UiSizePreference
): Promise<{ error?: string }> {
  if (!isUiSizePreference(preference)) return { error: 'Invalid size.' }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ ui_size: preference })
    .eq('id', user.id)

  if (error) return { error: error.message }

  const cookieStore = await cookies()
  cookieStore.set(UI_SIZE_COOKIE, preference, {
    path: '/',
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
  })

  return {}
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * updateFavoriteSpotAction — set (or clear) the current user's favorite Spot.
 * Passing null clears the favorite. Overwrites any previous value.
 */
export async function updateFavoriteSpotAction(
  spotId: string | null
): Promise<{ error?: string }> {
  if (spotId !== null && !UUID_RE.test(spotId)) return { error: 'Invalid spot id.' }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('profiles')
    .update({ favorite_spot_id: spotId })
    .eq('id', user.id)

  if (error) return { error: error.message }
  return {}
}
