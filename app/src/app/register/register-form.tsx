'use client'

import { useActionState } from 'react'
import { registerAction } from '@/app/actions/auth'
import styles from '@/components/auth/authForm.module.css'

interface Props {
  inviteToken?: string
}

export default function RegisterForm({ inviteToken }: Props) {
  const [state, action, pending] = useActionState(registerAction, undefined)

  return (
    <form action={action} className={styles.form}>
      {inviteToken && <input type="hidden" name="invite_token" value={inviteToken} />}

      <label className={styles.label}>
        Username
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          className={styles.input}
          suppressHydrationWarning
        />
      </label>

      <label className={styles.label}>
        Email
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className={styles.input}
          suppressHydrationWarning
        />
      </label>

      <label className={styles.label}>
        Password
        <input
          name="password"
          type="password"
          required
          autoComplete="new-password"
          className={styles.input}
          suppressHydrationWarning
        />
      </label>

      {state?.error && <p className={styles.error} role="alert">{state.error}</p>}
      {state?.message && <p className={styles.message}>{state.message}</p>}

      <button type="submit" disabled={pending} className={styles.submit} suppressHydrationWarning>
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
