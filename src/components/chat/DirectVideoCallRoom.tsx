import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  isTrackReference,
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
  LocalVideoTrack,
  RemoteTrackPublication,
  Room,
  RoomEvent,
  Track,
  type RemoteParticipant,
} from 'livekit-client'
import type { TrackReferenceOrPlaceholder } from '@livekit/components-core'
import { ClassRoomAudioSetup } from '../classes/ClassRoomAudioSetup'
import {
  canOfferScreenShare,
  disableScreenShare,
  enableScreenShare,
  screenShareErrorMessage,
} from '../../utils/screenShareSupport'
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
        await room.localParticipant.setCameraEnabled(true, { facingMode: 'user' })
        await room.localParticipant.setMicrophoneEnabled(true)
      } catch {
        /* permissions may be denied — DirectCallCameraGate offers a retry tap */
      }
    }

    const subscribeParticipant = (participant: RemoteParticipant) => {
      participant.trackPublications.forEach((publication) => {
        if (
          publication.kind === Track.Kind.Audio ||
          publication.kind === Track.Kind.Video
        ) {
          void publication.setSubscribed(true)
        }
      })
    }

    const subscribeAll = () => {
      room.remoteParticipants.forEach(subscribeParticipant)
    }

    const onParticipantConnected = (participant: RemoteParticipant) => {
      subscribeParticipant(participant)
      // Re-publish so the person who just joined receives our camera feed.
      void publishLocal()
    }

    const onTrackPublished = (
      publication: RemoteTrackPublication,
      participant: RemoteParticipant,
    ) => {
      if (publication.kind === Track.Kind.Audio || publication.kind === Track.Kind.Video) {
        void publication.setSubscribed(true)
      }
      subscribeParticipant(participant)
    }

    void publishLocal()
    subscribeAll()

    const onConnected = () => {
      void publishLocal()
      subscribeAll()
    }

    room.on(RoomEvent.Connected, onConnected)
    room.on(RoomEvent.ParticipantConnected, onParticipantConnected)
    room.on(RoomEvent.TrackPublished, onTrackPublished)
    room.on(RoomEvent.Reconnected, onConnected)

    const retryTimer = window.setInterval(() => {
      void publishLocal()
      subscribeAll()
    }, 2_000)

    const stopRetry = window.setTimeout(() => {
      window.clearInterval(retryTimer)
    }, 20_000)

    return () => {
      window.clearInterval(retryTimer)
      window.clearTimeout(stopRetry)
      room.off(RoomEvent.Connected, onConnected)
      room.off(RoomEvent.Reconnected, onConnected)
      room.off(RoomEvent.ParticipantConnected, onParticipantConnected)
      room.off(RoomEvent.TrackPublished, onTrackPublished)
    }
  }, [room])

  return null
}

function DirectCallCameraGate() {
  const room = useRoomContext()
  const [cameraOff, setCameraOff] = useState(false)

  useEffect(() => {
    const sync = () => {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
      setCameraOff(!publication?.track || publication.isMuted)
    }

    sync()
    const timer = window.setTimeout(sync, 1_500)

    room.on(RoomEvent.LocalTrackPublished, sync)
    room.on(RoomEvent.TrackMuted, sync)
    room.on(RoomEvent.TrackUnmuted, sync)
    room.on(RoomEvent.Connected, sync)

    return () => {
      window.clearTimeout(timer)
      room.off(RoomEvent.LocalTrackPublished, sync)
      room.off(RoomEvent.TrackMuted, sync)
      room.off(RoomEvent.TrackUnmuted, sync)
      room.off(RoomEvent.Connected, sync)
    }
  }, [room])

  if (!cameraOff) return null

  return createPortal(
    <div className="dm-call-camera-gate">
      <button
        type="button"
        className="dm-call-camera-gate-btn"
        onClick={() => {
          void room.localParticipant.setCameraEnabled(true, { facingMode: 'user' })
        }}
      >
        <Video size={18} />
        Tap to turn on your camera
      </button>
    </div>,
    document.body,
  )
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
      <p className="text-primary-foreground text-sm font-semibold truncate">{otherName}</p>
      <p className="text-primary-foreground/50 text-xs">{ringing ? 'Ringing…' : 'Video call'}</p>
    </div>,
    document.body,
  )
}

function isLiveVideoTrack(track: TrackReferenceOrPlaceholder) {
  if (!isTrackReference(track)) return false
  const publication = track.publication
  if (!publication || publication.isMuted) return false
  return publication.isSubscribed || Boolean(publication.track)
}

function pickRemoteMainTrack(
  remoteTracks: TrackReferenceOrPlaceholder[],
): TrackReferenceOrPlaceholder | undefined {
  const screenShare = remoteTracks.find(
    (track) => track.source === Track.Source.ScreenShare && isLiveVideoTrack(track),
  )
  if (screenShare) return screenShare

  return remoteTracks.find(
    (track) => track.source === Track.Source.Camera && isLiveVideoTrack(track),
  )
}

