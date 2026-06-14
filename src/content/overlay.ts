const OVERLAY_ID = 'ytsc-overlay'
const DISPLAY_MS = 1500

let hideTimer: ReturnType<typeof setTimeout> | null = null

function getPlayerRect(): DOMRect | null {
  const player =
    document.querySelector<HTMLElement>('#movie_player') ??
    document.querySelector<HTMLElement>('.html5-video-player')
  return player?.getBoundingClientRect() ?? null
}

function getOrCreate(): HTMLDivElement {
  let el = document.getElementById(OVERLAY_ID) as HTMLDivElement | null
  if (!el) {
    el = document.createElement('div')
    el.id = OVERLAY_ID
    el.style.cssText = [
      'position:fixed',
      'background:rgba(0,0,0,0.72)',
      'color:#fff',
      'font-size:2rem',
      'font-weight:700',
      'font-family:"YouTube Sans",Roboto,sans-serif',
      'padding:10px 22px',
      'border-radius:8px',
      'pointer-events:none',
      'z-index:2147483647',
      'opacity:0',
      'transition:opacity 0.12s ease',
      'user-select:none',
      'letter-spacing:0.02em',
    ].join(';')
    document.body.appendChild(el)
  }
  return el
}

function positionOverlay(el: HTMLDivElement): void {
  const rect = getPlayerRect()
  if (!rect) {
    el.style.top = '50%'
    el.style.left = '50%'
    el.style.transform = 'translate(-50%,-50%)'
    return
  }
  const cx = rect.left + rect.width / 2
  const cy = rect.top + rect.height / 2
  el.style.top = `${cy}px`
  el.style.left = `${cx}px`
  el.style.transform = 'translate(-50%,-50%)'
}

export function showSpeedOverlay(speed: number): void {
  const el = getOrCreate()
  el.textContent = `${speed}×`
  positionOverlay(el)
  el.style.opacity = '1'

  if (hideTimer) clearTimeout(hideTimer)
  hideTimer = setTimeout(() => {
    el.style.opacity = '0'
    hideTimer = null
  }, DISPLAY_MS)
}

export function destroyOverlay(): void {
  if (hideTimer) {
    clearTimeout(hideTimer)
    hideTimer = null
  }
  document.getElementById(OVERLAY_ID)?.remove()
}
