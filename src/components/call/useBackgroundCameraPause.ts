import { useEffect, useRef } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { RoomEvent, Track } from 'livekit-client'

/**
 * Turns the camera off while the tab/app is in the background so the remote
 * participant sees a camera-off state instead of a frozen last frame.
 * Does not auto re-enable when returning — the user turns the camera back on.
 */
export function useBackgroundCameraPause() {
  const room = useRoomContext()
  const pausedByBackgroundRef = useRef(false)

  useEffect(() => {
    const pauseCameraForBackground = () => {
      if (document.visibilityState !== 'hidden') return

      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
      const cameraWasOn = Boolean(publication?.track && !publication.isMuted)
      if (!cameraWasOn) return

      pausedByBackgroundRef.current = true
      void room.localParticipant.setCameraEnabled(false)
    }

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        pauseCameraForBackground()
      }
    }

    document.addEventListener('visibilitychange', onVisibilityChange)
    window.addEventListener('pagehide', pauseCameraForBackground)

    room.on(RoomEvent.TrackMuted, (publication, participant) => {
      if (publication.source === Track.Source.Camera && participant.isLocal) {
        pausedByBackgroundRef.current = false
      }
    })

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange)
      window.removeEventListener('pagehide', pauseCameraForBackground)
    }
  }, [room])
}
