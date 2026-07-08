import { useEffect } from 'react'
import { useRoomContext } from '@livekit/components-react'
import { RoomEvent, Track, type RemoteParticipant, type RemoteTrackPublication } from 'livekit-client'
import { pinRemoteCameraQuality } from '../../utils/livekitVideoQuality'

function pinParticipantCameras(participant: RemoteParticipant) {
  participant.trackPublications.forEach((publication) => {
    pinRemoteCameraQuality(publication as RemoteTrackPublication)
  })
}

/** Request the highest simulcast layer for remote camera feeds. */
export function LiveKitVideoQualityBootstrap() {
  const room = useRoomContext()

  useEffect(() => {
    const onTrackPublished = (
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      if (participant.isLocal) return
      pinRemoteCameraQuality(publication)
      if (
        publication.kind === Track.Kind.Video &&
        publication.source === Track.Source.Camera &&
        !publication.isSubscribed
      ) {
        void publication.setSubscribed(true)
      }
    }

    room.remoteParticipants.forEach(pinParticipantCameras)
    room.on(RoomEvent.TrackPublished, onTrackPublished)
    room.on(RoomEvent.ParticipantConnected, pinParticipantCameras)

    return () => {
      room.off(RoomEvent.TrackPublished, onTrackPublished)
      room.off(RoomEvent.ParticipantConnected, pinParticipantCameras)
    }
  }, [room])

  return null
}
