import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  useRemoteParticipants,
  useRoomContext,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2, Video } from 'lucide-react'
import {
  RemoteTrackPublication,
  RoomEvent,
  Track,
  type RemoteParticipant,
} from 'livekit-client'
import { ClassRoomAudioSetup } from '../classes/ClassRoomAudioSetup'
import { LiveKitVideoQualityBootstrap } from '../classes/LiveKitVideoQualityBootstrap'
import { VideoQualitySelector } from '../classes/VideoQualitySelector'
import { YogstraCallStage } from '../call/YogstraCallStage'
import { YogstraCallHeader, YogstraVideoCallControls } from '../call/YogstraVideoCallControls'
import { useBackgroundCameraPause } from '../call/useBackgroundCameraPause'
import {
  buildLiveKitRoomOptions,
  getLiveKitCameraCaptureOptions,
  getLiveKitVideoQuality,
} from '../../utils/livekitVideoQuality'
import {
  fetchDirectVideoCall,
  fetchLiveKitToken,
  TERMINAL_DIRECT_VIDEO_CALL_STATUSES,
  updateDirectVideoCallStatus,
  watchDirectVideoCallTerminalStatus,
  type DirectVideoCall,
  type DirectVideoCallStatus,
} from '../../services/directVideoCalls'
import { Button } from '../ui/Button'

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

    const onTrackPublished = (publication: RemoteTrackPublication) => {
      if (publication.kind === Track.Kind.Audio || publication.kind === Track.Kind.Video) {
        void publication.setSubscribed(true)
      }
    }

    subscribeAll()

    room.on(RoomEvent.Connected, subscribeAll)
    room.on(RoomEvent.Reconnected, subscribeAll)
    room.on(RoomEvent.ParticipantConnected, subscribeParticipant)
    room.on(RoomEvent.TrackPublished, onTrackPublished)

    return () => {
      room.off(RoomEvent.Connected, subscribeAll)
      room.off(RoomEvent.Reconnected, subscribeAll)
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
        if (!call || call.status === 'ringing') return
        endForRemote(call.status)
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
    <div className="yogstra-call-connecting" aria-live="polite">
      <div className="yogstra-call-connecting-rings" aria-hidden="true">
        <span className="yogstra-call-connecting-ring" />
        <span className="yogstra-call-connecting-ring yogstra-call-connecting-ring-delay" />
        <span className="yogstra-call-connecting-dot">
          <Loader2 size={28} className="yogstra-call-connecting-spinner" />
        </span>
      </div>
      <p className="yogstra-call-connecting-title">
        {ringing ? `Calling ${otherName}…` : `Connecting to ${otherName}…`}
      </p>
      <p className="yogstra-call-connecting-subtitle">
        {ringing ? 'Waiting for them to answer' : 'Setting up video'}
      </p>
    </div>
  )
}

function DirectCallLocalCameraPrompt() {
  const room = useRoomContext()
  const [cameraOff, setCameraOff] = useState(false)

  useEffect(() => {
    const sync = () => {
      const publication = room.localParticipant.getTrackPublication(Track.Source.Camera)
      setCameraOff(!publication?.track || publication.isMuted)
    }

    sync()
    room.on(RoomEvent.LocalTrackPublished, sync)
    room.on(RoomEvent.TrackMuted, sync)
    room.on(RoomEvent.TrackUnmuted, sync)
    room.on(RoomEvent.Connected, sync)

    return () => {
      room.off(RoomEvent.LocalTrackPublished, sync)
      room.off(RoomEvent.TrackMuted, sync)
      room.off(RoomEvent.TrackUnmuted, sync)
      room.off(RoomEvent.Connected, sync)
    }
  }, [room])

  if (!cameraOff) return null

  return createPortal(
    <button
      type="button"
      className="yogstra-call-camera-prompt"
      onClick={() => {
        void room.localParticipant.setCameraEnabled(true, getLiveKitCameraCaptureOptions())
      }}
    >
      <Video size={16} />
      Turn camera on
    </button>,
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
  useBackgroundCameraPause()
  const remoteParticipants = useRemoteParticipants()
  const waitingForPeer = ringing || remoteParticipants.length === 0

  return (
    <>
      <DirectCallRemoteWatcher callId={call.id} onRemoteEnd={onRemoteEnd} />
      <DirectCallMediaBootstrap />
      <DirectCallLocalCameraPrompt />
      <RoomAudioRenderer />
      <ClassRoomAudioSetup />
      <YogstraCallHeader title={otherName} subtitle={ringing ? 'Ringing…' : 'Video call'} />
      {createPortal(
        <VideoQualitySelector variant="floating" className="yogstra-call-quality" />,
        document.body,
      )}
      <YogstraCallStage
        otherName={otherName}
        waitingOverlay={
          waitingForPeer ? (
            <DirectCallConnectingOverlay otherName={otherName} ringing={ringing} />
          ) : undefined
        }
      />
      <YogstraVideoCallControls ringing={ringing} onEnd={onEnd} />
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
  const [joining, setJoining] = useState(true)
  const endHandledRef = useRef(false)
  const localEndRef = useRef(false)

  const loadConnectInfo = useCallback(async () => {
    setJoining(true)
    setError(null)
    setConnectInfo(null)
    try {
      const info = await fetchLiveKitToken({
        roomName: call.roomName,
        participantName,
        participantId,
      })
      setConnectInfo(info)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the call.')
    } finally {
      setJoining(false)
    }
  }, [call.roomName, participantName, participantId])

  useEffect(() => {
    endHandledRef.current = false
    localEndRef.current = false
    void loadConnectInfo()
  }, [call.id, loadConnectInfo])

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

  if (!call.roomName?.trim()) {
    return (
      <div className="fixed inset-0 z-[200] bg-sidebar flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-destructive">
            This call is missing a video room. Apply migration 010_direct_video_calls_room_name.sql
            and start a new call.
          </p>
          <Button onClick={onLeave}>Go back</Button>
        </div>
      </div>
    )
  }

  if (error) {
    const canRetry = !/sign in again/i.test(error)
    return (
      <div className="fixed inset-0 z-[200] bg-sidebar flex items-center justify-center p-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-destructive">{error}</p>
          <div className="flex flex-wrap items-center justify-center gap-3">
            {canRetry && (
              <Button disabled={joining} onClick={() => void loadConnectInfo()}>
                {joining ? 'Retrying…' : 'Try again'}
              </Button>
            )}
            <Button variant="secondary" onClick={onLeave}>
              Go back
            </Button>
          </div>
        </div>
      </div>
    )
  }

  if (joining || !connectInfo) {
    return (
      <div className="fixed inset-0 z-[200] bg-sidebar flex flex-col items-center justify-center gap-3">
        <Loader2 className="animate-spin text-accent" size={40} />
        <p className="text-primary-foreground/70 text-sm">Joining video call…</p>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[200] yogstra-call-root">
      <LiveKitRoom
        key={call.id}
        token={connectInfo.token}
        serverUrl={connectInfo.serverUrl}
        connect
        video
        audio
        connectOptions={{ autoSubscribe: true }}
        options={buildLiveKitRoomOptions(getLiveKitVideoQuality())}
        data-lk-theme="default"
        className="h-full w-full yogstra-call-room"
      >
        <LiveKitVideoQualityBootstrap />
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
