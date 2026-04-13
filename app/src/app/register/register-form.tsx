'use client'

import { useActionState } from 'react'
import { registerAction } from '@/app/actions/auth'

interface Props {
  inviteToken?: string
}

export default function RegisterForm({ inviteToken }: Props) {
  const [state, action, pending] = useActionState(registerAction, undefined)

  return (
    <form action={action}>
      {inviteToken && <input type="hidden" name="invite_token" value={inviteToken} />}
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" required autoComplete="username" suppressHydrationWarning />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" suppressHydrationWarning />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
          suppressHydrationWarning
        />
      </div>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending} suppressHydrationWarning>
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
