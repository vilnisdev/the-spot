'use client'

import { useActionState } from 'react'
import { createInvitationAction } from '@/app/actions/invitations'
import styles from './networkDetail.module.css'

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
        <button type="submit" disabled={pending} className={styles.generateBtn}>
          {pending ? 'Generating\u2026' : 'Generate invite link'}
        </button>
      </form>
      {state?.error && <p role="alert" className={styles.formError}>{state.error}</p>}
      {inviteUrl && (
        <div>
          <p className={styles.inviteUrlLabel}>Invite link</p>
          <code className={styles.inviteUrl}>{inviteUrl}</code>
        </div>
      )}
    </div>
  )
}
