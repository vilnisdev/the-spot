'use client'

import { useActionState } from 'react'
import { joinByTokenAction } from '@/app/actions/invitations'

interface Props {
  token: string
}

export default function JoinNetworkForm({ token }: Props) {
  const [state, action, pending] = useActionState(joinByTokenAction, undefined)

  return (
    <form action={action}>
      <input type="hidden" name="token" value={token} />
      {state?.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={pending}>
        {pending ? 'Joining…' : 'Join Circle'}
      </button>
    </form>
  )
}
