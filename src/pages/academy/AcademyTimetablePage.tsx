import { Calendar } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { fetchAcademyTimetable } from '../../services/academyTimetableService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { EmptyState } from '../../components/shell/EmptyState'
import { formatTime } from '../../utils/format'

export function AcademyTimetablePage() {
  const { academyId } = useAcademyContext()

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      academyId
        ? fetchAcademyTimetable(academyId)
        : Promise.reject(new Error('No academy selected')),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  if (loading) return <LoadingSkeleton />
  if (error || !data) {
    return (
      <PageContainer width="wide">
        <ErrorState message={error ?? 'Could not load timetable.'} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Timetable"
        description="Upcoming class schedules for academy-affiliated teachers."
      />

      {data.sessions.length === 0 ? (
        <EmptyState
          icon={<Calendar size={24} />}
          title="No scheduled classes"
          description="Schedules appear when teachers have active student bookings."
        />
      ) : (
        <div className="overflow-x-auto rounded-[16px] border border-border">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-border text-left text-muted-foreground">
                <th className="px-4 py-3 font-medium">When</th>
                <th className="px-4 py-3 font-medium">Teacher</th>
                <th className="px-4 py-3 font-medium">Student</th>
                <th className="px-4 py-3 font-medium">Class</th>
              </tr>
            </thead>
            <tbody>
              {data.sessions.map((session) => (
                <tr key={session.id} className="border-b border-border/60">
                  <td className="px-4 py-3">
                    {new Date(session.scheduledAt).toLocaleDateString('en-IN', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                    })}{' '}
                    · {formatTime(session.scheduledAt)}
                  </td>
                  <td className="px-4 py-3">{session.teacherName}</td>
                  <td className="px-4 py-3">{session.studentName}</td>
                  <td className="px-4 py-3">{session.classType}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  )
}
