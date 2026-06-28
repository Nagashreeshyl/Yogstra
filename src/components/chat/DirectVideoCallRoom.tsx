import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useRoomContext,
  useTrackToggle,
  useTracks,
} from '@livekit/components-react'
import '@livekit/components-styles'
import {
  Loader2,
  Mic,
  MicOff,
  MonitorUp,
  PhoneOff,
  SwitchCamera,
  Video,
  VideoOff,
} from 'lucide-react'
import {
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
} from 'livekit-client'
import { ClassRoomAudioSetup } from '../classes/ClassRoomAudioSetup'
import {
  fetchDirectVideoCall,
  fetchLiveKitToken,
  subscribeToDirectVideoCallById,
  updateDirectVideoCallStatus,
  type DirectVideoCall,
  type DirectVideoCallStatus,
} from '../../services/directVideoCalls'

const TERMINAL_STATUSES: DirectVideoCallStatus[] = ['ended', 'declined', 'missed']
const CONTROL_BAR_HEIGHT = '6.5rem'

interface DirectVideoCallRoomProps {
  call: DirectVideoCall
  participantName: string
  participantId: string
  otherName: string
  ringing?: boolean
  onLeave: () => void
  onRemoteEnd?: (status: DirectVideoCallStatus) => void
}

function DirectCallMediaBootstrap() {
  const room = useRoomContext()

  useEffect(() => {
    const publishLocal = async () => {
      try {
        await room.localParticipant.setMicrophoneEnabled(true)
        await room.localParticipant.setCameraEnabled(true)
      } catch {
        /* permissions may be denied */
      }
    }

    const subscribeParticipant = (participant: RemoteParticipant) => {
      participant.trackPublications.forEach((publication) => {
        if (
          publication instanceof RemoteTrackPublication &&
          (publication.kind === Track.Kind.Audio || publication.kind === Track.Kind.Video)
        ) {
          void publication.setSubscribed(true)
        }
      })
    }

    const subscribeAll = () => {
      room.remoteParticipants.forEach(subscribeParticipant)
    }

    void publishLocal()
    subscribeAll()

    const onConnected = () => {
      void publishLocal()
      subscribeAll()
    }

    const onTrackPublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (publication.kind === Track.Kind.Audio || publication.kind === Track.Kind.Video) {
        void publication.setSubscribed(true)
      }
      subscribeParticipant(participant)
    }

    room.on(RoomEvent.Connected, onConnected)
    room.on(RoomEvent.ParticipantConnected, subscribeParticipant)
    room.on(RoomEvent.TrackPublished, onTrackPublished)

    return () => {
      room.off(RoomEvent.Connected, onConnected)
      room.off(RoomEvent.ParticipantConnected, subscribeParticipant)
      room.off(RoomEvent.TrackPublished, onTrackPublished)
    }
  }, [room])

  return null
}

function DirectCallRemoteWatcher({
  callId,
  onRemoteEnd,
}: {
  callId: string
  onRemoteEnd: (status: DirectVideoCallStatus) => void
}) {
  const room = useRoomContext()
  const handledRef = useRef(false)
  const onRemoteEndRef = useRef(onRemoteEnd)
  onRemoteEndRef.current = onRemoteEnd

  useEffect(() => {
    handledRef.current = false

    const maybeEnd = (status: DirectVideoCallStatus) => {
      if (handledRef.current || !TERMINAL_STATUSES.includes(status)) return
      handledRef.current = true
      room.disconnect()
      onRemoteEndRef.current(status)
    }

    const unsub = subscribeToDirectVideoCallById(callId, (call) => {
      maybeEnd(call.status)
    })

    void fetchDirectVideoCall(callId).then((call) => {
      if (call) maybeEnd(call.status)
    })

    return unsub
  }, [callId, room])

  return null
}

