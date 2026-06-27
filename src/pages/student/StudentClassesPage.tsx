import { useEffect } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Clock, Video } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveSync } from '../../hooks/useLiveSync'
import { useStudentCoachingAccess } from '../../hooks/useStudentCoachingAccess'
import {
  fetchStudentCoachingTeachers,
} from '../../services/liveClasses'
import {
  fetchClassSession,
  fetchStudentActiveSessions,
  subscribeToClassSessions,
  updateClassSessionStatus,
} from '../../services/classSessions'
import { LiveClassRoom } from '../../components/classes/LiveClassRoom'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { ProfilePageSkeleton } from '../../components/ui/Skeleton'
import { formatTime } from '../../utils/format'

interface StudentClassesPageProps {
  roomSessionId?: string
}

export function StudentClassesPage(_props: StudentClassesPageProps) {
  const { sessionId: routeSessionId } = useParams()
  const roomSessionId = routeSessionId
  const { user } = useApp()
  const navigate = useNavigate()
  const studentId = user?.id ?? ''
  const { hasAccess, loading: accessLoading } = useStudentCoachingAccess(studentId)

  const { data: teachers, loading, refetch } = useAsyncData(
    () => (studentId ? fetchStudentCoachingTeachers(studentId) : Promise.resolve([])),
    [studentId],
  )

  const { data: activeSessions, refetch: refetchSessions } = useAsyncData(
    () => (studentId ? fetchStudentActiveSessions(studentId) : Promise.resolve([])),
    [studentId],
  )

  const { data: roomSession } = useAsyncData(
    () => (roomSessionId ? fetchClassSession(roomSessionId) : Promise.resolve(null)),
    [roomSessionId],
  )

  useLiveSync(refetch, ['bookings', 'schedules'], Boolean(studentId))
  useLiveSync(refetchSessions, ['schedules'], Boolean(studentId))

  useEffect(() => {
    if (!studentId) return
    return subscribeToClassSessions(studentId, 'student', () => {
      void refetchSessions(true)
    })
  }, [studentId, refetchSessions])

  const joinableSession = (activeSessions ?? []).find((s) => s.status === 'active')

  const handleJoinActive = async (sessionId: string) => {
    await updateClassSessionStatus(sessionId, 'active', {
      startedAt: new Date().toISOString(),
    })
    navigate(`/dashboard/student/classes/room/${sessionId}`)
  }

  if (accessLoading || loading) {
    return <ProfilePageSkeleton />
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard/student/explore" replace />
  }

  if (roomSession && user && roomSession.studentId === user.id) {
    return (
      <LiveClassRoom
        session={roomSession}
        participantName={user.name}
        participantId={user.id}
        onLeave={() => navigate('/dashboard/student/classes')}
      />
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Video size={22} className="text-teal" />
        <h1 className="font-heading text-2xl sm:text-3xl font-medium">Classes</h1>
      </div>
      <p className="text-sm text-charcoal/55 mb-8">
        Join live video sessions when your teacher starts class. You&apos;ll get an incoming call
        notification.
      </p>

      {joinableSession && (
        <Card className="p-5 mb-6 border-teal/40 bg-teal-soft/40">
          <p className="text-sm font-medium mb-2">Class in progress</p>
          <p className="text-xs text-charcoal/55 mb-4">
            {joinableSession.teacherName ?? 'Your teacher'} is waiting in the video room.
          </p>
          <Button
            className="gap-2"
            onClick={() => void handleJoinActive(joinableSession.id)}
          >
            <Video size={18} />
            Join class now
          </Button>
        </Card>
      )}

      <div className="space-y-3">
        <h2 className="font-medium text-sm">Your coaches</h2>
        {(teachers ?? []).length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-charcoal/50 text-sm">No active coaching yet.</p>
          </Card>
        ) : (
          teachers!.map((teacher) => (
            <Card key={teacher.id} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Avatar src={teacher.photo} name={teacher.name} size={48} />
                <div>
                  <p className="font-medium">{teacher.name}</p>
                  {teacher.nextSessionAt ? (
                    <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
                      <Clock size={12} />
                      Next session: {formatTime(teacher.nextSessionAt)}{' '}
                      {new Date(teacher.nextSessionAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                      })}
                    </p>
                  ) : (
                    <p className="text-xs text-charcoal/45 mt-0.5">Awaiting schedule</p>
                  )}
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}

export function StudentClassesGuard({ children }: { children: React.ReactNode }) {
  const { user } = useApp()
  const { hasAccess, loading } = useStudentCoachingAccess(user?.id)

  if (loading) return <ProfilePageSkeleton />
  if (!hasAccess) return <Navigate to="/dashboard/student/explore" replace />
  return children
}
