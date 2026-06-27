import { useCallback, useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useLiveSync } from '../../hooks/useLiveSync'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import { useScheduleBoundaryRefresh } from '../../hooks/useScheduleBoundaryRefresh'
import {
  createClassSession,
  subscribeToClassSessions,
} from '../../services/classSessions'
import {
  fetchTeacherNextSession,
  isClassStartTimeReached,
  isWithinClassStartAlertWindow,
  type TeacherNextSessionInfo,
} from '../../services/liveClasses'
import { TeacherClassTimeOverlay } from './TeacherClassTimeOverlay'

function sessionSlotKey(session: TeacherNextSessionInfo) {
  return `${session.scheduleId}-${session.nextSessionAt}`
}

function hasStartAlertBeenHandled(key: string) {
  try {
    return sessionStorage.getItem(`yogstra-teacher-class-alert:${key}`) === '1'
  } catch {
    return false
  }
}

function markStartAlertHandled(key: string) {
  try {
    sessionStorage.setItem(`yogstra-teacher-class-alert:${key}`, '1')
  } catch {
    /* ignore */
  }
}

export function TeacherClassTimeProvider({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  const navigate = useNavigate()
  const location = useLocation()
  const teacherId = user?.role === 'teacher' ? user.id : ''
  const [alertSession, setAlertSession] = useState<TeacherNextSessionInfo | null>(null)
  const [nextSessionAt, setNextSessionAt] = useState<string | null>(null)
  const [visible, setVisible] = useState(false)
  const [starting, setStarting] = useState(false)
  const shownKeyRef = useRef<string | null>(null)

  const inClassRoom = location.pathname.includes('/dashboard/teacher/classes/room/')

  const refresh = useCallback(async () => {
    if (!teacherId) {
      setAlertSession(null)
      setNextSessionAt(null)
      setVisible(false)
      return
    }

    const next = await fetchTeacherNextSession(teacherId)
    setNextSessionAt(next?.nextSessionAt ?? null)

    if (!next?.nextSessionAt || !isClassStartTimeReached(next.nextSessionAt)) {
      setAlertSession(null)
      setVisible(false)
      return
    }

    const key = sessionSlotKey(next)

    if (hasStartAlertBeenHandled(key)) {
      setAlertSession(null)
      setVisible(false)
      return
    }

    if (!isWithinClassStartAlertWindow(next.nextSessionAt)) {
      markStartAlertHandled(key)
      setAlertSession(null)
      setVisible(false)
      return
    }

    setAlertSession(next)

    if (inClassRoom) {
      markStartAlertHandled(key)
      setVisible(false)
      shownKeyRef.current = key
      return
    }

    if (shownKeyRef.current !== key) {
      shownKeyRef.current = key
      markStartAlertHandled(key)
    }

    setVisible(true)
  }, [teacherId, inClassRoom])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useLiveSync(() => void refresh(), ['schedules', 'bookings'], Boolean(teacherId))

  useEffect(() => {
    if (!teacherId) return
    return subscribeToClassSessions(teacherId, 'teacher', () => {
      void refresh()
    })
  }, [teacherId, refresh])

  useScheduleBoundaryRefresh(
    nextSessionAt ? [nextSessionAt] : [],
    () => void refresh(),
    Boolean(teacherId),
  )

  useAppIntervalRefresh(() => void refresh(), Boolean(teacherId))

  const handleDismiss = () => {
    setVisible(false)
  }

  const handleStart = async () => {
    if (!teacherId || !alertSession || starting) return
    setStarting(true)
    try {
      const session = await createClassSession({
        teacherId,
        studentId: alertSession.id,
        scheduleId: alertSession.scheduleId,
      })
      setVisible(false)
      navigate(`/dashboard/teacher/classes/room/${session.id}`)
    } catch (err) {
      console.error('TeacherClassTimeProvider start class', err)
    } finally {
      setStarting(false)
    }
  }

  return (
    <>
      {children}
      {visible && alertSession && (
        <TeacherClassTimeOverlay
          studentName={alertSession.name}
          studentPhoto={alertSession.avatar}
          sessionTime={alertSession.nextSessionAt!}
          starting={starting}
          onStart={() => void handleStart()}
          onDismiss={handleDismiss}
        />
      )}
    </>
  )
}
