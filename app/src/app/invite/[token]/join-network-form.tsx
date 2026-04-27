'use client'

import { useActionState } from 'react'
import { joinByTokenAction } from '@/app/actions/invitations'
import styles from '@/components/auth/authForm.module.css'

interface Props {
  token: string
}

export default function JoinNetworkForm({ token }: Props) {
  const [state, action, pending] = useActionState(joinByTokenAction, undefined)

  return (
    <form action={action} className={styles.form}>
      <input type="hidden" name="token" value={token} />
      {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.submit}>
        {pending ? 'Joining…' : 'Join'}
      </button>
    </form>
  )
}
