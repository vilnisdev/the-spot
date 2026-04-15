'use client'

import { useState } from 'react'
import PageNav from '@/components/shared/PageNav'
import { updateUsernameAction, updateThemePreferenceAction } from '@/app/actions/profile'
import { applyTheme, type ThemePreference } from '@/lib/theme'
import styles from './settings.module.css'

interface SettingsPageProps {
  username: string
  themePreference: ThemePreference
}

const THEME_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]

export default function SettingsPage({
  username: initialUsername,
  themePreference: initialTheme,
}: SettingsPageProps) {
  const [username, setUsername] = useState(initialUsername)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const [theme, setTheme] = useState<ThemePreference>(initialTheme)
  const [themeFeedback, setThemeFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

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

  async function handleThemeSelect(next: ThemePreference) {
    if (next === theme) return
    const previous = theme
    setTheme(next)
    setThemeFeedback(null)
    applyTheme(next)

    const result = await updateThemePreferenceAction(next)
    if (result.error) {
      setTheme(previous)
      applyTheme(previous)
      setThemeFeedback({ type: 'error', message: result.error })
    } else {
      setThemeFeedback({ type: 'success', message: 'Theme saved.' })
    }
  }

  return (
    <div className={styles.page}>
      <PageNav />

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

        <section className={styles.themeSection} aria-labelledby="theme-label">
          <span id="theme-label" className={styles.fieldLabel}>Theme</span>
          <div className={styles.segmented} role="radiogroup" aria-labelledby="theme-label">
            {THEME_OPTIONS.map((opt) => {
              const selected = theme === opt.value
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  className={`${styles.segmentBtn} ${selected ? styles.segmentBtnActive : ''}`}
                  onClick={() => handleThemeSelect(opt.value)}
                >
                  {opt.label}
                </button>
              )
            })}
          </div>
          {themeFeedback && (
            <p className={`${styles.feedback} ${themeFeedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError}`}>
              {themeFeedback.message}
            </p>
          )}
        </section>
      </div>
    </div>
  )
}
