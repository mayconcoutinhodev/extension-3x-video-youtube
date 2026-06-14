import type { Settings, SpeedAction } from '../shared/types'

const SKIP_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT'])

export function setupHotkeys(
  settings: Settings,
  onAction: (action: SpeedAction) => void,
): () => void {
  function handler(e: KeyboardEvent): void {
    const target = e.target as HTMLElement
    if (SKIP_TAGS.has(target.tagName) || target.isContentEditable) return

    for (const hk of settings.hotkeys) {
      if (
        e.key === hk.key &&
        e.altKey === hk.modifiers.alt &&
        e.ctrlKey === hk.modifiers.ctrl &&
        e.shiftKey === hk.modifiers.shift
      ) {
        e.preventDefault()
        e.stopImmediatePropagation()
        onAction(hk.action)
        return
      }
    }
  }

  // capture: true so we intercept before YouTube's own key handlers
  document.addEventListener('keydown', handler, { capture: true })
  return () => document.removeEventListener('keydown', handler, { capture: true })
}
