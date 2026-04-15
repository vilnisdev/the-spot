'use server'

import { createSupabaseServerClient } from '@/lib/supabase/server'

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
