import { useCallback, useEffect, useRef, useState } from 'react'
import { PhoneOff } from 'lucide-react'
import { LiveKitRoom, useRoomContext, VideoConference } from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2 } from 'lucide-react'
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

interface DirectVideoCallRoomProps {
  call: DirectVideoCall
  participantName: string
  participantId: string
  otherName: string
  onLeave: () => void
  onRemoteEnd?: (status: DirectVideoCallStatus) => void
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

function CallEndBar({
  otherName,
  onEnd,
}: {
  otherName: string
  onEnd: () => void
}) {
  const room = useRoomContext()

  const handleEnd = () => {
    room.disconnect()
    onEnd()
  }

  return (
    <div className="absolute inset-x-0 top-0 z-[300] flex items-center justify-between gap-3 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] bg-gradient-to-b from-charcoal/95 to-transparent pointer-events-none">
      <div className="min-w-0 pointer-events-auto">
        <p className="text-cream text-sm font-semibold truncate">{otherName}</p>
        <p className="text-cream/50 text-xs">Video call</p>
      </div>
      <button
        type="button"
        onClick={handleEnd}
        className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-red-600 text-cream text-sm font-semibold shadow-lg cursor-pointer hover:bg-red-700 pointer-events-auto"
      >
        <PhoneOff size={18} />
        End call
      </button>
    </div>
  )
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
    <div className="fixed inset-0 z-[200] bg-charcoal">
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
        style={{ height: '100%' }}
      >
        <DirectCallRemoteWatcher callId={call.id} onRemoteEnd={handleRemoteEnd} />
        <ClassRoomAudioSetup />
        <div className="relative h-full w-full dm-video-call">
          <VideoConference />
        </div>
        <CallEndBar otherName={otherName} onEnd={() => finishLeave(true)} />
      </LiveKitRoom>
    </div>
  )
}
