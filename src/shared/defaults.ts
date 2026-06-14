import type { Settings } from './types'

export const DEFAULT_SETTINGS: Settings = {
  speeds: [
    { id: 's1', value: 0.5 },
    { id: 's2', value: 0.75 },
    { id: 's3', value: 1 },
    { id: 's4', value: 1.15 },
    { id: 's5', value: 1.25 },
    { id: 's6', value: 1.35 },
    { id: 's7', value: 1.5 },
    { id: 's8', value: 1.75 },
    { id: 's9', value: 2 },
    { id: 's10', value: 2.3 },
    { id: 's11', value: 3 },
  ],
  hotkeys: [
    {
      id: 'h1',
      key: '1',
      modifiers: { alt: true, ctrl: false, shift: false },
      action: 1,
    },
    {
      id: 'h2',
      key: '2',
      modifiers: { alt: true, ctrl: false, shift: false },
      action: 1.5,
    },
    {
      id: 'h3',
      key: '3',
      modifiers: { alt: true, ctrl: false, shift: false },
      action: 2,
    },
    {
      id: 'h4',
      key: '[',
      modifiers: { alt: false, ctrl: false, shift: false },
      action: 'prev',
    },
    {
      id: 'h5',
      key: ']',
      modifiers: { alt: false, ctrl: false, shift: false },
      action: 'next',
    },
  ],
  showOverlay: true,
  rememberLastSpeed: true,
  lastSpeed: 1,
  autoApplyEnabled: false,
  autoApplyValue: 1,
}
