'use client'

import { useActionState } from 'react'
import { registerAction } from '@/app/actions/auth'

export default function RegisterForm() {
  const [state, action, pending] = useActionState(registerAction, undefined)

  return (
    <form action={action}>
      <div>
        <label htmlFor="username">Username</label>
        <input id="username" name="username" type="text" required autoComplete="username" />
      </div>

      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div>
        <label htmlFor="password">Password</label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="new-password"
        />
      </div>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Creating account…' : 'Create account'}
      </button>
    </form>
  )
}
