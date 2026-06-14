export interface SpeedPreset {
  id: string
  value: number
}

export interface HotkeyModifiers {
  alt: boolean
  ctrl: boolean
  shift: boolean
}

export interface Hotkey {
  id: string
  modifiers: HotkeyModifiers
  key: string
  action: number | 'next' | 'prev' | 'reset'
}

export interface Settings {
  speeds: SpeedPreset[]
  hotkeys: Hotkey[]
  showOverlay: boolean
  rememberLastSpeed: boolean
  lastSpeed: number
  autoApplyEnabled: boolean
  autoApplyValue: number
}

export type SpeedAction = number | 'next' | 'prev' | 'reset'

export type ExtMessage =
  | { type: 'GET_SPEED' }
  | { type: 'SET_SPEED'; value: number }
  | { type: 'SETTINGS_UPDATED'; settings: Settings }
