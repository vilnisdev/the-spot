export type UiSizePreference = 'regular' | 'large' | 'xlarge'

export const UI_SIZE_COOKIE = 'ui-size'
export const UI_SIZE_EVENT = 'uisizechange'
export const UI_SIZE_PREFERENCES: readonly UiSizePreference[] = ['regular', 'large', 'xlarge']

export function isUiSizePreference(value: unknown): value is UiSizePreference {
  return typeof value === 'string' && (UI_SIZE_PREFERENCES as readonly string[]).includes(value)
}

export function applyUiSize(pref: UiSizePreference): void {
  if (typeof document === 'undefined') return
  document.documentElement.dataset.size = pref
  document.cookie = `${UI_SIZE_COOKIE}=${pref}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`
  window.dispatchEvent(new CustomEvent<UiSizePreference>(UI_SIZE_EVENT, { detail: pref }))
}
