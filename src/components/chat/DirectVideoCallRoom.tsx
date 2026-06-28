import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import {
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  useLocalParticipant,
  useRemoteParticipants,
  useRoomContext,
  useTracks,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { isTrackReference } from '@livekit/components-core'
import {
  DisconnectReason,
  RemoteTrackPublication,
  RoomEvent,
  Track,
  type RemoteParticipant,
  type Room,
} from 'livekit-client'
import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
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
const MAX_MANUAL_RECONNECTS = 8

interface DirectVideoCallRoomProps {
  call: DirectVideoCall
  participantName: string
  participantId: string
  otherName: string
  /** Caller joins LiveKit while still ringing so video is ready when the other person answers. */
  preconnect?: boolean
  onLeave: () => void
  onRemoteEnd?: (status: DirectVideoCallStatus) => void
}

async function republishLocalMedia(room: Room) {
  await room.localParticipant.setMicrophoneEnabled(true)
  await room.localParticipant.setCameraEnabled(true)
}

/** Force-subscribe to every remote camera/mic track. */
function RemoteMediaSubscription() {
  const room = useRoomContext()

  useEffect(() => {
    const subscribeParticipant = (participant: RemoteParticipant) => {
      participant.trackPublications.forEach((publication: RemoteTrackPublication) => {
        if (publication.kind === Track.Kind.Audio || publication.kind === Track.Kind.Video) {
          void publication.setSubscribed(true)
        }
      })
    }

    const subscribeAll = () => {
      room.remoteParticipants.forEach(subscribeParticipant)
    }

    const onTrackPublished = (publication: RemoteTrackPublication, participant: RemoteParticipant) => {
      if (publication.kind === Track.Kind.Audio || publication.kind === Track.Kind.Video) {
        void publication.setSubscribed(true)
      }
      subscribeParticipant(participant)
    }

    subscribeAll()

    room.on(RoomEvent.ParticipantConnected, subscribeParticipant)
    room.on(RoomEvent.TrackPublished, onTrackPublished)

    return () => {
      room.off(RoomEvent.ParticipantConnected, subscribeParticipant)
      room.off(RoomEvent.TrackPublished, onTrackPublished)
    }
  }, [room])

  return null
}

function CallConnectionGuard({
  roomName,
  participantName,
  participantId,
  userEndRef,
}: {
  roomName: string
  participantName: string
  participantId: string
  userEndRef: RefObject<boolean>
}) {
  const room = useRoomContext()
  const [reconnecting, setReconnecting] = useState(false)
  const [connectionLost, setConnectionLost] = useState(false)
  const attemptsRef = useRef(0)
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const clearRetry = () => {
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current)
        retryTimerRef.current = null
      }
    }

    const manualReconnect = async () => {
      if (userEndRef.current) return

      setReconnecting(true)
      setConnectionLost(false)

      try {
        const info = await fetchLiveKitToken({ roomName, participantName, participantId })
        if (userEndRef.current) return
        if (room.state === 'connected') {
          setReconnecting(false)
          attemptsRef.current = 0
          return
        }
        await room.connect(info.serverUrl, info.token)
        await republishLocalMedia(room)
        attemptsRef.current = 0
        setReconnecting(false)
        setConnectionLost(false)
      } catch {
        attemptsRef.current += 1
        if (attemptsRef.current >= MAX_MANUAL_RECONNECTS || userEndRef.current) {
          setReconnecting(false)
          setConnectionLost(true)
          return
        }
        clearRetry()
        retryTimerRef.current = setTimeout(() => {
          void manualReconnect()
        }, Math.min(2_000 * attemptsRef.current, 8_000))
      }
    }

    const onReconnecting = () => {
      if (!userEndRef.current) setReconnecting(true)
    }

    const onReconnected = async () => {
      attemptsRef.current = 0
      setReconnecting(false)
      setConnectionLost(false)
      await republishLocalMedia(room).catch(() => undefined)
    }

    const onDisconnected = (reason?: DisconnectReason) => {
      if (userEndRef.current) return
      if (reason === DisconnectReason.CLIENT_INITIATED) return
      void manualReconnect()
    }

    room.on(RoomEvent.Reconnecting, onReconnecting)
    room.on(RoomEvent.Reconnected, onReconnected)
    room.on(RoomEvent.Disconnected, onDisconnected)

    return () => {
      clearRetry()
      room.off(RoomEvent.Reconnecting, onReconnecting)
      room.off(RoomEvent.Reconnected, onReconnected)
      room.off(RoomEvent.Disconnected, onDisconnected)
    }
  }, [room, roomName, participantName, participantId, userEndRef])

  if (!reconnecting && !connectionLost) return null

  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-charcoal/70 backdrop-blur-sm px-6">
      <div className="text-center max-w-xs">
        {reconnecting ? (
          <>
            <Loader2 className="animate-spin text-teal mx-auto mb-3" size={32} />
            <p className="text-cream text-sm font-medium">Reconnecting…</p>
            <p className="text-cream/50 text-xs mt-1">Your call is still active</p>
          </>
        ) : (
          <>
            <p className="text-cream text-sm font-medium">Connection lost</p>
            <p className="text-cream/50 text-xs mt-1 mb-4">Tap below to rejoin without ending the call</p>
            <button
              type="button"
              onClick={() => {
                attemptsRef.current = 0
                setConnectionLost(false)
                void (async () => {
                  setReconnecting(true)
                  try {
                    const info = await fetchLiveKitToken({ roomName, participantName, participantId })
                    if (userEndRef.current) return
                    await room.connect(info.serverUrl, info.token)
                    await republishLocalMedia(room)
                    setReconnecting(false)
                  } catch {
                    setReconnecting(false)
                    setConnectionLost(true)
                  }
                })()
              }}
              className="px-4 py-2 rounded-sm bg-teal text-charcoal text-sm font-medium cursor-pointer"
            >
              Rejoin call
            </button>
          </>
        )}
      </div>
    </div>
  )
}

