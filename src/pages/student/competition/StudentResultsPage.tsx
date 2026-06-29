import { Link, useParams } from 'react-router-dom'
import { Download, Medal } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentCompetitionResults } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { EmptyState } from '../../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { JudgeFeedbackCard } from '../../../components/student/competition/JudgeFeedbackCard'

export function StudentResultsPage() {
  const { id = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && id
        ? fetchStudentCompetitionResults(id, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, id],
    { enabled: Boolean(userId && id) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error) {
    return (
      <ErrorState
        title="Results unavailable"
        message={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data?.myResult) {
    return (
      <EmptyState
        title="Results not published yet"
        description="Check back after the competition concludes and scores are approved."
        action={
          <Link
            to={`/dashboard/student/competitions/${id}/timeline`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View timeline
          </Link>
        }
      />
    )
  }

  const { myResult, categoryResults, overallResults, judgeComments } = data
  const categoryRank = categoryResults.findIndex((r) => r.participantId === myResult.participantId) + 1
  const overallRank = overallResults.findIndex((r) => r.participantId === myResult.participantId) + 1

  const downloadResult = () => {
    const text = [
      `Competition Results`,
      `Rank: ${myResult.rank ?? 'N/A'}`,
      `Score: ${myResult.totalScore ?? 'N/A'}`,
      `Medal: ${myResult.medal ?? 'Participation'}`,
    ].join('\n')
    const blob = new Blob([text], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'competition-result.txt'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <>
      <PageHeader title="Your results" description="Performance summary and rankings." />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[16px] border border-border bg-elevated p-5 text-center">
          <Medal className="mx-auto h-8 w-8 text-accent" aria-hidden />
          <p className="mt-2 text-xs uppercase tracking-wide text-muted-foreground">Placement</p>
          <p className="font-heading text-3xl font-bold">
            {myResult.rank ? `#${myResult.rank}` : '—'}
          </p>
          {myResult.medal && (
            <p className="mt-1 text-sm capitalize text-muted-foreground">{myResult.medal}</p>
          )}
        </div>
        <div className="rounded-[16px] border border-border bg-elevated p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Total score</p>
          <p className="mt-2 font-heading text-3xl font-bold">
            {myResult.totalScore?.toFixed(2) ?? '—'}
          </p>
        </div>
        <div className="rounded-[16px] border border-border bg-elevated p-5 text-center">
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Category rank</p>
          <p className="mt-2 font-heading text-3xl font-bold">
            {categoryRank > 0 ? `#${categoryRank}` : '—'}
          </p>
          <p className="text-xs text-muted-foreground">Overall #{overallRank > 0 ? overallRank : '—'}</p>
        </div>
      </div>

      <div className="mb-6">
        <button
          type="button"
          onClick={downloadResult}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
        >
          <Download className="h-4 w-4" aria-hidden />
          Download result
        </button>
      </div>

      <DashboardCard title="Judge comments" className="mb-6">
        <JudgeFeedbackCard comments={judgeComments} enabled />
      </DashboardCard>

      <DashboardCard title="Category standings">
        <ol className="divide-y divide-border">
          {categoryResults.slice(0, 10).map((r, i) => (
            <li
              key={r.id}
              className={`flex items-center justify-between py-3 text-sm ${
                r.participantId === myResult.participantId ? 'font-semibold text-primary' : ''
              }`}
            >
              <span>
                {i + 1}. {r.participantName ?? 'Participant'}
              </span>
              <span>{r.totalScore?.toFixed(2) ?? '—'}</span>
            </li>
          ))}
        </ol>
      </DashboardCard>
    </>
  )
}
