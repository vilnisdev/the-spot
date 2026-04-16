'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type AuthActionState =
  | {
      error?: string
      message?: string
    }
  | undefined

export async function registerAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const username = formData.get('username') as string

  if (!email || !password || !username) {
    return { error: 'All fields are required.' }
  }

  const inviteToken = formData.get('invite_token') as string | null

  const supabase = await createSupabaseServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { username },
      // If an invite token is present, route the confirmation email back through
      // the invite page so the user lands there already authenticated.
      ...(inviteToken && {
        emailRedirectTo: `${siteUrl}/auth/confirm?next=/invite/${inviteToken}`,
      }),
    },
  })

  if (error) return { error: error.message }

  // Email confirmation disabled — session is available immediately. Join now.
  if (inviteToken && data.session) {
    const { data: networkId } = await supabase.rpc('join_by_token', { p_token: inviteToken })
    if (networkId) redirect(`/networks/${networkId}`)
  }

  // No session yet (email confirmation required). If there's an invite token,
  // tell the user to confirm their email and return to the invite link after.
  if (inviteToken && !data.session) {
    return {
      message: `Check your email for a confirmation link. After confirming, return to ${siteUrl}/invite/${inviteToken} to join the network.`,
    }
  }

  redirect('/')
}

export async function loginAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const next = (formData.get('next') as string) || '/'

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) return { error: error.message }
  redirect(next)
}

export async function logoutAction(): Promise<void> {
  const supabase = await createSupabaseServerClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function forgotPasswordAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const email = formData.get('email') as string

  const supabase = await createSupabaseServerClient()
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${siteUrl}/auth/confirm?next=/reset-password`,
  })

  if (error) return { error: error.message }
  return { message: 'Check your email for a password reset link.' }
}

export async function resetPasswordAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  redirect('/')
}

export async function changePasswordAction(
  _state: AuthActionState,
  formData: FormData
): Promise<AuthActionState> {
  const password = formData.get('password') as string

  const supabase = await createSupabaseServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase.auth.updateUser({ password })

  if (error) return { error: error.message }
  return { message: 'Password updated successfully.' }
}
