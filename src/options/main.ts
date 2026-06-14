import { loadSettings, saveSettings } from '../shared/storage'
import { DEFAULT_SETTINGS } from '../shared/defaults'
import type { Settings, SpeedPreset, Hotkey } from '../shared/types'

// ─── State ────────────────────────────────────────────────────────────────────

let settings: Settings = structuredClone(DEFAULT_SETTINGS)
let recordingId: string | null = null
let dragSrcIdx: number | null = null
let toastTimer: ReturnType<typeof setTimeout> | null = null

// ─── Init ─────────────────────────────────────────────────────────────────────

async function init(): Promise<void> {
  settings = await loadSettings()
  render()
}

async function persist(): Promise<void> {
  await saveSettings(settings)
  showToast('Salvo')
}

function uid(): string {
  return Math.random().toString(36).slice(2, 9)
}

// ─── Toast ────────────────────────────────────────────────────────────────────

function showToast(msg: string): void {
  const el = document.getElementById('toast')
  if (!el) return
  el.textContent = msg
  el.classList.add('show')
  if (toastTimer) clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 1800)
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtSpeed(v: number): string {
  return `${v}×`
}

function modLabel(hk: Hotkey): string {
  const parts: string[] = []
  if (hk.modifiers.ctrl) parts.push('Ctrl')
  if (hk.modifiers.alt) parts.push('Alt')
  if (hk.modifiers.shift) parts.push('Shift')
  const key = hk.key === ' ' ? 'Space' : hk.key.length === 1 ? hk.key.toUpperCase() : hk.key
  parts.push(key)
  return parts.join(' + ')
}

