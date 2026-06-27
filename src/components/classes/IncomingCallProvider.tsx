import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import {
  fetchStudentRingingSession,
  subscribeToClassSessions,
  updateClassSessionStatus,
  type ClassSession,
} from '../../services/classSessions'
import { IncomingCallOverlay } from './IncomingCallOverlay'
import { fetchTeacherById } from '../../services/teachers'

export function IncomingCallProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const [ringingSession, setRingingSession] = useState<ClassSession | null>(null)
  const [callerPhoto, setCallerPhoto] = useState<string | undefined>()

  const refresh = useCallback(async () => {
    if (!user || user.role !== 'student') {
      setRingingSession(null)
      return
    }
    const session = await fetchStudentRingingSession(user.id)
    setRingingSession(session)
    if (session?.teacherId) {
      const teacher = await fetchTeacherById(session.teacherId)
      setCallerPhoto(teacher?.photo)
    }
  }, [user])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!user || user.role !== 'student') return
    return subscribeToClassSessions(user.id, 'student', () => {
      void refresh()
    })
  }, [user, refresh])

  useAppIntervalRefresh(() => {
    void refresh()
  }, Boolean(user?.role === 'student'))

  const handleAccept = async () => {
    if (!ringingSession) return
    await updateClassSessionStatus(ringingSession.id, 'active', {
      startedAt: new Date().toISOString(),
    })
    setRingingSession(null)
    navigate(`/dashboard/student/classes/room/${ringingSession.id}`)
  }

  const handleDecline = async () => {
    if (!ringingSession) return
    await updateClassSessionStatus(ringingSession.id, 'declined', {
      endedAt: new Date().toISOString(),
    })
    setRingingSession(null)
  }

  return (
    <>
      {children}
      {ringingSession && (
        <IncomingCallOverlay
          session={ringingSession}
          callerName={ringingSession.teacherName ?? 'Your teacher'}
          callerPhoto={callerPhoto}
          onAccept={() => void handleAccept()}
          onDecline={() => void handleDecline()}
        />
      )}
    </>
  )
}
