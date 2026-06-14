import { loadSettings, patchSettings, onSettingsChanged } from '../shared/storage'
import type { Settings, SpeedAction, ExtMessage } from '../shared/types'
import { setSpeed, getSpeed } from './player'
import { watchNavigation, waitForVideo } from './observer'
import { showSpeedOverlay, destroyOverlay } from './overlay'
import { updateButton, setSelectCallback, destroyButton } from './button'
import { setupHotkeys } from './hotkeys'

let settings: Settings | null = null
let cleanupHotkeys: (() => void) | null = null

function resolveAction(action: SpeedAction): number {
  if (!settings) return 1
  const values = [...settings.speeds].map((s) => s.value).sort((a, b) => a - b)
  if (values.length === 0) return 1

  const current = getSpeed()

  if (action === 'next') return values.find((v) => v > current + 0.001) ?? values.at(-1)!
  if (action === 'prev') return [...values].reverse().find((v) => v < current - 0.001) ?? values[0]
  if (action === 'reset') return 1
  return action
}

function applySpeed(speed: number): void {
  if (!settings) return
  const applied = setSpeed(speed)
  if (!applied) return

  if (settings.showOverlay) showSpeedOverlay(speed)
  updateButton(speed, settings.speeds)

  if (settings.rememberLastSpeed && settings.lastSpeed !== speed) {
    settings.lastSpeed = speed
    patchSettings({ lastSpeed: speed }).catch(() => {})
  }
}

function handleAction(action: SpeedAction): void {
  applySpeed(resolveAction(action))
}

function applyCurrentSettings(s: Settings): void {
  settings = s
  cleanupHotkeys?.()
  cleanupHotkeys = setupHotkeys(s, handleAction)
  updateButton(getSpeed(), s.speeds)
}

async function initForPage(): Promise<void> {
  if (!settings) return

  try {
    await waitForVideo(6000)
  } catch {
    destroyButton()
    return
  }

  const speed = settings.rememberLastSpeed
    ? settings.lastSpeed
    : settings.autoApplyEnabled
      ? settings.autoApplyValue
      : 1

  applySpeed(speed)
}

async function init(): Promise<void> {
  settings = await loadSettings()

  setSelectCallback((v) => applySpeed(v))
  applyCurrentSettings(settings)

  // React to settings changes from popup (same or other tabs)
  onSettingsChanged((updated) => applyCurrentSettings(updated))

  // Accept direct messages (e.g., from popup "apply now")
  chrome.runtime.onMessage.addListener(
    (msg: ExtMessage, _sender, sendResponse) => {
      if (msg.type === 'GET_SPEED') {
        sendResponse({ speed: getSpeed() })
      } else if (msg.type === 'SET_SPEED') {
        applySpeed(msg.value)
        sendResponse({ ok: true })
      }
    },
  )

  await initForPage()

  watchNavigation(async () => {
    // Brief pause for YouTube to swap the video element
    await new Promise((r) => setTimeout(r, 500))
    await initForPage()
  })
}

// Cleanup on tab unload to avoid dangling timers/observers
window.addEventListener('unload', () => {
  cleanupHotkeys?.()
  destroyOverlay()
  destroyButton()
})

init().catch(console.error)
