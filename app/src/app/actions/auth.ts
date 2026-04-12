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

  const supabase = await createSupabaseServerClient()
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { username } },
  })

  if (error) return { error: error.message }
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
