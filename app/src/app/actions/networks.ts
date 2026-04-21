'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabase/server'

export type NetworkActionState = { error?: string } | undefined

// ---------------------------------------------------------------------------
// createNetworkAction — uses RPC so network + owner membership are atomic.
// Used with useActionState (prevState, formData).
// ---------------------------------------------------------------------------
export async function createNetworkAction(
  _state: NetworkActionState,
  formData: FormData
): Promise<NetworkActionState> {
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Name is required.' }

  const supabase = await createSupabaseServerClient()
  const { data: networkId, error } = await supabase.rpc('create_network', { p_name: name })
  if (error) return { error: error.message }

  redirect(`/circles/${networkId}`)
}

// ---------------------------------------------------------------------------
// renameNetworkAction — plain form action (no state needed; page reloads).
// ---------------------------------------------------------------------------
export async function renameNetworkAction(formData: FormData): Promise<void> {
  const networkId = formData.get('network_id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!networkId || !name) return

  const supabase = await createSupabaseServerClient()
  await supabase.from('networks').update({ name }).eq('id', networkId)
  revalidatePath(`/circles/${networkId}`)
}

// ---------------------------------------------------------------------------
// deleteNetworkAction — owner only (RLS enforces). Redirects to list.
// ---------------------------------------------------------------------------
export async function deleteNetworkAction(formData: FormData): Promise<void> {
  const networkId = formData.get('network_id') as string
  if (!networkId) return

  const supabase = await createSupabaseServerClient()
  await supabase.from('networks').delete().eq('id', networkId)
  redirect('/circles')
}

// ---------------------------------------------------------------------------
// leaveNetworkAction — member deletes own membership. Redirects to list.
// ---------------------------------------------------------------------------
export async function leaveNetworkAction(formData: FormData): Promise<void> {
  const networkId = formData.get('network_id') as string
  if (!networkId) return

  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return

  await supabase
    .from('memberships')
    .delete()
    .eq('network_id', networkId)
    .eq('user_id', user.id)

  redirect('/circles')
}

// ---------------------------------------------------------------------------
// removeMemberAction — owner removes another member (RLS enforces).
// ---------------------------------------------------------------------------
export async function removeMemberAction(formData: FormData): Promise<void> {
  const networkId = formData.get('network_id') as string
  const targetUserId = formData.get('user_id') as string
  if (!networkId || !targetUserId) return

  const supabase = await createSupabaseServerClient()
  await supabase
    .from('memberships')
    .delete()
    .eq('network_id', networkId)
    .eq('user_id', targetUserId)

  revalidatePath(`/circles/${networkId}`)
}
