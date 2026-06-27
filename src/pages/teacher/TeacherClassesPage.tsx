import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Video, Clock, Users } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveSync } from '../../hooks/useLiveSync'
import {
  fetchScheduledStudentNow,
  fetchTeacherPaidStudents,
  type PaidCoachingStudent,
} from '../../services/liveClasses'
import {
  createClassSession,
  fetchClassSession,
  subscribeToClassSessions,
} from '../../services/classSessions'
import { LiveClassRoom } from '../../components/classes/LiveClassRoom'
import { Avatar } from '../../components/ui/Avatar'
import { Button } from '../../components/ui/Button'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { formatTime } from '../../utils/format'
import { studentProfilePath } from '../../utils/chatRoutes'

export function TeacherClassesPage() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''
  const [conducting, setConducting] = useState(false)
  const [activeRoomSessionId, setActiveRoomSessionId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const { data: students, loading, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherPaidStudents(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  const { data: scheduledNow, refetch: refetchScheduled } = useAsyncData(
    () => (teacherId ? fetchScheduledStudentNow(teacherId) : Promise.resolve(null)),
    [teacherId],
  )

  const { data: roomSession } = useAsyncData(
    () => (activeRoomSessionId ? fetchClassSession(activeRoomSessionId) : Promise.resolve(null)),
    [activeRoomSessionId],
  )

  useLiveSync(refetch, ['bookings', 'schedules'], Boolean(teacherId))
  useLiveSync(refetchScheduled, ['schedules'], Boolean(teacherId))

  useEffect(() => {
    if (!teacherId) return
    return subscribeToClassSessions(teacherId, 'teacher', () => {
      void refetch(true)
      void refetchScheduled(true)
    })
  }, [teacherId, refetch, refetchScheduled])

  const scheduledStudent = scheduledNow ?? null

  const handleConductClass = async (student: PaidCoachingStudent) => {
    if (!teacherId || !student.isScheduledNow) return
    setConducting(true)
    setError(null)
    try {
      const session = await createClassSession({
        teacherId,
        studentId: student.id,
        scheduleId: student.scheduleId,
      })
      setActiveRoomSessionId(session.id)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start the class.')
    } finally {
      setConducting(false)
    }
  }

  if (roomSession && user) {
    return (
      <LiveClassRoom
        session={roomSession}
        participantName={user.name}
        participantId={user.id}
        onLeave={() => {
          setActiveRoomSessionId(null)
          void refetch(true)
        }}
      />
    )
  }

  return (
    <div className="p-6 sm:p-8 max-w-6xl mx-auto">
      <div className="flex items-center gap-2 mb-2">
        <Video size={22} className="text-teal" />
        <h1 className="font-heading text-2xl sm:text-3xl font-medium">Classes</h1>
      </div>
      <p className="text-sm text-charcoal/55 mb-8">
        Only students who paid for your coaching appear here. Start a video class when their
        session time arrives.
      </p>

      {error && (
        <p className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <Users size={16} className="text-teal" />
            <h2 className="font-medium text-sm">Paid students</h2>
          </div>

          {loading ? (
            <TeacherTableSkeleton rows={4} />
          ) : (students ?? []).length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-charcoal/50 text-sm">No paid students yet.</p>
              <p className="text-charcoal/40 text-xs mt-2">
                Students appear here after they complete payment for your class.
              </p>
            </Card>
          ) : (
            students!.map((student) => (
              <Card
                key={student.id}
                className={`p-4 flex items-center justify-between gap-4 transition-colors ${
                  scheduledStudent?.id === student.id ? 'border-teal/50 bg-teal-soft/30' : ''
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <Avatar src={student.avatar} name={student.name} size={48} />
                  <div className="min-w-0">
                    <p className="font-medium truncate">{student.name}</p>
                    {student.nextSessionAt ? (
                      <p className="text-xs text-charcoal/50 flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        Next: {formatTime(student.nextSessionAt)}{' '}
                        {new Date(student.nextSessionAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </p>
                    ) : (
                      <p className="text-xs text-charcoal/45 mt-0.5">No upcoming session</p>
                    )}
                  </div>
                </div>
                {student.isScheduledNow && (
                  <Badge className="shrink-0 bg-teal text-cream">Now</Badge>
                )}
              </Card>
            ))
          )}
        </div>

        <div>
          <Card className="p-5 sticky top-6">
            <h2 className="font-medium text-sm mb-4 flex items-center gap-2">
              <Clock size={16} className="text-teal" />
              Scheduled now
            </h2>

            {!scheduledStudent ? (
              <p className="text-sm text-charcoal/50">
                When a paid student&apos;s session window opens (15 min before their scheduled
                time), their profile appears here so you can start the video class.
              </p>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center text-center">
                  <Avatar src={scheduledStudent.avatar} name={scheduledStudent.name} size={72} />
                  <p className="font-semibold mt-3">{scheduledStudent.name}</p>
                  {scheduledStudent.nextSessionAt && (
                    <p className="text-xs text-charcoal/50 mt-1">
                      Session: {formatTime(scheduledStudent.nextSessionAt)}
                    </p>
                  )}
                  <Badge className="mt-2 bg-teal text-cream">In session window</Badge>
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={conducting || !scheduledStudent.isScheduledNow}
                  onClick={() => void handleConductClass(scheduledStudent)}
                >
                  <Video size={18} />
                  {conducting ? 'Starting…' : 'Conduct a class'}
                </Button>

                <Link
                  to={studentProfilePath(scheduledStudent.id, 'teacher')}
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
  )
}
