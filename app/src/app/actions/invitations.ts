'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type InvitationActionState = { error?: string; token?: string } | undefined

// ---------------------------------------------------------------------------
// createInvitationAction — member generates a new invite link for their network.
// Returns the token in state so the UI can display the full URL.
// ---------------------------------------------------------------------------
export async function createInvitationAction(
  _state: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const networkId = formData.get('network_id') as string
  if (!networkId) return { error: 'Network ID is required.' }

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { data, error } = await supabase
    .from('invitations')
    .insert({ network_id: networkId, created_by: user.id })
    .select('token')
    .single()

  if (error) return { error: error.message }
  return { token: data.token }
}

// ---------------------------------------------------------------------------
// revokeInvitationAction — owner revokes an active invitation (RLS enforces).
// ---------------------------------------------------------------------------
export async function revokeInvitationAction(formData: FormData): Promise<void> {
  const invitationId = formData.get('invitation_id') as string
  const networkId = formData.get('network_id') as string
  if (!invitationId || !networkId) return

  const supabase = await createSupabaseServerClient()
  await supabase
    .from('invitations')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', invitationId)

  revalidatePath(`/networks/${networkId}`)
}

// ---------------------------------------------------------------------------
// joinByTokenAction — authenticated user joins a network via invite token.
// ---------------------------------------------------------------------------
export async function joinByTokenAction(
  _state: InvitationActionState,
  formData: FormData
): Promise<InvitationActionState> {
  const token = formData.get('token') as string
  if (!token) return { error: 'Token is required.' }

  const supabase = await createSupabaseServerClient()
  const { data: networkId, error } = await supabase.rpc('join_by_token', { p_token: token })

  if (error) return { error: error.message }
  redirect(`/networks/${networkId}`)
}
