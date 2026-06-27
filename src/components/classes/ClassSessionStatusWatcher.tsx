import { useEffect, useRef } from 'react'
import {
  fetchClassSession,
  subscribeToClassSessionById,
  type ClassSessionStatus,
} from '../../services/classSessions'

const TERMINAL_STATUSES: ClassSessionStatus[] = ['ended', 'declined', 'missed']

interface ClassSessionStatusWatcherProps {
  sessionId: string
  onTerminalStatus: (status: ClassSessionStatus) => void
}

export function ClassSessionStatusWatcher({
  sessionId,
  onTerminalStatus,
}: ClassSessionStatusWatcherProps) {
  const handledRef = useRef(false)
  const knownStatusRef = useRef<ClassSessionStatus | null>(null)
  const onTerminalStatusRef = useRef(onTerminalStatus)
  onTerminalStatusRef.current = onTerminalStatus

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
      onTerminalStatusRef.current(status)
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
  }, [sessionId])

  return null
}
