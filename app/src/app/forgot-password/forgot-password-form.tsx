'use client'

import { useActionState } from 'react'
import { forgotPasswordAction } from '@/app/actions/auth'

export default function ForgotPasswordForm() {
  const [state, action, pending] = useActionState(forgotPasswordAction, undefined)

  return (
    <form action={action}>
      <div>
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" suppressHydrationWarning />
      </div>

      {state?.error && <p role="alert">{state.error}</p>}
      {state?.message && <p role="status">{state.message}</p>}

      <button type="submit" disabled={pending} suppressHydrationWarning>
        {pending ? 'Sending…' : 'Send reset link'}
      </button>
    </form>
  )
}
