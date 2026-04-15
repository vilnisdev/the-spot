'use client'

import { useState } from 'react'
import Link from 'next/link'
import { updateUsernameAction } from '@/app/actions/profile'
import styles from './settings.module.css'

interface SettingsPageProps {
  username: string
}

export default function SettingsPage({ username: initialUsername }: SettingsPageProps) {
  const [username, setUsername] = useState(initialUsername)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setFeedback(null)
    const result = await updateUsernameAction(username)
    setSaving(false)
    if (result.error) {
      setFeedback({ type: 'error', message: result.error })
    } else {
      setFeedback({ type: 'success', message: 'Username updated.' })
    }
  }

  return (
    <div className={styles.page}>
      <nav className={styles.topNav}>
        <Link href="/profile" className={styles.backLink}>← Profile</Link>
        <span className={styles.navDivider}>·</span>
        <span className={styles.navTitle}>Settings</span>
      </nav>

      <div className={styles.content}>
        <form onSubmit={handleSave}>
          <label className={styles.fieldLabel} htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            className={styles.input}
            value={username}
            onChange={(e) => { setUsername(e.target.value); setFeedback(null) }}
            autoComplete="off"
            spellCheck={false}
          />
          <button type="submit" className={styles.saveBtn} disabled={saving}>
            {saving ? 'Saving…' : 'Save changes'}
          </button>
          {feedback && (
            <p className={`${styles.feedback} ${feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
              {feedback.message}
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
