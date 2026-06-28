import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
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
  TERMINAL_DIRECT_VIDEO_CALL_STATUSES,
  updateDirectVideoCallStatus,
  watchDirectVideoCallTerminalStatus,
  type DirectVideoCall,
  type DirectVideoCallStatus,
} from '../../services/directVideoCalls'

const TERMINAL_STATUSES = TERMINAL_DIRECT_VIDEO_CALL_STATUSES

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

    const endForRemote = (status: DirectVideoCallStatus) => {
      if (handledRef.current || !TERMINAL_STATUSES.includes(status)) return
      handledRef.current = true
      room.disconnect()
      onRemoteEndRef.current(status)
    }

    const unsubWatch = watchDirectVideoCallTerminalStatus(callId, endForRemote)

    const onParticipantDisconnected = () => {
      if (room.remoteParticipants.size > 0) return
      void fetchDirectVideoCall(callId).then((call) => {
        if (call) endForRemote(call.status)
      })
    }

    room.on(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)

    return () => {
      room.off(RoomEvent.ParticipantDisconnected, onParticipantDisconnected)
      unsubWatch()
    }
  }, [callId, room])

  return null
}

function DirectCallConnectingOverlay({
  otherName,
  ringing,
}: {
  otherName: string
  ringing?: boolean
}) {
  return (
    <div className="dm-call-connecting" aria-live="polite">
      <div className="dm-call-connecting-rings" aria-hidden="true">
        <span className="dm-call-connecting-ring" />
        <span className="dm-call-connecting-ring dm-call-connecting-ring-delay" />
        <span className="dm-call-connecting-dot">
          <Loader2 size={28} className="dm-call-connecting-spinner" />
        </span>
      </div>
      <p className="dm-call-connecting-title">
        {ringing ? `Calling ${otherName}…` : `Connecting to ${otherName}…`}
      </p>
      <p className="dm-call-connecting-subtitle">
        {ringing ? 'Waiting for them to answer' : 'Setting up video'}
      </p>
    </div>
  )
}

function DirectCallHeader({ otherName, ringing }: { otherName: string; ringing?: boolean }) {
  return createPortal(
    <div className="dm-call-header-portal">
      <p className="text-cream text-sm font-semibold truncate">{otherName}</p>
      <p className="text-cream/50 text-xs">{ringing ? 'Ringing…' : 'Video call'}</p>
    </div>,
    document.body,
  )
}

function DirectCallStage({
  otherName,
  ringing,
  waitingForPeer,
}: {
  otherName: string
  ringing?: boolean
  waitingForPeer: boolean
}) {
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
        localCamera && (
          <ParticipantTile trackRef={localCamera} className="dm-call-remote-tile dm-call-local-preview" />
        )
      )}

      {waitingForPeer && (
        <DirectCallConnectingOverlay otherName={otherName} ringing={ringing} />
      )}

      {localCamera && remoteMain && (
        <div className="dm-call-pip">
          <ParticipantTile trackRef={localCamera} className="dm-call-pip-tile" />
        </div>
      )}
    </div>
  )
}

function DirectCallLabeledButton({
  label,
  active,
  danger,
  disabled,
  onClick,
  children,
}: {
  label: string
  active?: boolean
  danger?: boolean
  disabled?: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`dm-call-labeled-btn${active ? ' dm-call-labeled-btn-active' : ''}${danger ? ' dm-call-labeled-btn-danger' : ''}`}
    >
      <span className="dm-call-labeled-icon">{children}</span>
      <span className="dm-call-labeled-text">{label}</span>
    </button>
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

  return createPortal(
    <div className="dm-call-controls-portal" role="toolbar" aria-label="Call controls">
      <DirectCallLabeledButton
        label="Microphone"
        disabled={mic.pending}
        active={!mic.enabled}
        onClick={() => void mic.toggle()}
      >
        {mic.enabled ? <Mic size={20} /> : <MicOff size={20} />}
      </DirectCallLabeledButton>

      <DirectCallLabeledButton
        label="Camera"
        disabled={camera.pending}
        active={!camera.enabled}
        onClick={() => void camera.toggle()}
      >
        {camera.enabled ? <Video size={20} /> : <VideoOff size={20} />}
      </DirectCallLabeledButton>

      <DirectCallLabeledButton
        label="Flip"
        disabled={busy === 'flip'}
        onClick={() => void flipCamera()}
      >
        <SwitchCamera size={20} />
      </DirectCallLabeledButton>

      <DirectCallLabeledButton
        label="Share screen"
        disabled={screenShare.pending}
        active={screenShare.enabled}
        onClick={() => void screenShare.toggle()}
      >
        <MonitorUp size={20} />
      </DirectCallLabeledButton>

      <DirectCallLabeledButton
        label={ringing ? 'Cancel' : 'Leave'}
        danger
        onClick={handleEnd}
      >
        <PhoneOff size={20} />
      </DirectCallLabeledButton>
    </div>,
    document.body,
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
  const remoteParticipants = useRemoteParticipants()
  const waitingForPeer = ringing || remoteParticipants.length === 0

  return (
    <>
      <DirectCallRemoteWatcher callId={call.id} onRemoteEnd={onRemoteEnd} />
      <DirectCallMediaBootstrap />
      <RoomAudioRenderer />
      <ClassRoomAudioSetup />
      <DirectCallHeader otherName={otherName} ringing={ringing} />
      <DirectCallStage
        otherName={otherName}
        ringing={ringing}
        waitingForPeer={waitingForPeer}
      />
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

  useEffect(() => {
    const markEndedOnLeave = () => {
      if (endHandledRef.current || localEndRef.current) return
      void updateDirectVideoCallStatus(call.id, 'ended', {
        endedAt: new Date().toISOString(),
      })
    }

    window.addEventListener('pagehide', markEndedOnLeave)
    return () => window.removeEventListener('pagehide', markEndedOnLeave)
  }, [call.id])

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
        className="h-full w-full dm-call-room"
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