function pickMainStageTrack(
  tracks: TrackReferenceOrPlaceholder[],
  localIdentity: string,
): TrackReferenceOrPlaceholder | undefined {
  const localTracks = tracks.filter((track) => track.participant.identity === localIdentity)
  const remoteTracks = tracks.filter((track) => track.participant.identity !== localIdentity)

  const localScreenShare = localTracks.find(
    (track) => track.source === Track.Source.ScreenShare && isLiveVideoTrack(track),
  )
  if (localScreenShare) return localScreenShare

  return pickRemoteMainTrack(remoteTracks)
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
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  )

  const localIdentity = localParticipant.identity
  const localCamera = tracks.find(
    (track) =>
      track.participant.identity === localIdentity && track.source === Track.Source.Camera,
  )

  const mainTrack = pickMainStageTrack(tracks, localIdentity)
  const showLocalPip =
    localCamera &&
    mainTrack &&
    (mainTrack.source !== Track.Source.Camera ||
      mainTrack.participant.identity !== localIdentity)

  return (
    <div className="dm-call-stage">
      {mainTrack ? (
        <ParticipantTile trackRef={mainTrack} className="dm-call-remote-tile" />
      ) : (
        localCamera &&
        isTrackReference(localCamera) && (
          <ParticipantTile trackRef={localCamera} className="dm-call-remote-tile dm-call-local-preview" />
        )
      )}

      {waitingForPeer && (
        <DirectCallConnectingOverlay otherName={otherName} ringing={ringing} />
      )}

      {showLocalPip && localCamera && (
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
  const showScreenShare = canOfferScreenShare()
  const [screenSharing, setScreenSharing] = useState(false)
  const [busy, setBusy] = useState<'flip' | 'screen' | null>(null)
  const [actionNotice, setActionNotice] = useState<string | null>(null)

  useEffect(() => {
    if (!showScreenShare) return

    const syncScreenShare = () => {
      setScreenSharing(room.localParticipant.isScreenShareEnabled)
    }

    syncScreenShare()
    room.on(RoomEvent.LocalTrackPublished, syncScreenShare)
    room.on(RoomEvent.LocalTrackUnpublished, syncScreenShare)
    room.on(RoomEvent.TrackMuted, syncScreenShare)
    room.on(RoomEvent.TrackUnmuted, syncScreenShare)

    return () => {
      room.off(RoomEvent.LocalTrackPublished, syncScreenShare)
      room.off(RoomEvent.LocalTrackUnpublished, syncScreenShare)
      room.off(RoomEvent.TrackMuted, syncScreenShare)
      room.off(RoomEvent.TrackUnmuted, syncScreenShare)
    }
  }, [room, showScreenShare])

  useEffect(() => {
    if (!actionNotice) return
    const timer = window.setTimeout(() => setActionNotice(null), 3500)
    return () => window.clearTimeout(timer)
  }, [actionNotice])

  const flipCamera = async () => {
    if (busy) return
    setBusy('flip')
    setActionNotice(null)
    try {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
      const videoTrack = publication?.videoTrack as LocalVideoTrack | undefined

      if (!videoTrack) {
        await room.localParticipant.setCameraEnabled(true, { facingMode: 'user' })
        return
      }

      const settings = videoTrack.mediaStreamTrack.getSettings()
      const facing = settings.facingMode

      if (facing === 'user' || facing === 'environment') {
        await videoTrack.restartTrack({
          facingMode: facing === 'user' ? 'environment' : 'user',
        })
        return
      }

      const devices = await Room.getLocalDevices('videoinput', true)
      if (devices.length < 2) {
        setActionNotice('No other camera found on this device.')
        return
      }

      const activeId = room.getActiveDevice('videoinput') ?? settings.deviceId
      const currentIndex = Math.max(0, devices.findIndex((device) => device.deviceId === activeId))
      const nextDevice = devices[(currentIndex + 1) % devices.length]

      await videoTrack.restartTrack({
        deviceId: { exact: nextDevice.deviceId },
      })
    } catch {
      setActionNotice('Could not switch camera. Try turning the camera off and on.')
    } finally {
      setBusy(null)
    }
  }

  const toggleScreenShare = async () => {
    if (busy || !showScreenShare) return
    setBusy('screen')
    setActionNotice(null)

    try {
      if (room.localParticipant.isScreenShareEnabled) {
        await disableScreenShare(room)
        return
      }

      await enableScreenShare(room)
    } catch (err) {
      setActionNotice(screenShareErrorMessage(err))
    } finally {
      setBusy(null)
    }
  }

  const handleEnd = () => {
    room.disconnect()
    onEnd()
  }

  return createPortal(
    <>
      {actionNotice && (
        <div className="dm-call-action-notice">{actionNotice}</div>
      )}
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

      {showScreenShare && (
        <DirectCallLabeledButton
          label="Share screen"
          disabled={busy === 'screen'}
          active={screenSharing}
          onClick={() => void toggleScreenShare()}
        >
          <MonitorUp size={20} />
        </DirectCallLabeledButton>
      )}

      <DirectCallLabeledButton
        label={ringing ? 'Cancel' : 'Leave'}
        danger
        onClick={handleEnd}
      >
        <PhoneOff size={20} />
      </DirectCallLabeledButton>
    </div>
    </>,
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
      <DirectCallCameraGate />
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
      <div className="fixed inset-0 z-[200] bg-sidebar flex items-center justify-center p-6">
        <div className="max-w-md text-center">
          <p className="text-red-300 mb-4">{error}</p>
          <button
            type="button"
            onClick={onLeave}
            className="px-4 py-2 bg-elevated text-foreground rounded-sm font-medium cursor-pointer"
          >
            Go back
          </button>
        </div>
      </div>
    )
  }

  if (!connectInfo) {
    return (
      <div className="fixed inset-0 z-[200] bg-sidebar flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-primary" size={40} />
        <p className="text-primary-foreground/60 text-sm">Joining video call…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] bg-sidebar dm-call-root">
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
          videoCaptureDefaults: {
            facingMode: 'user',
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
