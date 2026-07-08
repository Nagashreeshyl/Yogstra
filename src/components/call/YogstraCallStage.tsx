import type { ReactNode } from 'react'
import { ParticipantTile, isTrackReference, useLocalParticipant, useRemoteParticipants, useTracks } from '@livekit/components-react'
import { Track } from 'livekit-client'
import { CallCameraOffPlaceholder } from './CallCameraOffPlaceholder'
import {
  findCameraTrack,
  isLiveVideoTrack,
  participantMicMuted,
} from './callTrackUtils'

type YogstraCallStageProps = {
  otherName: string
  waitingOverlay?: ReactNode
  remoteAway?: boolean
}

export function YogstraCallStage({ otherName, waitingOverlay, remoteAway = false }: YogstraCallStageProps) {
  const { localParticipant } = useLocalParticipant()
  const remoteParticipants = useRemoteParticipants()
  const remoteParticipant = remoteParticipants[0]

  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  const localIdentity = localParticipant.identity
  const localCamera = findCameraTrack(tracks, localIdentity)
  const remoteCamera = remoteParticipant
    ? findCameraTrack(tracks, remoteParticipant.identity)
    : undefined

  const remoteScreenShare = remoteParticipant
    ? tracks.find(
        (track) =>
          track.participant.identity === remoteParticipant.identity &&
          track.source === Track.Source.ScreenShare &&
          isLiveVideoTrack(track),
      )
    : undefined

  const localScreenShare = tracks.find(
    (track) =>
      track.participant.identity === localIdentity &&
      track.source === Track.Source.ScreenShare &&
      isLiveVideoTrack(track),
  )

  const peerConnected = Boolean(remoteParticipant)
  const mainIsRemote = peerConnected && !localScreenShare
  const mainScreenShare = remoteScreenShare ?? localScreenShare

  const remoteCameraOn = isLiveVideoTrack(remoteCamera)
  const localCameraOn = isLiveVideoTrack(localCamera)

  let mainContent: ReactNode

  if (mainScreenShare && isTrackReference(mainScreenShare)) {
    mainContent = (
      <ParticipantTile trackRef={mainScreenShare} className="yogstra-call-video-tile" />
    )
  } else if (peerConnected) {
    mainContent =
      remoteCameraOn && remoteCamera && isTrackReference(remoteCamera) ? (
        <ParticipantTile trackRef={remoteCamera} className="yogstra-call-video-tile" />
      ) : (
        <CallCameraOffPlaceholder
          name={otherName}
          micMuted={participantMicMuted(remoteParticipant)}
          away={remoteAway}
          size="main"
        />
      )
  } else if (localCameraOn && localCamera && isTrackReference(localCamera)) {
    mainContent = (
      <ParticipantTile
        trackRef={localCamera}
        className="yogstra-call-video-tile yogstra-call-self-main"
      />
    )
  } else {
    mainContent = (
      <CallCameraOffPlaceholder
        name={localParticipant.name || 'You'}
        isLocal
        micMuted={participantMicMuted(localParticipant)}
        size="main"
      />
    )
  }

  const showLocalPip =
    peerConnected &&
    !localScreenShare &&
    (mainIsRemote || !remoteCameraOn)

  return (
    <div className="yogstra-call-stage">
      <div className="yogstra-call-main">{mainContent}</div>

      {waitingOverlay}

      {showLocalPip && (
        <div className="yogstra-call-pip">
          {localCameraOn && localCamera && isTrackReference(localCamera) ? (
            <ParticipantTile trackRef={localCamera} className="yogstra-call-video-tile yogstra-call-pip-tile" />
          ) : (
            <CallCameraOffPlaceholder
              name={localParticipant.name || 'You'}
              isLocal
              micMuted={participantMicMuted(localParticipant)}
              size="pip"
            />
          )}
        </div>
      )}
    </div>
  )
}
