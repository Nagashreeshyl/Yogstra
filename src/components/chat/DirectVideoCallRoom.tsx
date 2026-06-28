import { useCallback, useEffect, useRef, useState } from 'react'
import {
  LiveKitRoom,
  VideoTrack,
  useLocalParticipant,
  useRemoteParticipants,
  useTracks,
} from '@livekit/components-react'
import { Track } from 'livekit-client'
import { Loader2, Mic, MicOff, PhoneOff, Video, VideoOff } from 'lucide-react'
import { ClassRoomAudioSetup } from '../classes/ClassRoomAudioSetup'
import {
  fetchLiveKitToken,
  subscribeToDirectVideoCallById,
  updateDirectVideoCallStatus,
  type DirectVideoCall,
  type DirectVideoCallStatus,
} from '../../services/directVideoCalls'

const TERMINAL_STATUSES: DirectVideoCallStatus[] = ['ended', 'declined', 'missed']

interface DirectVideoCallRoomProps {
  call: DirectVideoCall
  participantName: string
  participantId: string
  otherName: string
  onLeave: () => void
  onRemoteEnd?: (status: DirectVideoCallStatus) => void
}

function CallControls({ onEnd }: { onEnd: () => void }) {
  const { localParticipant } = useLocalParticipant()
  const [micOn, setMicOn] = useState(true)
  const [camOn, setCamOn] = useState(true)

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
        onClick={onEnd}
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

function CallVideoLayout({ otherName, onEnd }: { otherName: string; onEnd: () => void }) {
  const remoteParticipants = useRemoteParticipants()
  const remote = remoteParticipants[0]
  const allCameraTracks = useTracks([Track.Source.Camera], { onlySubscribed: true })
  const remoteTrack = allCameraTracks.find((t) => t.participant.identity === remote?.identity)
  const localTrack = allCameraTracks.find((t) => t.participant.isLocal)

  return (
    <div className="relative h-full w-full bg-charcoal overflow-hidden">
      <div className="absolute inset-0 flex items-center justify-center">
        {remoteTrack ? (
          <VideoTrack trackRef={remoteTrack} className="w-full h-full object-cover" />
        ) : (
          <div className="text-center px-6">
            <p className="text-cream/50 text-sm">Waiting for {otherName}…</p>
          </div>
        )}
      </div>

      {localTrack && (
        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-4 w-28 h-40 sm:w-32 sm:h-44 rounded-xl overflow-hidden border-2 border-cream/20 shadow-xl z-10 [transform:scaleX(-1)]">
          <VideoTrack trackRef={localTrack} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] left-4 z-10">
        <p className="text-cream text-sm font-medium drop-shadow-md">{otherName}</p>
        <p className="text-cream/50 text-xs">Video call</p>
      </div>

      <CallControls onEnd={onEnd} />
    </div>
  )
}

function RemoteEndWatcher({
  callId,
  onRemoteEnd,
}: {
  callId: string
  onRemoteEnd: (status: DirectVideoCallStatus) => void
}) {
  const handledRef = useRef(false)
  const knownStatusRef = useRef<DirectVideoCallStatus | null>(null)

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
      onRemoteEnd(status)
    }

    const unsub = subscribeToDirectVideoCallById(callId, (call) => {
      handleStatus(call.status)
    })

    return unsub
  }, [callId, onRemoteEnd])

  return null
}

export function DirectVideoCallRoom({
  call,
  participantName,
  participantId,
  otherName,
  onLeave,
  onRemoteEnd,
}: DirectVideoCallRoomProps) {
  const [connectInfo, setConnectInfo] = useState<{ token: string; serverUrl: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)
  const endHandledRef = useRef(false)

  useEffect(() => {
    endHandledRef.current = false
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
  }, [call.roomName, participantName, participantId])

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
    <div className="fixed inset-0 z-[100] bg-charcoal">
      <LiveKitRoom
        key={call.id}
        token={connectInfo.token}
        serverUrl={connectInfo.serverUrl}
        connect
        video
        audio
        connectOptions={{ autoSubscribe: true }}
        options={{
          audioCaptureDefaults: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        }}
        onDisconnected={() => finishLeave(true)}
        data-lk-theme="default"
        style={{ height: '100%' }}
      >
        <RemoteEndWatcher callId={call.id} onRemoteEnd={handleRemoteEnd} />
        <ClassRoomAudioSetup />
        <CallVideoLayout otherName={otherName} onEnd={() => finishLeave(true)} />
      </LiveKitRoom>
    </div>
  )
}
