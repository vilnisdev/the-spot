import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import JoinNetworkForm from './join-network-form'
import AuthShell from '@/components/auth/AuthShell'
import formStyles from '@/components/auth/authForm.module.css'

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
      <AuthShell>
        <div className={formStyles.card}>
          <h1 className={formStyles.heading}>Invitation not found.</h1>
          <p className={formStyles.bodyText}>This link doesn&apos;t match a valid invitation.</p>
        </div>
        <p className={formStyles.altLink}>
          <a href="/">Go home</a>
        </p>
      </AuthShell>
    )
  }

  if (result.status === 'expired') {
    return (
      <AuthShell>
        <div className={formStyles.card}>
          <h1 className={formStyles.heading}>Invitation expired.</h1>
          <p className={formStyles.bodyText}>Ask the person who invited you for a fresh link.</p>
        </div>
        <p className={formStyles.altLink}>
          <a href="/">Go home</a>
        </p>
      </AuthShell>
    )
  }

  if (result.status === 'revoked') {
    return (
      <AuthShell>
        <div className={formStyles.card}>
          <h1 className={formStyles.heading}>Invitation revoked.</h1>
          <p className={formStyles.bodyText}>The inviter cancelled this invitation.</p>
        </div>
        <p className={formStyles.altLink}>
          <a href="/">Go home</a>
        </p>
      </AuthShell>
    )
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/register?token=${token}`)
  }

  return (
    <AuthShell>
      <div className={formStyles.card}>
        <h1 className={formStyles.heading}>You&apos;re invited to {result.network_name}.</h1>
        <p className={formStyles.bodyText}>Join the circle to start sharing spots.</p>
        <JoinNetworkForm token={token} />
      </div>
    </AuthShell>
  )
}