function DirectCallHeader({ otherName, ringing }: { otherName: string; ringing?: boolean }) {
  return (
    <div className="dm-call-header">
      <p className="text-cream text-sm font-semibold truncate">{otherName}</p>
      <p className="text-cream/50 text-xs">{ringing ? 'Calling…' : 'Video call'}</p>
    </div>
  )
}

function DirectCallStage({ otherName }: { otherName: string }) {
  const { localParticipant } = useLocalParticipant()
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: true },
    ],
    { onlySubscribed: false },
  )

  const localIdentity = localParticipant.identity
  const remoteTracks = tracks.filter((track) => track.participant.identity !== localIdentity)
  const localCamera = tracks.find(
    (track) =>
      track.participant.identity === localIdentity && track.source === Track.Source.Camera,
  )

  const remoteMain =
    remoteTracks.find((track) => track.source === Track.Source.ScreenShare) ??
    remoteTracks.find((track) => track.source === Track.Source.Camera)

  return (
    <div className="dm-call-stage">
      {remoteMain ? (
        <ParticipantTile trackRef={remoteMain} className="dm-call-remote-tile" />
      ) : (
        <div className="dm-call-waiting">
          <p className="text-cream/70 text-base">Waiting for {otherName}…</p>
        </div>
      )}

      {localCamera && (
        <div className="dm-call-pip">
          <ParticipantTile trackRef={localCamera} className="dm-call-pip-tile" />
        </div>
      )}
    </div>
  )
}

function DirectCallControlBar({
  ringing,
  onEnd,
}: {
  ringing?: boolean
  onEnd: () => void
}) {
  const room = useRoomContext()
  const mic = useTrackToggle({ source: Track.Source.Microphone })
  const camera = useTrackToggle({ source: Track.Source.Camera })
  const screenShare = useTrackToggle({ source: Track.Source.ScreenShare })
  const [busy, setBusy] = useState<'flip' | null>(null)

  const flipCamera = async () => {
    if (busy) return
    setBusy('flip')
    try {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
      const videoTrack = publication?.videoTrack
      const facing = videoTrack?.mediaStreamTrack.getSettings().facingMode

      if (facing === 'user' || facing === 'environment') {
        await room.localParticipant.setCameraEnabled(true, {
          facingMode: facing === 'user' ? 'environment' : 'user',
        })
        return
      }

      const devices = await Room.getLocalDevices('videoinput')
      if (devices.length < 2) return

      const activeId = room.getActiveDevice('videoinput')
      const currentIndex = devices.findIndex((device) => device.deviceId === activeId)
      const nextDevice = devices[(currentIndex + 1) % devices.length]
      await room.switchActiveDevice('videoinput', nextDevice.deviceId)
    } catch {
      /* device switch unsupported */
    } finally {
      setBusy(null)
    }
  }

  const handleEnd = () => {
    room.disconnect()
    onEnd()
  }

  return (
    <div className="dm-call-controls" style={{ ['--dm-control-bar-height' as string]: CONTROL_BAR_HEIGHT }}>
      <button
        type="button"
        aria-label={mic.enabled ? 'Mute microphone' : 'Unmute microphone'}
        aria-pressed={!mic.enabled}
        disabled={mic.pending}
        onClick={() => void mic.toggle()}
        className="dm-call-control-btn"
      >
        {mic.enabled ? <Mic size={22} /> : <MicOff size={22} />}
      </button>

      <button
        type="button"
        aria-label={camera.enabled ? 'Turn camera off' : 'Turn camera on'}
        aria-pressed={!camera.enabled}
        disabled={camera.pending}
        onClick={() => void camera.toggle()}
        className="dm-call-control-btn"
      >
        {camera.enabled ? <Video size={22} /> : <VideoOff size={22} />}
      </button>

      <button
        type="button"
        aria-label={ringing ? 'Cancel call' : 'End call'}
        onClick={handleEnd}
        className="dm-call-control-btn dm-call-end-btn"
      >
        <PhoneOff size={26} />
      </button>

      <button
        type="button"
        aria-label="Switch camera"
        disabled={busy === 'flip'}
        onClick={() => void flipCamera()}
        className="dm-call-control-btn"
      >
        <SwitchCamera size={22} />
      </button>

      <button
        type="button"
        aria-label={screenShare.enabled ? 'Stop sharing screen' : 'Share screen'}
        aria-pressed={screenShare.enabled}
        disabled={screenShare.pending}
        onClick={() => void screenShare.toggle()}
        className={`dm-call-control-btn${screenShare.enabled ? ' dm-call-control-btn-active' : ''}`}
      >
        <MonitorUp size={22} />
      </button>
    </div>
  )
}

