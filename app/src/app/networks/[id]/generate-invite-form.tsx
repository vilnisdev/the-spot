'use client'

import { useActionState } from 'react'
import { createInvitationAction } from '@/app/actions/invitations'

interface Props {
  networkId: string
}

const siteUrl =
  typeof process !== 'undefined' && process.env.NEXT_PUBLIC_SITE_URL
    ? process.env.NEXT_PUBLIC_SITE_URL
    : ''

export default function GenerateInviteForm({ networkId }: Props) {
  const [state, action, pending] = useActionState(createInvitationAction, undefined)

  const inviteUrl = state?.token ? `${siteUrl}/invite/${state.token}` : null

  return (
    <div>
      <form action={action}>
        <input type="hidden" name="network_id" value={networkId} />
        <button type="submit" disabled={pending}>
          {pending ? 'Generating…' : 'Generate invite link'}
        </button>
      </form>
      {state?.error && <p role="alert">{state.error}</p>}
      {inviteUrl && (
        <p>
          <span>Invite link: </span>
          <code>{inviteUrl}</code>
        </p>
      )}
    </div>
  )
}
