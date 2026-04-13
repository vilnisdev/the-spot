import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import JoinNetworkForm from './join-network-form'

interface Props {
  params: Promise<{ token: string }>
}

export default async function InvitePage({ params }: Props) {
  const { token } = await params
  const supabase = await createSupabaseServerClient()

  const { data: rows } = await supabase.rpc('lookup_invitation', { p_token: token })
  const result = rows?.[0]

  if (!result || result.status === 'not_found') {
    return (
      <main>
        <h1>Invalid invitation link.</h1>
        <p>This invitation link is not valid.</p>
      </main>
    )
  }

  if (result.status === 'expired') {
    return (
      <main>
        <h1>Invitation expired</h1>
        <p>This invitation has expired.</p>
      </main>
    )
  }

  if (result.status === 'revoked') {
    return (
      <main>
        <h1>Invitation revoked</h1>
        <p>This invitation has been revoked.</p>
      </main>
    )
  }

  // Valid token — check auth
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/register?token=${token}`)
  }

  return (
    <main>
      <h1>You&apos;re invited!</h1>
      <p>
        Join <strong>{result.network_name}</strong>
      </p>
      <JoinNetworkForm token={token} />
    </main>
  )
}
