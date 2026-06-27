import { useEffect, useRef } from 'react'
import { useRoomContext } from '@livekit/components-react'
import {
  fetchClassSession,
  subscribeToClassSessionById,
  type ClassSessionStatus,
} from '../../services/classSessions'

interface ClassSessionRemoteWatcherProps {
  sessionId: string
  onRemoteEnd: (status: ClassSessionStatus) => void
}

const TERMINAL_STATUSES: ClassSessionStatus[] = ['ended', 'declined', 'missed']

export function ClassSessionRemoteWatcher({
  sessionId,
  onRemoteEnd,
}: ClassSessionRemoteWatcherProps) {
  const room = useRoomContext()
  const handledRef = useRef(false)
  const knownStatusRef = useRef<ClassSessionStatus | null>(null)
  const onRemoteEndRef = useRef(onRemoteEnd)
  onRemoteEndRef.current = onRemoteEnd

  useEffect(() => {
    handledRef.current = false
    knownStatusRef.current = null

    const handleStatus = (status: ClassSessionStatus) => {
      if (knownStatusRef.current === null) {
        knownStatusRef.current = status
        return
      }

      if (status === knownStatusRef.current) return
      knownStatusRef.current = status

      if (handledRef.current || !TERMINAL_STATUSES.includes(status)) return
      handledRef.current = true
      room.disconnect()
      onRemoteEndRef.current(status)
    }

    const unsub = subscribeToClassSessionById(sessionId, (session) => {
      handleStatus(session.status)
    })

    void fetchClassSession(sessionId).then((session) => {
      if (session) handleStatus(session.status)
    })

    return () => {
      unsub()
    }
  }, [sessionId, room])

  return null
}