function DirectCallExperience({
  call,
  otherName,
  ringing,
  onEnd,
  onRemoteEnd,
}: {
  call: DirectVideoCall
  otherName: string
  ringing?: boolean
  onEnd: () => void
  onRemoteEnd: (status: DirectVideoCallStatus) => void
}) {
  return (
    <>
      <DirectCallRemoteWatcher callId={call.id} onRemoteEnd={onRemoteEnd} />
      <DirectCallMediaBootstrap />
      <RoomAudioRenderer />
      <ClassRoomAudioSetup />
      <DirectCallHeader otherName={otherName} ringing={ringing} />
      <DirectCallStage otherName={otherName} />
      <DirectCallControlBar ringing={ringing} onEnd={onEnd} />
    </>
  )
}

export function DirectVideoCallRoom({
  call,
  participantName,
  participantId,
  otherName,
  ringing = false,
  onLeave,
  onRemoteEnd,
}: DirectVideoCallRoomProps) {
  const [connectInfo, setConnectInfo] = useState<{ token: string; serverUrl: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const endHandledRef = useRef(false)
  const localEndRef = useRef(false)

  useEffect(() => {
    endHandledRef.current = false
    localEndRef.current = false
    setConnectInfo(null)
    setError(null)

    let cancelled = false
    void fetchLiveKitToken({
      roomName: call.roomName,
      participantName,
      participantId,
    })
      .then((info) => {
        if (!cancelled) setConnectInfo(info)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not join the call.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [call.id, call.roomName, participantName, participantId])

  const finishLeave = useCallback(
    (localEnd: boolean) => {
      if (endHandledRef.current) return
      endHandledRef.current = true
      localEndRef.current = localEnd

      if (localEnd) {
        void updateDirectVideoCallStatus(call.id, 'ended', {
          endedAt: new Date().toISOString(),
        }).finally(onLeave)
        return
      }
      onLeave()
    },
    [call.id, onLeave],
  )

  const handleRemoteEnd = useCallback(
    (status: DirectVideoCallStatus) => {
      if (!localEndRef.current) onRemoteEnd?.(status)
      finishLeave(false)
    },
    [finishLeave, onRemoteEnd],
  )

  if (error) {
    return (
      <div className="fixed inset-0 z-[200] bg-charcoal flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 bg-cream text-charcoal rounded-sm font-medium cursor-pointer"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (!connectInfo) {
    return (
      <div className="fixed inset-0 z-[200] bg-charcoal flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-teal" size={40} />
        <p className="text-cream/60 text-sm">Joining video call…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-charcoal dm-call-root">
      <LiveKitRoom
        key={call.id}
        token={connectInfo.token}
        serverUrl={connectInfo.serverUrl}
        connect
        video
        audio
        connectOptions={{ autoSubscribe: true }}
        options={{
          disconnectOnPageLeave: false,
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }}
        data-lk-theme="default"
        className="h-full w-full"
      >
        <DirectCallExperience
          call={call}
          otherName={otherName}
          ringing={ringing}
          onEnd={() => finishLeave(true)}
          onRemoteEnd={handleRemoteEnd}
        />
      </LiveKitRoom>
    </div>
  )
}
