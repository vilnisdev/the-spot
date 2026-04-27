'use client'

import { useActionState } from 'react'
import Link from 'next/link'
import { loginAction } from '@/app/actions/auth'
import styles from '@/components/auth/authForm.module.css'
import localStyles from './login-form.module.css'

interface Props {
  next?: string
}

export default function LoginForm({ next }: Props) {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <form action={action} className={styles.form}>
      {next && <input type="hidden" name="next" value={next} />}

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
          autoComplete="current-password"
          className={styles.input}
          suppressHydrationWarning
        />
      </label>

      {state?.error && <p className={styles.error} role="alert">{state.error}</p>}

      <button type="submit" disabled={pending} className={styles.submit} suppressHydrationWarning>
        {pending ? 'Logging in…' : 'Log in'}
      </button>

      <Link href="/forgot-password" className={localStyles.forgot}>Forgot password?</Link>
    </form>
  )
}