function CallControls({
  onEnd,
  userEndRef,
}: {
  onEnd: () => void
  userEndRef: RefObject<boolean>
}) {
  const room = useRoomContext()
  const { localParticipant } = useLocalParticipant()
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

  useEffect(() => {
    void republishLocalMedia(room)
  }, [room, localParticipant])

  const toggleMic = async () => {
    const next = !micOn
    await localParticipant.setMicrophoneEnabled(next)
    setMicOn(next)
  }

  const toggleCam = async () => {
    const next = !camOn
    await localParticipant.setCameraEnabled(next)
    setCamOn(next)
  }

  const handleEnd = () => {
    userEndRef.current = true
    room.disconnect()
    onEnd()
  }

  return (
    <div className="absolute bottom-0 inset-x-0 z-20 flex justify-center gap-5 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-8 bg-gradient-to-t from-charcoal/90 to-transparent">
      <button
        type="button"
        onClick={() => void toggleMic()}
        className="w-14 h-14 rounded-full bg-cream/15 text-cream flex items-center justify-center cursor-pointer hover:bg-cream/25 transition-colors"
        aria-label={micOn ? 'Mute microphone' : 'Unmute microphone'}
      >
        {micOn ? <Mic size={22} /> : <MicOff size={22} />}
      </button>
      <button
        type="button"
        onClick={handleEnd}
        className="w-16 h-16 rounded-full bg-red-600 text-cream flex items-center justify-center cursor-pointer hover:bg-red-700 transition-colors shadow-lg"
        aria-label="End call"
      >
        <PhoneOff size={26} />
      </button>
      <button
        type="button"
        onClick={() => void toggleCam()}
        className="w-14 h-14 rounded-full bg-cream/15 text-cream flex items-center justify-center cursor-pointer hover:bg-cream/25 transition-colors"
        aria-label={camOn ? 'Turn camera off' : 'Turn camera on'}
      >
        {camOn ? <Video size={22} /> : <VideoOff size={22} />}
      </button>
    </div>
  )
}

function CallVideoLayout({
  otherName,
  onEnd,
  userEndRef,
  roomName,
  participantName,
  participantId,
  preconnect,
}: {
  otherName: string
  onEnd: () => void
  userEndRef: RefObject<boolean>
  roomName: string
  participantName: string
  participantId: string
  preconnect?: boolean
}) {
  const remoteParticipants = useRemoteParticipants()
  const { localParticipant } = useLocalParticipant()

  const tracks = useTracks([{ source: Track.Source.Camera, withPlaceholder: true }], {
    onlySubscribed: false,
  })

  const remoteParticipant = remoteParticipants[0]
  const remoteTrack =
    tracks.find(
      (track) =>
        track.source === Track.Source.Camera &&
        track.participant.identity === remoteParticipant?.identity,
    ) ??
    tracks.find((track) => track.source === Track.Source.Camera && !track.participant.isLocal)

  const localTrack = tracks.find(
    (track) =>
      track.source === Track.Source.Camera &&
      track.participant.identity === localParticipant.identity,
  )

  useEffect(() => {
    for (const track of tracks) {
      if (!isTrackReference(track) || track.participant.isLocal) continue
      const publication = track.publication
      if (publication instanceof RemoteTrackPublication && !publication.isSubscribed) {
        void publication.setSubscribed(true)
      }
    }
  }, [tracks])

  const remoteReady = remoteTrack && isTrackReference(remoteTrack) && remoteTrack.publication.isSubscribed

  return (
    <div className="relative h-full w-full bg-charcoal overflow-hidden">
      <div className="absolute inset-0 dm-call-remote">
        {remoteTrack ? (
          <ParticipantTile
            trackRef={remoteTrack}
            className="h-full w-full !max-h-none !max-w-none"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center px-6">
            <div>
              <p className="text-cream/50 text-sm">
                {preconnect ? `Calling ${otherName}…` : `Waiting for ${otherName}…`}
              </p>
              <p className="text-cream/35 text-xs mt-2">
                {remoteParticipants.length === 0
                  ? 'Your camera is on — waiting for them to join'
                  : 'Connecting their video…'}
              </p>
            </div>
          </div>
        )}
      </div>

      {localTrack && (
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 z-10 w-28 h-40 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-cream/20 shadow-xl dm-call-local [transform:scaleX(-1)]">
          <ParticipantTile
            trackRef={localTrack}
            className="h-full w-full !max-h-none !max-w-none"
          />
        </div>
      )}

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-10">
        <p className="text-cream text-sm font-medium drop-shadow-md">{otherName}</p>
        <p className="text-cream/50 text-xs">
          {remoteReady ? 'Connected' : preconnect ? 'Ringing…' : 'Video call'}
        </p>
      </div>

      <CallConnectionGuard
        roomName={roomName}
        participantName={participantName}
        participantId={participantId}
        userEndRef={userEndRef}
      />
      <CallControls onEnd={onEnd} userEndRef={userEndRef} />
    </div>
  )
}

