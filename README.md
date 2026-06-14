# YT Speed Control

Advanced custom video speed control for YouTube — Chrome, Edge, Brave, Firefox.

## Features

- Floating button on the YouTube player showing current speed (click to open speed menu)
- Custom speed presets — add, remove, drag to reorder
- Keyboard shortcuts — fully configurable
- Overlay display when speed changes
- Remember last speed or auto-apply a fixed speed to every video
- Works across multiple YouTube tabs simultaneously
- SPA-aware: detects video changes without page reload

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Generate icons

```bash
# Requires the canvas package
npm install -D canvas
node scripts/generate-icons.mjs
```

Or place your own `icon16.png`, `icon48.png`, `icon128.png` in `public/icons/`.

> The extension works without icons — Chrome will show a grey placeholder.

### 3. Build

```bash
npm run build
```

Output is in `dist/`.

### 4. Load in Chrome / Edge / Brave

1. Open `chrome://extensions` (or `edge://extensions`)
2. Enable **Developer mode** (top-right toggle)
3. Click **Load unpacked**
4. Select the `dist/` folder

### 5. Load in Firefox

```bash
# Install web-ext for Firefox testing
npm install -D web-ext
npx web-ext run --source-dir dist --target firefox-desktop
```

---

## Development

```bash
npm run dev   # watch mode — rebuilds on file changes
```

Then reload the extension in the browser after each rebuild.

---

## Default Hotkeys

| Shortcut | Action       |
|----------|-------------|
| `Alt+1`  | Speed 1×    |
| `Alt+2`  | Speed 1.5×  |
| `Alt+3`  | Speed 2×    |
| `[`      | Previous preset |
| `]`      | Next preset |

All hotkeys are configurable in the popup → Hotkeys tab.

---

## Project Structure

```
src/
  shared/
    types.ts        — TypeScript interfaces
    defaults.ts     — Default speed presets & hotkeys
    storage.ts      — chrome.storage.local wrapper
  background/
    index.ts        — Minimal MV3 service worker
  content/
    index.ts        — Entry point, orchestrates all modules
    player.ts       — Get/set video playbackRate
    observer.ts     — SPA navigation watcher + video detection
    overlay.ts      — On-screen speed indicator
    button.ts       — Floating speed button & menu
    hotkeys.ts      — Keyboard shortcut handler
  popup/
    index.html      — Popup shell
    main.ts         — Popup UI (vanilla TS)
    style.css       — Tailwind + custom styles
```

## Tech Stack

- TypeScript 5
- Vite 5 + vite-plugin-web-extension
- Tailwind CSS 3
- Manifest V3
- No runtime dependencies
