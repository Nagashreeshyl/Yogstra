import { isTrackReference } from '@livekit/components-react'
import { Track, type Participant } from 'livekit-client'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'

export function isLiveVideoTrack(track: TrackReferenceOrPlaceholder | undefined) {
  if (!track || !isTrackReference(track)) return false
  const publication = track.publication
  if (!publication || publication.isMuted) return false
  return publication.isSubscribed || Boolean(publication.track)
}

export function findCameraTrack(
  tracks: TrackReferenceOrPlaceholder[],
  participantIdentity: string,
) {
  return tracks.find(
    (track) =>
      track.participant.identity === participantIdentity &&
      track.source === Track.Source.Camera,
  )
}

export function participantMicMuted(participant: Participant | undefined) {
  if (!participant) return false
  const publication = participant.getTrackPublication(Track.Source.Microphone)
  if (!publication) return true
  return publication.isMuted || !publication.track
}

export function initialsForName(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0] ?? ''}${parts[parts.length - 1][0] ?? ''}`.toUpperCase()
}
