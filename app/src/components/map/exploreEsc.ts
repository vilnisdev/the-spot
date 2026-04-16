export interface ExploreEscContext {
  exploreMode: boolean
  modalOpen: boolean
}

export function shouldExitExploreOnEsc(
  event: KeyboardEvent,
  ctx: ExploreEscContext
): boolean {
  if (event.key !== 'Escape') return false
  if (!ctx.exploreMode) return false
  if (ctx.modalOpen) return false
  return true
}
