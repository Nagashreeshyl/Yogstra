import {
  VideoPresets,
  VideoPresets43,
  type LocalVideoTrack,
  type Room,
  type RoomOptions,
  VideoQuality,
  Track,
  type RemoteTrackPublication,
} from 'livekit-client'

export type LiveKitVideoQuality = '480p' | '720p' | '1080p'

export const LIVEKIT_VIDEO_QUALITY_OPTIONS: LiveKitVideoQuality[] = ['480p', '720p', '1080p']

const STORAGE_KEY = 'yogstra:livekit-video-quality'

function videoPresetForQuality(quality: LiveKitVideoQuality) {
  switch (quality) {
    case '480p':
      return VideoPresets43.h480
    case '1080p':
      return VideoPresets.h1080
    case '720p':
    default:
      return VideoPresets.h720
  }
}

function readEnvDefaultQuality(): LiveKitVideoQuality {
  const raw = String(import.meta.env.VITE_LIVEKIT_VIDEO_QUALITY ?? '')
    .trim()
    .toLowerCase()
  if (raw === '480' || raw === '480p') return '480p'
  if (raw === '1080' || raw === '1080p') return '1080p'
  return '720p'
}

export function isLiveKitVideoQuality(value: string): value is LiveKitVideoQuality {
  return LIVEKIT_VIDEO_QUALITY_OPTIONS.includes(value as LiveKitVideoQuality)
}

export function getLiveKitVideoQuality(): LiveKitVideoQuality {
  if (typeof window === 'undefined') return readEnvDefaultQuality()
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY)
    if (saved && isLiveKitVideoQuality(saved)) return saved
  } catch {
    /* private mode */
  }
  return readEnvDefaultQuality()
}

export function saveLiveKitVideoQuality(quality: LiveKitVideoQuality) {
  try {
    window.localStorage.setItem(STORAGE_KEY, quality)
  } catch {
    /* private mode */
  }
}

export function buildLiveKitRoomOptions(
  quality: LiveKitVideoQuality = getLiveKitVideoQuality(),
): RoomOptions {
  const preset = videoPresetForQuality(quality)
  const simulcastLayers =
    quality === '1080p'
      ? [VideoPresets.h360, VideoPresets.h720, VideoPresets.h1080]
      : quality === '720p'
        ? [VideoPresets.h180, VideoPresets.h360, VideoPresets.h720]
        : [VideoPresets.h180, VideoPresets43.h480]

  return {
    dynacast: true,
    adaptiveStream: true,
    disconnectOnPageLeave: false,
    audioCaptureDefaults: {
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
    },
    videoCaptureDefaults: {
      facingMode: 'user',
      resolution: preset.resolution,
    },
    publishDefaults: {
      simulcast: true,
      videoCodec: 'h264',
      videoEncoding: preset.encoding,
      videoSimulcastLayers: simulcastLayers,
    },
  }
}

export function getLiveKitCameraCaptureOptions(quality = getLiveKitVideoQuality()) {
  const preset = videoPresetForQuality(quality)
  return {
    facingMode: 'user' as const,
    resolution: preset.resolution,
  }
}

export async function applyLiveKitVideoQuality(room: Room, quality: LiveKitVideoQuality) {
  saveLiveKitVideoQuality(quality)
  const capture = getLiveKitCameraCaptureOptions(quality)

  const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
  const videoTrack = publication?.videoTrack as LocalVideoTrack | undefined

  if (videoTrack) {
    await videoTrack.restartTrack(capture)
    return
  }

  await room.localParticipant.setCameraEnabled(true, capture)
}

export function pinRemoteCameraQuality(publication: RemoteTrackPublication) {
  if (publication.kind !== Track.Kind.Video || publication.source !== Track.Source.Camera) return
  void publication.setVideoQuality(VideoQuality.HIGH)
}
