'use client'

import { useActionState } from 'react'
import { createNetworkAction } from '@/app/actions/networks'
import styles from './networks.module.css'

export default function CreateNetworkForm() {
  const [state, action, pending] = useActionState(createNetworkAction, undefined)

  return (
    <form action={action}>
      <input
        id="network-name"
        name="name"
        type="text"
        required
        placeholder="e.g. Trail Crew"
        className={styles.input}
        suppressHydrationWarning
      />
      {state?.error && <p role="alert" className={styles.formError}>{state.error}</p>}
      <button type="submit" disabled={pending} className={styles.createBtn} suppressHydrationWarning>
        {pending ? 'Creating\u2026' : 'Create New Network'}
      </button>
    </form>
  )
}
