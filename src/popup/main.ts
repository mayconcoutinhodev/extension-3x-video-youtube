import { loadSettings } from '../shared/storage'
import type { Settings, ExtMessage } from '../shared/types'

let settings: Settings | null = null
let activeSpeed: number | null = null
let isYouTubeTab = false

async function init(): Promise<void> {
  settings = await loadSettings()
  await fetchCurrentSpeed()
  render()
}

async function fetchCurrentSpeed(): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id || !tab.url?.includes('youtube.com')) return
    isYouTubeTab = true
    const res = await chrome.tabs.sendMessage(tab.id, { type: 'GET_SPEED' } as ExtMessage)
    if (typeof res?.speed === 'number') activeSpeed = res.speed
  } catch {
    /* content script not ready */
  }
}

async function applySpeed(speed: number): Promise<void> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
    if (!tab?.id) return
    await chrome.tabs.sendMessage(tab.id, { type: 'SET_SPEED', value: speed } as ExtMessage)
    activeSpeed = speed
    renderSpeedDisplay()
    renderGrid()
  } catch {
    /* ignore */
  }
}

function openOptions(): void {
  chrome.runtime.openOptionsPage()
}

// ─── Render ────────────────────────────────────────────────────────────────────

function render(): void {
  const app = document.getElementById('app')!
  app.innerHTML = `
    ${buildHeader()}
    ${buildSpeedDisplay()}
    ${buildGrid()}
    ${buildFooter()}
  `
  bindEvents()
}

function renderSpeedDisplay(): void {
  const el = document.getElementById('speed-display')
  if (el) el.innerHTML = speedDisplayHTML()
}

function renderGrid(): void {
  const el = document.getElementById('speed-grid')
  if (el) el.innerHTML = gridHTML()
}

function speedDisplayHTML(): string {
  if (!isYouTubeTab) {
    return `<span style="font-size:13px;color:#555">Abra o YouTube</span>`
  }
  if (activeSpeed === null) {
    return `<span style="font-size:13px;color:#555">Nenhum vídeo</span>`
  }
  return `<span style="font-size:42px;font-weight:700;letter-spacing:-1px;color:#fff">${activeSpeed}<span style="font-size:22px;color:#888;font-weight:400">×</span></span>`
}

function gridHTML(): string {
  if (!settings) return ''
  return settings.speeds
    .map((s) => {
      const active = activeSpeed === s.value
      return `<button
        class="speed-btn${active ? ' active' : ''}"
        data-speed="${s.value}"
      >${s.value}×</button>`
    })
    .join('')
}

function buildHeader(): string {
  return `
    <div style="
      display:flex;align-items:center;justify-content:space-between;
      padding:12px 14px 10px;border-bottom:1px solid #1c1c1c
    ">
      <span style="font-weight:700;font-size:13px;color:#ccc;letter-spacing:0.01em">
        ⚡ YT Speed
      </span>
      <button
        id="btn-settings"
        title="Abrir configurações"
        style="background:none;border:none;cursor:pointer;color:#555;font-size:16px;
               padding:2px 4px;border-radius:4px;transition:color 0.12s;line-height:1"
      >⚙</button>
    </div>`
}

function buildSpeedDisplay(): string {
  return `
    <div style="
      display:flex;flex-direction:column;align-items:center;justify-content:center;
      padding:20px 0 14px;gap:4px
    ">
      <div id="speed-display" style="min-height:52px;display:flex;align-items:center">
        ${speedDisplayHTML()}
      </div>
      ${isYouTubeTab ? `<span style="font-size:10px;color:#383838">velocidade atual</span>` : ''}
    </div>`
}

function buildGrid(): string {
  return `
    <div
      id="speed-grid"
      style="
        display:grid;grid-template-columns:repeat(4,1fr);
        gap:5px;padding:0 12px 14px
      "
    >${gridHTML()}</div>`
}

function buildFooter(): string {
  return `
    <div style="
      border-top:1px solid #1c1c1c;padding:9px 14px;
      display:flex;align-items:center;justify-content:center
    ">
      <button
        id="btn-open-options"
        style="background:none;border:none;cursor:pointer;
               color:#444;font-size:11px;font-family:inherit;
               transition:color 0.12s;padding:2px 6px;border-radius:3px"
      >Configurações avançadas →</button>
    </div>`
}

// ─── Events ────────────────────────────────────────────────────────────────────

function bindEvents(): void {
  document.getElementById('btn-settings')?.addEventListener('click', openOptions)
  document.getElementById('btn-open-options')?.addEventListener('click', openOptions)

  document.getElementById('speed-grid')?.addEventListener('click', async (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLElement>('[data-speed]')
    if (!btn) return
    const speed = parseFloat(btn.dataset.speed!)
    if (!isNaN(speed)) await applySpeed(speed)
  })
}

init().catch(console.error)