function actionOptions(current: Hotkey['action']): string {
  const entries: Array<[string, string]> = [
    ['next', '→ Próximo preset'],
    ['prev', '← Preset anterior'],
    ['reset', '↺ Reset (1×)'],
    ...settings.speeds.map((s): [string, string] => [String(s.value), fmtSpeed(s.value)]),
  ]
  return entries
    .map(([v, label]) => `<option value="${v}" ${String(current) === v ? 'selected' : ''}>${label}</option>`)
    .join('')
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

function buildSpeedRows(): string {
  if (settings.speeds.length === 0) {
    return `<div style="padding:16px;text-align:center;color:#444;font-size:13px">Nenhuma velocidade. Adicione uma abaixo.</div>`
  }
  return settings.speeds
    .map(
      (s, i) => `
      <div class="speed-row" draggable="true" data-speed-idx="${i}" data-speed-id="${s.id}">
        <span class="drag-handle" title="Arrastar para reordenar">⠿</span>
        <span class="speed-value">${fmtSpeed(s.value)}</span>
        <button class="btn-icon" data-action="del-speed" data-id="${s.id}" title="Remover">✕</button>
      </div>`,
    )
    .join('')
}

function buildHotkeyRows(): string {
  if (settings.hotkeys.length === 0) {
    return `<div style="padding:16px;text-align:center;color:#444;font-size:13px">Nenhum atalho.</div>`
  }
  return settings.hotkeys
    .map(
      (hk) => `
      <div class="hotkey-row">
        <span
          class="key-chip${recordingId === hk.id ? ' recording' : ''}"
          data-action="record"
          data-id="${hk.id}"
          title="Clique para gravar novo atalho"
        >${recordingId === hk.id ? '⌨ Pressione…' : modLabel(hk)}</span>
        <span class="arrow-sep">→</span>
        <select data-action="hk-action" data-id="${hk.id}">${actionOptions(hk.action)}</select>
        <button class="btn-icon" data-action="del-hotkey" data-id="${hk.id}" title="Remover">✕</button>
      </div>`,
    )
    .join('')
}

function buildPage(): string {
  const toggle = (
    key: keyof Settings,
    label: string,
    desc: string,
    extraContent = '',
  ): string => {
    const checked = settings[key] as boolean
    return `
      <div class="setting-row">
        <div>
          <div class="setting-label">${label}</div>
          <div class="setting-desc">${desc}</div>
          ${extraContent}
        </div>
        <label class="toggle">
          <input type="checkbox" data-setting="${key}" ${checked ? 'checked' : ''} />
          <span class="toggle-track"></span>
          <span class="toggle-thumb"></span>
        </label>
      </div>`
  }

  const autoExtra = `
    <div style="margin-top:8px;display:flex;align-items:center;gap:8px;
                ${!settings.autoApplyEnabled ? 'opacity:0.35;pointer-events:none' : ''}">
      <span style="font-size:12px;color:#888">Velocidade:</span>
      <input
        type="number"
        data-setting="autoApplyValue"
        value="${settings.autoApplyValue}"
        min="0.1" max="16" step="0.05"
        style="width:80px"
        ${!settings.autoApplyEnabled ? 'disabled' : ''}
      />
    </div>`

  return `
    <div id="app-inner">

      <!-- Header -->
      <div class="page-header">
        <h1 class="page-title">⚡ YT <span>Speed</span> — Configurações</h1>
        <button class="btn btn-ghost" id="btn-reset-all" title="Restaurar todos os padrões">
          ↺ Padrões
        </button>
      </div>

      <!-- VELOCIDADES -->
      <section class="section">
        <div class="section-header">
          <span class="section-title">Velocidades</span>
          <span style="color:#3a3a3a;font-size:11px">(arraste para reordenar)</span>
        </div>
        <div class="card">
          <div id="speed-list">${buildSpeedRows()}</div>
          <div style="padding:10px 12px;border-top:1px solid var(--border);display:flex;gap:8px;align-items:center">
            <input
              type="number"
              id="new-speed"
              placeholder="ex: 1.75"
              min="0.1" max="16" step="0.05"
              style="width:110px"
            />
            <button class="btn btn-primary" data-action="add-speed">+ Adicionar</button>
            <button
              class="btn btn-ghost"
              data-action="reset-speeds"
              style="margin-left:auto;font-size:12px"
            >Restaurar</button>
          </div>
        </div>
      </section>

      <!-- ATALHOS -->
      <section class="section">
        <div class="section-header">
          <span class="section-title">Atalhos de Teclado</span>
        </div>
        <div class="card">
          <div id="hotkey-list">${buildHotkeyRows()}</div>
          <button class="btn-add" data-action="add-hotkey">+ Adicionar atalho</button>
        </div>
        <p style="margin-top:8px;font-size:12px;color:#444">
          Clique em um atalho para regravar. Teclas são capturadas antes do YouTube processar.
        </p>
      </section>

      <!-- GERAL -->
      <section class="section">
        <div class="section-header">
          <span class="section-title">Geral</span>
        </div>
        <div class="card">
          ${toggle('showOverlay', 'Mostrar overlay de velocidade', 'Exibe a velocidade brevemente ao centro do player ao trocar')}
          ${toggle('rememberLastSpeed', 'Lembrar última velocidade', 'Aplica automaticamente a última velocidade usada ao abrir um novo vídeo')}
          ${toggle('autoApplyEnabled', 'Aplicar velocidade fixa sempre', 'Ignora memória e aplica sempre a velocidade configurada abaixo', autoExtra)}
        </div>
      </section>

    </div>

    <div class="toast" id="toast"></div>
  `
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render(): void {
  const app = document.getElementById('app')!
  app.innerHTML = buildPage()
  bindEvents()
  bindDrag()
}

function rerenderSpeedList(): void {
  const el = document.getElementById('speed-list')
  if (el) el.innerHTML = buildSpeedRows()
  bindDrag()
}

function rerenderHotkeyList(): void {
  const el = document.getElementById('hotkey-list')
  if (el) el.innerHTML = buildHotkeyRows()
}

// ─── Events ───────────────────────────────────────────────────────────────────

function bindEvents(): void {
  const app = document.getElementById('app')!

  app.addEventListener('click', async (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-action]')
    if (!el) return
    const action = el.dataset.action!

    if (action === 'add-speed') {
      const input = document.getElementById('new-speed') as HTMLInputElement
      const val = Math.round(parseFloat(input.value) * 100) / 100
      if (isNaN(val) || val <= 0 || val > 16) return
      if (settings.speeds.some((s) => s.value === val)) return
      settings.speeds.push({ id: uid(), value: val })
      settings.speeds.sort((a, b) => a.value - b.value)
      input.value = ''
      await persist()
      rerenderSpeedList()
      return
    }

    if (action === 'del-speed') {
      settings.speeds = settings.speeds.filter((s) => s.id !== el.dataset.id)
      await persist()
      rerenderSpeedList()
      return
    }

    if (action === 'reset-speeds') {
      settings.speeds = structuredClone(DEFAULT_SETTINGS.speeds)
      await persist()
      rerenderSpeedList()
      return
    }

    if (action === 'add-hotkey') {
      const hk: Hotkey = {
        id: uid(),
        key: '?',
        modifiers: { alt: false, ctrl: false, shift: false },
        action: 'next',
      }
      settings.hotkeys.push(hk)
      await persist()
      recordingId = hk.id
      rerenderHotkeyList()
      startRecording(hk.id)
      return
    }

    if (action === 'del-hotkey') {
      settings.hotkeys = settings.hotkeys.filter((h) => h.id !== el.dataset.id)
      await persist()
      rerenderHotkeyList()
      return
    }

    if (action === 'record') {
      const id = el.dataset.id!
      if (recordingId === id) {
        recordingId = null
        rerenderHotkeyList()
        return
      }
      recordingId = id
      rerenderHotkeyList()
      startRecording(id)
      return
    }

    if (el.id === 'btn-reset-all') {
      if (!confirm('Restaurar todas as configurações para o padrão?')) return
      settings = structuredClone(DEFAULT_SETTINGS)
      await persist()
      render()
    }
  })

  app.addEventListener('change', async (e) => {
    const el = e.target as HTMLInputElement | HTMLSelectElement

    if (el.dataset.action === 'hk-action') {
      const hk = settings.hotkeys.find((h) => h.id === el.dataset.id)
      if (!hk) return
      const v = el.value
      hk.action = v === 'next' || v === 'prev' || v === 'reset' ? v : parseFloat(v)
      await persist()
      return
    }

    if (el.dataset.setting) {
      const key = el.dataset.setting as keyof Settings
      if (el.type === 'checkbox') {
        ;(settings as Record<string, unknown>)[key] = (el as HTMLInputElement).checked
      } else {
        const num = parseFloat(el.value)
        if (!isNaN(num)) (settings as Record<string, unknown>)[key] = num
      }
      await persist()
      // Re-render the settings section to update the auto-apply input enabled state
      if (key === 'autoApplyEnabled') render()
    }
  })

  // Enter key on speed input triggers add
  document.getElementById('new-speed')?.addEventListener('keydown', async (e) => {
    if (e.key === 'Enter') {
      const btn = document.querySelector<HTMLElement>('[data-action="add-speed"]')
      btn?.click()
    }
  })
}

// ─── Hotkey recording ─────────────────────────────────────────────────────────

function startRecording(id: string): void {
  const onKey = async (e: KeyboardEvent) => {
    e.preventDefault()
    e.stopImmediatePropagation()
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) return

    const hk = settings.hotkeys.find((h) => h.id === id)
    if (hk) {
      hk.key = e.key
      hk.modifiers = { alt: e.altKey, ctrl: e.ctrlKey, shift: e.shiftKey }
    }
    document.removeEventListener('keydown', onKey, true)
    cancelOutsideClick()
    recordingId = null
    await persist()
    rerenderHotkeyList()
  }

  document.addEventListener('keydown', onKey, { capture: true })

  const cancelOutsideClick = () => {
    document.removeEventListener('click', outsideClick, true)
  }
  const outsideClick = (e: MouseEvent) => {
    const chip = (e.target as HTMLElement).closest('[data-action="record"]')
    if (chip) return
    document.removeEventListener('keydown', onKey, true)
    cancelOutsideClick()
    recordingId = null
    rerenderHotkeyList()
  }
  setTimeout(() => document.addEventListener('click', outsideClick, { capture: true }), 80)
}

