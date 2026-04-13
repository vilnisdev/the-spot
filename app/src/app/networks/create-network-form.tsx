'use client'

import { useActionState } from 'react'
import { createNetworkAction } from '@/app/actions/networks'

export default function CreateNetworkForm() {
  const [state, action, pending] = useActionState(createNetworkAction, undefined)

  return (
    <form action={action}>
      <label htmlFor="network-name">Network name</label>
      <input id="network-name" name="name" type="text" required placeholder="e.g. Trail Crew" suppressHydrationWarning />
      {state?.error && <p role="alert">{state.error}</p>}
      <button type="submit" disabled={pending} suppressHydrationWarning>
        {pending ? 'Creating…' : 'Create Network'}
      </button>
    </form>
  )
}
