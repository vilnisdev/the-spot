'use client'

import { useActionState, useState } from 'react'
import Link from 'next/link'
import { registerAction } from '@/app/actions/auth'
import { loginAction } from '@/app/actions/auth'
import styles from './landingPage.module.css'
import formStyles from '@/components/auth/authForm.module.css'

type Tab = 'signup' | 'login'

export default function LandingAuthForm() {
  const [tab, setTab] = useState<Tab>('signup')
  const [signupState, signupAction, signupPending] = useActionState(registerAction, undefined)
  const [loginState, loginAction_, loginPending] = useActionState(loginAction, undefined)

  return (
    <div className={formStyles.card}>
      <div className={styles.tabs}>
        <button
          className={tab === 'signup' ? styles.tabActive : styles.tab}
          onClick={() => setTab('signup')}
          type="button"
        >
          Sign up
        </button>
        <button
          className={tab === 'login' ? styles.tabActive : styles.tab}
          onClick={() => setTab('login')}
          type="button"
        >
          Log in
        </button>
      </div>

      {tab === 'signup' && (
        <form action={signupAction} className={formStyles.form}>
          <label className={formStyles.label}>
            Username
            <input
              name="username"
              type="text"
              required
              autoComplete="username"
              className={formStyles.input}
              suppressHydrationWarning
            />
          </label>
          <label className={formStyles.label}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={formStyles.input}
              suppressHydrationWarning
            />
          </label>
          <label className={formStyles.label}>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className={formStyles.input}
              suppressHydrationWarning
            />
          </label>
          {signupState?.error && <p className={formStyles.error} role="alert">{signupState.error}</p>}
          {signupState?.message && <p className={formStyles.message}>{signupState.message}</p>}
          <button type="submit" disabled={signupPending} className={formStyles.submit} suppressHydrationWarning>
            {signupPending ? 'Creating account…' : 'Create account'}
          </button>
        </form>
      )}

      {tab === 'login' && (
        <form action={loginAction_} className={formStyles.form}>
          <label className={formStyles.label}>
            Email
            <input
              name="email"
              type="email"
              required
              autoComplete="email"
              className={formStyles.input}
              suppressHydrationWarning
            />
          </label>
          <label className={formStyles.label}>
            Password
            <input
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className={formStyles.input}
              suppressHydrationWarning
            />
          </label>
          {loginState?.error && <p className={formStyles.error} role="alert">{loginState.error}</p>}
          <button type="submit" disabled={loginPending} className={formStyles.submit} suppressHydrationWarning>
            {loginPending ? 'Logging in…' : 'Log in'}
          </button>
          <Link href="/forgot-password" className={styles.forgot}>Forgot password?</Link>
        </form>
      )}
    </div>
  )
}
