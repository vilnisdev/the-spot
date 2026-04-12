'use client'

import { useActionState } from 'react'
import { loginAction } from '@/app/actions/auth'

interface Props {
  next?: string
}

export default function LoginForm({ next }: Props) {
  const [state, action, pending] = useActionState(loginAction, undefined)

  return (
    <form action={action}>
      {next && <input type="hidden" name="next" value={next} />}

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
          autoComplete="current-password"
        />
      </div>

      {state?.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Logging in…' : 'Log in'}
      </button>
    </form>
  )
}
