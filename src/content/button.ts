import type { SpeedPreset } from '../shared/types'

const BTN_ID = 'ytsc-btn'
const MENU_ID = 'ytsc-menu'

type SelectCb = (value: number) => void
let onSelect: SelectCb | null = null
let cachedSpeeds: SpeedPreset[] = []

const BTN_CSS = [
  'position:absolute',
  'bottom:200px',
  'right:12px',
  'background:rgba(0,0,0,0.68)',
  'color:#fff',
  'border:none',
  'border-radius:4px',
  'padding:3px 9px',
  'font-size:13px',
  'font-weight:600',
  'font-family:"YouTube Sans",Roboto,sans-serif',
  'cursor:pointer',
  'z-index:60',
  'min-width:44px',
  'text-align:center',
  'transition:background 0.12s',
  'line-height:1.6',
].join(';')

function getPlayerEl(): HTMLElement | null {
  return (
    document.querySelector<HTMLElement>('#movie_player') ??
    document.querySelector<HTMLElement>('.html5-video-player')
  )
}

function getOrCreateBtn(): HTMLButtonElement {
  let btn = document.getElementById(BTN_ID) as HTMLButtonElement | null
  if (!btn) {
    btn = document.createElement('button')
    btn.id = BTN_ID
    btn.style.cssText = BTN_CSS
    btn.addEventListener('mouseenter', () => { btn!.style.background = 'rgba(0,0,0,0.88)' })
    btn.addEventListener('mouseleave', () => { btn!.style.background = 'rgba(0,0,0,0.68)' })
    btn.addEventListener('click', (e) => {
      e.preventDefault()
      e.stopPropagation()
      toggleMenu()
    })

    const player = getPlayerEl()
    if (player) {
      if (getComputedStyle(player).position === 'static') {
        player.style.position = 'relative'
      }
      player.appendChild(btn)
    }
  }
  return btn
}

function buildMenu(speeds: SpeedPreset[], btn: HTMLButtonElement): HTMLDivElement {
  destroyMenu()
  const menu = document.createElement('div')
  menu.id = MENU_ID
  menu.style.cssText = [
    'position:absolute',
    'bottom:84px',
    'right:12px',
    'background:rgba(22,22,22,0.97)',
    'border:1px solid rgba(255,255,255,0.12)',
    'border-radius:6px',
    'padding:4px 0',
    'z-index:61',
    'min-width:88px',
    'box-shadow:0 6px 20px rgba(0,0,0,0.6)',
  ].join(';')

  const currentSpeed = parseFloat(btn.textContent?.replace('×', '') ?? '1')

  for (const preset of speeds) {
    const item = document.createElement('button')
    const active = preset.value === currentSpeed
    item.style.cssText = [
      'display:block',
      'width:100%',
      'padding:6px 16px',
      'background:none',
      'border:none',
      `color:${active ? '#ff0000' : '#fff'}`,
      'font-size:13px',
      'font-family:"YouTube Sans",Roboto,sans-serif',
      'cursor:pointer',
      'text-align:center',
      'white-space:nowrap',
    ].join(';')
    item.textContent = `${preset.value}×`
    if (active) item.style.fontWeight = '700'
    item.addEventListener('mouseenter', () => { item.style.background = 'rgba(255,255,255,0.08)' })
    item.addEventListener('mouseleave', () => { item.style.background = 'none' })
    item.addEventListener('click', (e) => {
      e.stopPropagation()
      onSelect?.(preset.value)
      destroyMenu()
    })
    menu.appendChild(item)
  }

  btn.parentElement?.appendChild(menu)

  const close = (e: MouseEvent) => {
    if (!menu.contains(e.target as Node) && e.target !== btn) {
      destroyMenu()
      document.removeEventListener('click', close, true)
    }
  }
  setTimeout(() => document.addEventListener('click', close, true), 0)

  return menu
}

function toggleMenu(): void {
  if (document.getElementById(MENU_ID)) {
    destroyMenu()
    return
  }
  const btn = document.getElementById(BTN_ID) as HTMLButtonElement | null
  if (btn) buildMenu(cachedSpeeds, btn)
}

function destroyMenu(): void {
  document.getElementById(MENU_ID)?.remove()
}

export function updateButton(speed: number, speeds: SpeedPreset[]): void {
  cachedSpeeds = speeds
  const btn = getOrCreateBtn()
  btn.textContent = `${speed}×`
}

export function setSelectCallback(cb: SelectCb): void {
  onSelect = cb
}

export function destroyButton(): void {
  destroyMenu()
  document.getElementById(BTN_ID)?.remove()
}