function RemoteEndWatcher({
  callId,
  userEndRef,
  onRemoteEnd,
}: {
  callId: string
  userEndRef: RefObject<boolean>
  onRemoteEnd: (status: DirectVideoCallStatus) => void
}) {
  const room = useRoomContext()
  const handledRef = useRef(false)
  const knownStatusRef = useRef<DirectVideoCallStatus | null>(null)
  const onRemoteEndRef = useRef(onRemoteEnd)
  onRemoteEndRef.current = onRemoteEnd

  useEffect(() => {
    handledRef.current = false
    knownStatusRef.current = null

    const handleStatus = (status: DirectVideoCallStatus) => {
      if (knownStatusRef.current === null) {
        knownStatusRef.current = status
        return
      }
      if (status === knownStatusRef.current) return
      knownStatusRef.current = status
      if (handledRef.current || !TERMINAL_STATUSES.includes(status)) return
      handledRef.current = true
      userEndRef.current = true
      room.disconnect()
      onRemoteEndRef.current(status)
    }

    const unsub = subscribeToDirectVideoCallById(callId, (call) => {
      handleStatus(call.status)
    })

    void fetchDirectVideoCall(callId).then((call) => {
      if (call) handleStatus(call.status)
    })

    return unsub
  }, [callId, room, userEndRef])

  return null
}

export function DirectVideoCallRoom({
  call,
  participantName,
  participantId,
  otherName,
  preconnect = false,
  onLeave,
  onRemoteEnd,
}: DirectVideoCallRoomProps) {
  const [connectInfo, setConnectInfo] = useState<{ token: string; serverUrl: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const endHandledRef = useRef(false)
  const userEndRef = useRef(false)

  useEffect(() => {
    endHandledRef.current = false
    userEndRef.current = false
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
      userEndRef.current = true
    }
  }, [call.id, call.roomName, participantName, participantId])

  const finishLeave = useCallback(
    (localEnd: boolean) => {
      if (endHandledRef.current) return
      endHandledRef.current = true

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
      onRemoteEnd?.(status)
      finishLeave(false)
    },
    [finishLeave, onRemoteEnd],
  )

  const handleUserEnd = useCallback(() => {
    finishLeave(true)
  }, [finishLeave])

  if (error) {
    return (
      <div className="fixed inset-0 z-[100] bg-charcoal flex items-center justify-center p-6">
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
      <div className="fixed inset-0 z-[100] bg-charcoal flex items-center justify-center">
        <Loader2 className="animate-spin text-teal" size={40} />
      </div>
    )
  }

  return (
    <div className={`fixed inset-0 z-[100] bg-charcoal ${preconnect ? 'pointer-events-none opacity-0' : ''}`}>
      <LiveKitRoom
        key={call.id}
        token={connectInfo.token}
        serverUrl={connectInfo.serverUrl}
        connect
        video
        audio
        connectOptions={{
          autoSubscribe: true,
          maxRetries: 5,
          peerConnectionTimeout: 30_000,
          websocketTimeout: 30_000,
        }}
        options={{
          adaptiveStream: false,
          dynacast: false,
          disconnectOnPageLeave: false,
          stopLocalTrackOnUnpublish: false,
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
        style={{ height: '100%' }}
      >
        <RemoteEndWatcher callId={call.id} userEndRef={userEndRef} onRemoteEnd={handleRemoteEnd} />
        <RemoteMediaSubscription />
        <RoomAudioRenderer />
        <ClassRoomAudioSetup />
        <CallVideoLayout
          otherName={otherName}
          onEnd={handleUserEnd}
          userEndRef={userEndRef}
          roomName={call.roomName}
          participantName={participantName}
          participantId={participantId}
          preconnect={preconnect}
        />
      </LiveKitRoom>
    </div>
  )
}
