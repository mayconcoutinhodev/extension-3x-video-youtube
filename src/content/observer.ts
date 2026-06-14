export function watchNavigation(onNavigate: () => void): () => void {
  // YouTube fires this on every SPA page change after content loads
  const ytHandler = () => onNavigate()
  document.addEventListener('yt-navigate-finish', ytHandler)

  // Fallback: intercept History API for browsers/cases where the event isn't fired
  const originalPushState = history.pushState.bind(history)
  history.pushState = function (...args: Parameters<typeof history.pushState>) {
    originalPushState(...args)
    // Delay slightly so YouTube can start loading the new video element
    setTimeout(onNavigate, 300)
  }

  return () => {
    document.removeEventListener('yt-navigate-finish', ytHandler)
    history.pushState = originalPushState
  }
}

export function waitForVideo(timeoutMs = 6000): Promise<HTMLVideoElement> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector<HTMLVideoElement>('video.html5-main-video')
    if (existing && existing.readyState > 0) {
      resolve(existing)
      return
    }

    const deadline = setTimeout(() => {
      observer.disconnect()
      reject(new Error('Timeout waiting for video'))
    }, timeoutMs)

    const observer = new MutationObserver(() => {
      const video = document.querySelector<HTMLVideoElement>('video.html5-main-video')
      if (video) {
        clearTimeout(deadline)
        observer.disconnect()
        resolve(video)
      }
    })

    // Watch only the player container when available, else the full body
    const target =
      document.querySelector('#movie_player') ??
      document.querySelector('ytd-app') ??
      document.body

    observer.observe(target, { childList: true, subtree: true })
  })
}
