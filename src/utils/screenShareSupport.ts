import { LocalVideoTrack, Track, type Room, type ScreenShareCaptureOptions } from 'livekit-client'

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

export function hasDisplayMediaApi(): boolean {
  return Boolean(
    typeof navigator !== 'undefined' && navigator.mediaDevices?.getDisplayMedia,
  )
}

export function getScreenShareUnsupportedMessage(): string | null {
  if (hasDisplayMediaApi()) return null
  if (isIosPhoneOrTablet()) {
    return 'Screen sharing is not available on iPhone/iPad in the browser. Use Android Chrome or a laptop.'
  }
  return 'Screen sharing is not supported in this browser. Try Chrome on Android or a computer.'
}

function mobileScreenShareAttempts(): ScreenShareCaptureOptions[] {
  return [
    {
      audio: false,
      preferCurrentTab: true,
      resolution: { width: 1280, height: 720, frameRate: 15 },
    },
    {
      audio: false,
      resolution: { width: 640, height: 360, frameRate: 15 },
    },
    { audio: false, video: true },
    { audio: false },
  ]
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

async function publishDisplayMediaManually(room: Room) {
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: true,
    audio: false,
  })

  const mediaTrack = stream.getVideoTracks()[0]
  if (!mediaTrack) {
    stream.getTracks().forEach((track) => track.stop())
    throw new Error('No screen video track returned.')
  }

  const localTrack = new LocalVideoTrack(mediaTrack, undefined, false)
  localTrack.source = Track.Source.ScreenShare

  await room.localParticipant.publishTrack(localTrack, {
    source: Track.Source.ScreenShare,
    simulcast: false,
  })

  mediaTrack.addEventListener(
    'ended',
    () => {
      void room.localParticipant.setScreenShareEnabled(false)
    },
    { once: true },
  )
}

/** Try several capture profiles; mobile browsers reject many desktop-only options. */
export async function enableScreenShare(room: Room) {
  const unsupported = getScreenShareUnsupportedMessage()
  if (unsupported) {
    throw new Error(unsupported)
  }

  const attempts = isMobileBrowser()
    ? mobileScreenShareAttempts()
    : desktopScreenShareAttempts()

  let lastError: unknown
  for (const options of attempts) {
    try {
      await room.localParticipant.setScreenShareEnabled(true, options)
      return
    } catch (error) {
      lastError = error
    }
  }

  if (isMobileBrowser()) {
    try {
      await publishDisplayMediaManually(room)
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
  if (message.includes('not available on iphone') || message.includes('not supported in this browser')) {
    return error instanceof Error ? error.message : 'Screen sharing is not supported on this device.'
  }
  if (message.includes('notallowed') || message.includes('permission') || message.includes('cancel')) {
    return 'Screen share was cancelled or blocked.'
  }
  if (isMobileBrowser()) {
    return 'Screen share failed. On Android use Chrome, pick “Share screen” or “This tab”, and allow permission.'
  }
  return 'Screen share failed. Try again or use Chrome.'
}
