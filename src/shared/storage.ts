import type { Settings } from './types'
import { DEFAULT_SETTINGS } from './defaults'

const KEY = 'yt_speed_settings'

export async function loadSettings(): Promise<Settings> {
  return new Promise((resolve) => {
    chrome.storage.local.get(KEY, (result) => {
      if (chrome.runtime.lastError || !result[KEY]) {
        resolve(structuredClone(DEFAULT_SETTINGS))
        return
      }
      // Merge with defaults to handle new fields added in updates
      resolve({ ...DEFAULT_SETTINGS, ...result[KEY] })
    })
  })
}

export async function saveSettings(settings: Settings): Promise<void> {
  return new Promise((resolve, reject) => {
    chrome.storage.local.set({ [KEY]: settings }, () => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError)
        return
      }
      resolve()
    })
  })
}

export async function patchSettings(patch: Partial<Settings>): Promise<void> {
  const current = await loadSettings()
  await saveSettings({ ...current, ...patch })
}

export function onSettingsChanged(callback: (settings: Settings) => void): () => void {
  const listener = (changes: Record<string, chrome.storage.StorageChange>) => {
    if (changes[KEY]?.newValue) {
      callback({ ...DEFAULT_SETTINGS, ...changes[KEY].newValue })
    }
  }
  chrome.storage.onChanged.addListener(listener)
  return () => chrome.storage.onChanged.removeListener(listener)
}
