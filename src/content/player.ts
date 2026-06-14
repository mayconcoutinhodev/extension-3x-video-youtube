const SELECTOR = 'video.html5-main-video'

export function getVideo(): HTMLVideoElement | null {
  return document.querySelector<HTMLVideoElement>(SELECTOR)
}

export function setSpeed(speed: number): boolean {
  const video = getVideo()
  if (!video) return false
  video.playbackRate = Math.min(Math.max(speed, 0.1), 16)
  return true
}

export function getSpeed(): number {
  return getVideo()?.playbackRate ?? 1
}
