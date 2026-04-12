'use client'

import { useActionState } from 'react'
import { changePasswordAction } from '@/app/actions/auth'

export default function ChangePasswordForm() {
  const [state, action, pending] = useActionState(changePasswordAction, undefined)

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
      {state?.message && <p role="status">{state.message}</p>}

      <button type="submit" disabled={pending}>
        {pending ? 'Updating…' : 'Update password'}
      </button>
    </form>
  )
}
