import { useCallback, useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { CalendarClock, Clock, Video } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveSync } from '../../hooks/useLiveSync'
import { useScheduleBoundaryRefresh } from '../../hooks/useScheduleBoundaryRefresh'
import { useStudentCoachingAccess } from '../../hooks/useStudentCoachingAccess'
import { fetchStudentCoachingTeachers } from '../../services/liveClasses'
import {
  fetchClassSession,
  fetchStudentActiveSessions,
  subscribeToClassSessions,
  type ClassSession,
} from '../../services/classSessions'
import { LiveClassRoom } from '../../components/classes/LiveClassRoom'
import { RequestScheduleChangeModal } from '../../components/classes/RequestScheduleChangeModal'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'
import { ProfilePageSkeleton } from '../../components/ui/Skeleton'
import { formatTime } from '../../utils/format'
import {
  cancelScheduleChangeRequest,
  fetchStudentScheduleChangeRequests,
  formatScheduleChangeSummary,
  type ScheduleChangeRequest,
} from '../../services/scheduleChangeRequests'

interface StudentClassesPageProps {
  roomSessionId?: string
}

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export function StudentClassesPage(_props: StudentClassesPageProps) {
  const { sessionId: routeSessionId } = useParams()
  const roomSessionId = routeSessionId
  const { user } = useApp()
  const navigate = useNavigate()
  const studentId = user?.id ?? ''
  const { hasAccess, loading: accessLoading } = useStudentCoachingAccess(studentId)
  const [changeModalTeacher, setChangeModalTeacher] = useState<{
    id: string
    name: string
  } | null>(null)
  const [infoToast, setInfoToast] = useState<string | null>(null)

  const { data: teachers, loading, refetch } = useAsyncData(
    () => (studentId ? fetchStudentCoachingTeachers(studentId) : Promise.resolve([])),
    [studentId],
  )

  const { data: activeSessions, refetch: refetchSessions } = useAsyncData(
    () => (studentId ? fetchStudentActiveSessions(studentId) : Promise.resolve([])),
    [studentId],
  )

  const { data: changeRequests, refetch: refetchRequests } = useAsyncData(
    () => (studentId ? fetchStudentScheduleChangeRequests(studentId) : Promise.resolve([])),
    [studentId],
  )

  const { data: roomSession } = useAsyncData(
    () => (roomSessionId ? fetchClassSession(roomSessionId) : Promise.resolve(null)),
    [roomSessionId],
  )

  useLiveSync(refetch, ['bookings', 'schedules'], Boolean(studentId))
  useLiveSync(refetchSessions, ['schedules', 'classSessions'], Boolean(studentId))
  useLiveSync(refetchRequests, ['schedules'], Boolean(studentId))

  useEffect(() => {
    if (!studentId) return
    return subscribeToClassSessions(studentId, 'student', () => {
      void refetchSessions(true)
    })
  }, [studentId, refetchSessions])

  const silentRefreshAll = useCallback(() => {
    void refetch(true)
    void refetchSessions(true)
    void refetchRequests(true)
  }, [refetch, refetchSessions, refetchRequests])

  const scheduleTimes = (teachers ?? []).flatMap((t) =>
    [t.currentSessionAt, t.nextSessionAt].filter(Boolean),
  )

  useScheduleBoundaryRefresh(scheduleTimes, silentRefreshAll, Boolean(studentId))

  const liveSession =
    (activeSessions ?? []).find(
      (s) => s.status === 'active' || (s.status === 'ringing' && s.startedAt),
    ) ?? null
  const coachInWindow = (teachers ?? []).find((t) => t.isScheduledNow) ?? null
  const pendingByTeacher = new Map(
    (changeRequests ?? [])
      .filter((r) => r.status === 'pending')
      .map((r) => [r.teacherId, r]),
  )

  const handleCancelRequest = async (request: ScheduleChangeRequest) => {
    await cancelScheduleChangeRequest(request.id, studentId)
    await refetchRequests(true)
  }

  const handleRejoin = (session: ClassSession) => {
    navigate(`/dashboard/student/classes/room/${session.id}`)
  }

  if (accessLoading || loading) {
    return <ProfilePageSkeleton />
  }

  if (!hasAccess) {
    return <Navigate to="/dashboard/student/explore" replace />
  }

  if (roomSession && user && roomSession.studentId === user.id) {
    return (
      <>
        {infoToast && (
          <Toast message={infoToast} type="info" onClose={() => setInfoToast(null)} />
        )}
        <LiveClassRoom
          session={roomSession}
          participantName={user.name}
          participantId={user.id}
          role="student"
          onRemoteEnd={(status) => {
            if (status === 'ended') {
              setInfoToast('Your teacher ended the class.')
            }
          }}
          onLeave={() => navigate('/dashboard/student/classes')}
        />
      </>
    )
  }

  return (
    <>
      {infoToast && (
        <Toast message={infoToast} type="info" onClose={() => setInfoToast(null)} />
      )}
      <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Video size={22} className="text-teal" />
          <h1 className="font-heading text-2xl sm:text-3xl font-medium">Classes</h1>
        </div>
        <p className="text-sm text-charcoal/55 mb-8">
          Join live video sessions when your teacher starts class. You&apos;ll get an incoming call
          notification.
        </p>

        {liveSession && (
          <Card className="p-5 mb-6 border-teal/50 bg-teal-soft/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-teal text-cream">Live now</Badge>
            </div>
            <p className="font-medium mb-1">
              Class in progress with {liveSession.teacherName ?? 'your teacher'}
            </p>
            <p className="text-xs text-charcoal/55 mb-4">
              Your teacher is in the video room. Rejoin if you stepped out.
            </p>
            <Button className="gap-2" onClick={() => handleRejoin(liveSession)}>
              <Video size={18} />
              Rejoin class
            </Button>
          </Card>
        )}

        {!liveSession && coachInWindow && (
          <Card className="p-5 mb-6 border-teal/40 bg-teal-soft/30">
            <div className="flex items-center gap-2 mb-3">
              <Clock size={16} className="text-teal" />
              <h2 className="font-medium text-sm">Scheduled now</h2>
              <Badge className="bg-teal text-cream ml-auto">In session window</Badge>
            </div>
            <div className="flex items-center gap-3">
              <Avatar src={coachInWindow.photo} name={coachInWindow.name} size={56} />
              <div>
                <p className="font-semibold">{coachInWindow.name}</p>
                {coachInWindow.currentSessionAt && (
                  <p className="text-xs text-charcoal/55 mt-0.5">
                    Session: {formatTime(coachInWindow.currentSessionAt)}{' '}
                    {formatSessionDate(coachInWindow.currentSessionAt)}
                  </p>
                )}
                <p className="text-xs text-charcoal/45 mt-1">
                  Wait for your teacher to start the call — you&apos;ll get a ring notification.
                </p>
              </div>
            </div>
          </Card>
        )}

        <div className="space-y-3">
          <h2 className="font-medium text-sm">Your coaches</h2>
          {(teachers ?? []).length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-charcoal/50 text-sm">No active coaching yet.</p>
            </Card>
          ) : (
            teachers!.map((teacher) => {
              const pending = pendingByTeacher.get(teacher.id)
              const teacherLiveSession = liveSession?.teacherId === teacher.id ? liveSession : null

              return (
                <Card
                  key={teacher.id}
                  className={`p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${
                    teacher.isScheduledNow ? 'border-teal/40 bg-teal-soft/20' : ''
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar src={teacher.photo} name={teacher.name} size={48} />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium">{teacher.name}</p>
                        {teacher.isScheduledNow && (
                          <Badge className="bg-teal text-cream text-[10px]">Now</Badge>
                        )}
                      </div>
                      {teacher.isScheduledNow && teacher.currentSessionAt ? (
                        <p className="text-xs text-teal-dark font-medium flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          Current session: {formatTime(teacher.currentSessionAt)}{' '}
                          {formatSessionDate(teacher.currentSessionAt)}
                        </p>
                      ) : teacher.nextSessionAt ? (
                        <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
                          <Clock size={12} />
                          Next session: {formatTime(teacher.nextSessionAt)}{' '}
                          {formatSessionDate(teacher.nextSessionAt)}
                        </p>
                      ) : (
                        <p className="text-xs text-charcoal/45 mt-0.5">Awaiting schedule</p>
                      )}
                      {pending && (
                        <p className="text-xs text-amber-700 mt-1">
                          Timing change pending approval
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 shrink-0">
                    {teacherLiveSession ? (
                      <Button
                        size="sm"
                        className="gap-1.5"
                        onClick={() => handleRejoin(teacherLiveSession)}
                      >
                        <Video size={14} />
                        Rejoin
                      </Button>
                    ) : pending ? (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => void handleCancelRequest(pending)}
                      >
                        Cancel request
                      </Button>
                    ) : (
                      <Button
                        variant="secondary"
                        size="sm"
                        className="gap-1.5"
                        onClick={() =>
                          setChangeModalTeacher({ id: teacher.id, name: teacher.name })
                        }
                      >
                        <CalendarClock size={14} />
                        Change timing
                      </Button>
                    )}
                  </div>
                </Card>
              )
            })
          )}
        </div>

        {(changeRequests ?? []).some((r) => r.status !== 'pending') && (
          <div className="space-y-2 mt-8">
            <h2 className="font-medium text-sm text-charcoal/70">Timing change history</h2>
            {(changeRequests ?? [])
              .filter((r) => r.status !== 'pending')
              .slice(0, 3)
              .map((request) => (
                <Card key={request.id} className="p-3 text-sm">
                  <p className="font-medium">{request.teacherName ?? 'Coach'}</p>
                  <p className="text-xs text-charcoal/55 mt-1">
                    {formatScheduleChangeSummary(request)} —{' '}
                    <span
                      className={
                        request.status === 'approved'
                          ? 'text-teal font-medium'
                          : 'text-charcoal/45'
                      }
                    >
                      {request.status}
                    </span>
                  </p>
                </Card>
              ))}
          </div>
        )}

        {changeModalTeacher && (
          <RequestScheduleChangeModal
            isOpen
            onClose={() => setChangeModalTeacher(null)}
            studentId={studentId}
            teacherId={changeModalTeacher.id}
            teacherName={changeModalTeacher.name}
            onSubmitted={() => {
              void refetch(true)
              void refetchRequests(true)
            }}
          />
        )}
      </div>
    </>
  )
}
