import { useCallback, useEffect, useState } from 'react'
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VideoConference,
} from '@livekit/components-react'
import '@livekit/components-styles'
import { Loader2 } from 'lucide-react'
import {
  fetchLiveKitToken,
  updateClassSessionStatus,
  type ClassSession,
} from '../../services/classSessions'

interface LiveClassRoomProps {
  session: ClassSession
  participantName: string
  participantId: string
  onLeave: () => void
}

export function LiveClassRoom({
  session,
  participantName,
  participantId,
  onLeave,
}: LiveClassRoomProps) {
  const [connectInfo, setConnectInfo] = useState<{ token: string; serverUrl: string } | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    void fetchLiveKitToken({
      roomName: session.roomName,
      participantName,
      participantId,
    })
      .then((info) => {
        if (!cancelled) setConnectInfo(info)
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Could not join the class.')
        }
      })

    return () => {
      cancelled = true
    }
  }, [session.roomName, participantName, participantId])

  const handleDisconnected = useCallback(() => {
    void updateClassSessionStatus(session.id, 'ended', {
      endedAt: new Date().toISOString(),
    }).finally(onLeave)
  }, [session.id, onLeave])

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
        token={connectInfo.token}
        serverUrl={connectInfo.serverUrl}
        connect
        video
        audio
        onDisconnected={handleDisconnected}
        data-lk-theme="default"
        style={{ height: '100vh' }}
      >
        <VideoConference />
        <RoomAudioRenderer />
      </LiveKitRoom>
    </div>
  )
}
