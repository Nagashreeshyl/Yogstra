import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherCompetitionOverview } from '../../services/teacherCompetitionService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { EmptyState } from '../../components/shell/EmptyState'
import { Badge } from '../../components/ui/Badge'

export function TeacherCompetitionsPage() {
  const { user } = useApp()

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      user?.id
        ? fetchTeacherCompetitionOverview(user.id)
        : Promise.reject(new Error('Not signed in')),
    [user?.id],
    { enabled: Boolean(user?.id) },
  )

  if (loading) return <LoadingSkeleton />
  if (error || !data) {
    return (
      <PageContainer width="wide">
        <ErrorState message={error ?? 'Could not load competitions.'} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="wide">
      <PageHeader
        title="Student competitions"
        description="Track your students' registrations, preparation, and results."
      />

      {data.students.length === 0 ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="No active students"
          description="Students appear here after they purchase coaching from you."
        />
      ) : (
        <div className="space-y-4">
          {data.students.map((student) => (
            <DashboardCard key={student.studentId} title={student.studentName}>
              {student.competitions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No competition registrations yet.</p>
              ) : (
                <ul className="space-y-2">
                  {student.competitions.map((comp) => (
                    <li
                      key={comp.registrationId}
                      className="flex flex-wrap items-center justify-between gap-2 rounded-[12px] border border-border px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium">{comp.competitionName}</p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {comp.status} · {comp.paymentStatus}
                          {!comp.documentsVerified && ' · docs pending'}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Badge>{comp.resultStatus ?? 'In progress'}</Badge>
                        {comp.rank && <Badge>Rank #{comp.rank}</Badge>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardCard>
          ))}
        </div>
      )}

      {data.publishedResults.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-3">Recent published results</h2>
          <ul className="space-y-2">
            {data.publishedResults.map((result) => (
              <li key={result.id} className="text-sm rounded-[12px] border border-border px-3 py-2">
                {result.studentName} — {result.competitionName} · Rank {result.rank ?? '—'}
              </li>
            ))}
          </ul>
          <Link to="/dashboard/results" className="text-sm text-primary hover:underline mt-2 inline-block">
            View all results
          </Link>
        </div>
      )}
    </PageContainer>
  )
}
