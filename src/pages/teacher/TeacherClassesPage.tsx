import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Video, Clock, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveSync } from '../../hooks/useLiveSync'
import { useAppIntervalRefresh } from '../../hooks/useIntervalRefresh'
import { useScheduleBoundaryRefresh } from '../../hooks/useScheduleBoundaryRefresh'
import {
  fetchTeacherNextSession,
  fetchTeacherPaidStudents,
  isTeacherClassHour,
  type TeacherNextSessionInfo,
} from '../../services/liveClasses'
import {
  createClassSession,
  fetchClassSession,
  fetchTeacherActiveSessions,
  subscribeToClassSessions,
  type ClassSession,
  type ClassSessionStatus,
} from '../../services/classSessions'
import { LiveClassRoom } from '../../components/classes/LiveClassRoom'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { Toast } from '../../components/ui/Toast'
import { formatTime } from '../../utils/format'
import { studentProfilePath } from '../../utils/chatRoutes'

function formatSessionDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

function sessionEndsAtLabel(scheduledAt: string) {
  const end = new Date(new Date(scheduledAt).getTime() + 60 * 60_000)
  return `${formatTime(end.toISOString())} · ${formatSessionDate(end.toISOString())}`
}

export function TeacherClassesPage() {
  const { sessionId: routeSessionId } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()
  const teacherId = user?.id ?? ''
  const [infoToast, setInfoToast] = useState<string | null>(null)
  const [joining, setJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: students, loading, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherPaidStudents(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  const { data: nextSession, refetch: refetchNext } = useAsyncData(
    () => (teacherId ? fetchTeacherNextSession(teacherId) : Promise.resolve(null)),
    [teacherId],
  )

  const { data: activeSessions, refetch: refetchSessions } = useAsyncData(
    () => (teacherId ? fetchTeacherActiveSessions(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  const { data: roomSession } = useAsyncData(
    () => (routeSessionId ? fetchClassSession(routeSessionId) : Promise.resolve(null)),
    [routeSessionId],
  )

  useLiveSync(refetch, ['bookings', 'schedules'], Boolean(teacherId))
  useLiveSync(refetchNext, ['schedules'], Boolean(teacherId))
  useLiveSync(refetchSessions, ['classSessions'], Boolean(teacherId))

  useEffect(() => {
    if (!teacherId) return
    return subscribeToClassSessions(teacherId, 'teacher', () => {
      void refetch(true)
      void refetchNext(true)
      void refetchSessions(true)
    })
  }, [teacherId, refetch, refetchNext, refetchSessions])

  const silentRefreshAll = useCallback(() => {
    void refetch(true)
    void refetchNext(true)
    void refetchSessions(true)
  }, [refetch, refetchNext, refetchSessions])

  const scheduleTimes = [
    ...(students ?? []).map((s) => s.nextSessionAt),
    nextSession?.nextSessionAt,
  ]

  useScheduleBoundaryRefresh(scheduleTimes, silentRefreshAll, Boolean(teacherId))

  useAppIntervalRefresh(silentRefreshAll, Boolean(teacherId))

  const activeHourSession: TeacherNextSessionInfo | null =
    nextSession?.sessionPhase === 'active' ? nextSession : null

  const liveSessionForActiveHour =
    activeHourSession && activeSessions
      ? (activeSessions.find(
          (s) =>
            s.studentId === activeHourSession.id &&
            (s.status === 'active' || s.status === 'ringing'),
        ) ?? null)
      : null

  const sortedStudents = [...(students ?? [])].sort((a, b) => {
    if (!a.nextSessionAt && !b.nextSessionAt) return a.name.localeCompare(b.name)
    if (!a.nextSessionAt) return 1
    if (!b.nextSessionAt) return -1
    return new Date(a.nextSessionAt).getTime() - new Date(b.nextSessionAt).getTime()
  })

  const handleJoinClass = async (student: TeacherNextSessionInfo, existing?: ClassSession | null) => {
    if (!teacherId || !student.nextSessionAt || !isTeacherClassHour(student.nextSessionAt)) return

    if (existing) {
      navigate(`/dashboard/teacher/classes/room/${existing.id}`)
      return
    }

    setJoining(true)
    setError(null)
    try {
      const session = await createClassSession({
        teacherId,
        studentId: student.id,
        scheduleId: student.scheduleId,
      })
      navigate(`/dashboard/teacher/classes/room/${session.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not join the class.')
    } finally {
      setJoining(false)
    }
  }

  if (roomSession && user && roomSession.teacherId === user.id) {
    return (
      <>
        {infoToast && (
          <Toast message={infoToast} type="info" onClose={() => setInfoToast(null)} />
        )}
        <LiveClassRoom
          session={roomSession}
          participantName={user.name}
          participantId={user.id}
          role="teacher"
          onRemoteEnd={(status: ClassSessionStatus) => {
            if (status === 'declined') {
              setInfoToast('Call rejected by the student.')
            }
          }}
          onLeave={() => {
            navigate('/dashboard/teacher/classes')
            void refetch(true)
            void refetchNext(true)
            void refetchSessions(true)
          }}
          onBackToClasses={() => {
            navigate('/dashboard/teacher/classes')
            void refetchNext(true)
            void refetchSessions(true)
          }}
        />
      </>
    )
  }

  return (
    <>
      {infoToast && (
        <Toast message={infoToast} type="info" onClose={() => setInfoToast(null)} />
      )}
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="flex items-center gap-2 mb-2">
          <Video size={22} className="text-teal" />
          <h1 className="font-heading text-2xl sm:text-3xl font-medium">Classes</h1>
        </div>
        <p className="text-sm text-charcoal/55 mb-8">
          Your paid students and upcoming session times appear here. When a class starts, you&apos;ll
          get a one-time notification — rejoin from this page anytime during the 1-hour session.
        </p>

        {error && (
          <p className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        {activeHourSession && (
          <Card className="p-5 mb-6 border-teal/50 bg-teal-soft/50">
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-teal text-cream">Class in progress</Badge>
            </div>
            <p className="font-medium mb-1">
              {activeHourSession.name}&apos;s session · until{' '}
              {sessionEndsAtLabel(activeHourSession.nextSessionAt!)}
            </p>
            <p className="text-xs text-charcoal/55 mb-4">
              {liveSessionForActiveHour
                ? 'Your student may still be in the video room. Rejoin to continue — the call is not closed when the hour ends.'
                : 'Join before the 1-hour window ends. If you are already in the call, it will stay open after the hour.'}
            </p>
            <Button
              className="gap-2"
              disabled={joining}
              onClick={() => void handleJoinClass(activeHourSession, liveSessionForActiveHour)}
            >
              <Video size={18} />
              {joining
                ? 'Joining…'
                : liveSessionForActiveHour
                  ? 'Rejoin class'
                  : 'Start class'}
            </Button>
          </Card>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-3">
            <div className="flex items-center gap-2 mb-2">
              <Users size={16} className="text-teal" />
              <h2 className="font-medium text-sm">Paid students</h2>
            </div>

            {loading ? (
              <TeacherTableSkeleton rows={4} />
            ) : sortedStudents.length === 0 ? (
              <Card className="p-8 text-center">
                <p className="text-charcoal/50 text-sm">No paid students yet.</p>
                <p className="text-charcoal/40 text-xs mt-2">
                  Students appear here after they complete payment for your class.
                </p>
              </Card>
            ) : (
              sortedStudents.map((student) => {
                const inHour =
                  student.nextSessionAt && isTeacherClassHour(student.nextSessionAt)
                const studentLive = inHour
                  ? activeSessions?.find(
                      (s) =>
                        s.studentId === student.id &&
                        (s.status === 'active' || s.status === 'ringing'),
                    )
                  : null

                return (
                  <Card key={student.id} className="p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <Avatar src={student.avatar} name={student.name} size={48} />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{student.name}</p>
                        {student.nextSessionAt ? (
                          <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
                            <Clock size={12} />
                            Next: {formatTime(student.nextSessionAt)}{' '}
                            {formatSessionDate(student.nextSessionAt)}
                          </p>
                        ) : (
                          <p className="text-xs text-charcoal/45 mt-0.5">No upcoming session</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {inHour && (
                        <>
                          <Badge className="bg-teal text-cream">Class time</Badge>
                          <Button
                            size="sm"
                            className="gap-1.5"
                            disabled={joining}
                            onClick={() =>
                              void handleJoinClass(
                                {
                                  ...student,
                                  sessionPhase: 'active',
                                },
                                studentLive,
                              )
                            }
                          >
                            <Video size={14} />
                            {studentLive ? 'Rejoin' : 'Start'}
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                )
              })
            )}
          </div>

          <div>
            <Card className="p-5 sticky top-6">
              <h2 className="font-medium text-sm mb-4 flex items-center gap-2">
                <Clock size={16} className="text-teal" />
                Next session
              </h2>

              {!nextSession ? (
                <p className="text-sm text-charcoal/50">
                  When a student has an upcoming class, their name and session time will show here.
                  At the scheduled start time you&apos;ll receive a notification to begin the class.
                </p>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-col items-center text-center">
                    <Avatar src={nextSession.avatar} name={nextSession.name} size={72} />
                    <p className="font-semibold mt-3">{nextSession.name}</p>
                    {nextSession.nextSessionAt && (
                      <p className="text-xs text-charcoal/50 mt-1">
                        {formatTime(nextSession.nextSessionAt)} ·{' '}
                        {formatSessionDate(nextSession.nextSessionAt)}
                      </p>
                    )}
                    <Badge className="mt-2 bg-teal text-cream">
                      {nextSession.sessionPhase === 'active'
                        ? 'Class time'
                        : nextSession.sessionPhase === 'upcoming'
                          ? 'Upcoming'
                          : 'Ended'}
                    </Badge>
                  </div>

                  {nextSession.sessionPhase === 'active' ? (
                    <>
                      <p className="text-xs text-charcoal/50 text-center leading-relaxed">
                        Rejoin available until {sessionEndsAtLabel(nextSession.nextSessionAt!)}.
                      </p>
                      <Button
                        className="w-full gap-2"
                        disabled={joining}
                        onClick={() =>
                          void handleJoinClass(nextSession, liveSessionForActiveHour)
                        }
                      >
                        <Video size={18} />
                        {joining
                          ? 'Joining…'
                          : liveSessionForActiveHour
                            ? 'Rejoin class'
                            : 'Start class'}
                      </Button>
                    </>
                  ) : (
                    <p className="text-xs text-charcoal/50 text-center leading-relaxed">
                      You&apos;ll get a one-time ring notification at the scheduled start time.
                    </p>
                  )}

                  <Link
                    to={studentProfilePath(nextSession.id, 'teacher')}
                    className="block text-center text-xs text-teal font-medium hover:underline"
                  >
                    View student profile
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </>
  )
}
