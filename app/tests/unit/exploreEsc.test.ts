import { describe, it, expect } from 'vitest'
import { shouldExitExploreOnEsc } from '../../src/components/map/exploreEsc'

describe('shouldExitExploreOnEsc', () => {
  const esc = { key: 'Escape' } as KeyboardEvent
  const notEsc = { key: 'a' } as KeyboardEvent

  it('exits when explore active, key is Escape, no modal open', () => {
    expect(shouldExitExploreOnEsc(esc, { exploreMode: true, modalOpen: false })).toBe(true)
  })

  it('does not exit when key is not Escape', () => {
    expect(shouldExitExploreOnEsc(notEsc, { exploreMode: true, modalOpen: false })).toBe(false)
  })

  it('does not exit when explore mode is off', () => {
    expect(shouldExitExploreOnEsc(esc, { exploreMode: false, modalOpen: false })).toBe(false)
  })

  it('does not exit when a modal is open (modal Esc handler takes precedence)', () => {
    expect(shouldExitExploreOnEsc(esc, { exploreMode: true, modalOpen: true })).toBe(false)
  })
})