// ─── Drag-and-drop (speeds) ───────────────────────────────────────────────────

function bindDrag(): void {
  const list = document.getElementById('speed-list')
  if (!list) return

  list.addEventListener('dragstart', (e) => {
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-speed-idx]')
    if (!row) return
    dragSrcIdx = parseInt(row.dataset.speedIdx!)
    setTimeout(() => row.style.opacity = '0.35', 0)
  })

  list.addEventListener('dragend', () => {
    dragSrcIdx = null
    list.querySelectorAll<HTMLElement>('[data-speed-idx]').forEach((r) => {
      r.style.opacity = ''
      r.classList.remove('drag-over')
    })
  })

  list.addEventListener('dragover', (e) => {
    e.preventDefault()
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-speed-idx]')
    list.querySelectorAll<HTMLElement>('[data-speed-idx]').forEach((r) => r.classList.remove('drag-over'))
    if (row && dragSrcIdx !== null && parseInt(row.dataset.speedIdx!) !== dragSrcIdx) {
      row.classList.add('drag-over')
    }
  })

  list.addEventListener('drop', async (e) => {
    e.preventDefault()
    const row = (e.target as HTMLElement).closest<HTMLElement>('[data-speed-idx]')
    if (!row || dragSrcIdx === null) return
    const dest = parseInt(row.dataset.speedIdx!)
    if (dest === dragSrcIdx) return
    const [item] = settings.speeds.splice(dragSrcIdx, 1)
    settings.speeds.splice(dest, 0, item)
    dragSrcIdx = null
    await persist()
    rerenderSpeedList()
  })
}

// ─── Boot ─────────────────────────────────────────────────────────────────────

init().catch(console.error)
