import { type Room, type ScreenShareCaptureOptions } from 'livekit-client'

export function isIosPhoneOrTablet(): boolean {
  if (typeof navigator === 'undefined') return false
  return /iPhone|iPad|iPod/i.test(navigator.userAgent)
}

export function isAndroid(): boolean {
  if (typeof navigator === 'undefined') return false
  return /Android/i.test(navigator.userAgent)
}

export function isMobileBrowser(): boolean {
  return isIosPhoneOrTablet() || isAndroid()
}

/** Screen share is desktop-only in v1 — mobile browsers are unreliable. */
export function canOfferScreenShare(): boolean {
  if (isMobileBrowser()) return false
  return Boolean(
    typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia,
  )
}

function desktopScreenShareAttempts(): ScreenShareCaptureOptions[] {
  return [
    {
      audio: false,
      selfBrowserSurface: 'include',
      surfaceSwitching: 'include',
    },
    { audio: false },
  ]
}

export async function enableScreenShare(room: Room) {
  if (!canOfferScreenShare()) {
    throw new Error('Screen sharing is only available on desktop for now.')
  }

  let lastError: unknown
  for (const options of desktopScreenShareAttempts()) {
    try {
      await room.localParticipant.setScreenShareEnabled(true, options)
      return
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Could not start screen sharing.')
}

export async function disableScreenShare(room: Room) {
  await room.localParticipant.setScreenShareEnabled(false)
}

export function screenShareErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message.toLowerCase() : ''
  if (message.includes('only available on desktop')) {
    return 'Screen sharing is only available on desktop for now.'
  }
  if (message.includes('notallowed') || message.includes('permission') || message.includes('cancel')) {
    return 'Screen share was cancelled or blocked.'
  }
  return 'Screen share failed. Try again or use Chrome.'
}
