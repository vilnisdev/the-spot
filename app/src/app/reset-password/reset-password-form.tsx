'use client'

import { useActionState } from 'react'
import { resetPasswordAction } from '@/app/actions/auth'

export default function ResetPasswordForm() {
  const [state, action, pending] = useActionState(resetPasswordAction, undefined)

  return (
    <form action={action}>
      <div>
        <label htmlFor="password">New password</label>
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
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
