import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentRankingsPage } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { RankingCard } from '../../../components/student/competition/RankingCard'

export function StudentRankingsPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchStudentRankingsPage(userId)
        : Promise.reject(new Error('Not signed in')),
    [userId],
    { enabled: Boolean(userId) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return <ErrorState title="Could not load rankings" message={error ?? 'Please try again.'} onRetry={() => void refetch()} />
  }

  return (
    <div className="student-competition py-4 sm:py-6">
      <PageHeader title="Rankings" description="Track your standing across levels." />

      <div className="mb-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RankingCard label="Current ranking" rank={data.currentRank} scope="Your latest standing" />
        <RankingCard label="Best ranking" rank={data.bestRank} scope="Personal best" trend="up" />
        <RankingCard label="Overall" rank={data.studentRank} scope="Student leaderboard" />
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <RankingCard label="Category" rank={data.categoryRank} scope="Within category" />
        <RankingCard label="Academy" rank={data.academyRank} scope="Academy level" />
        <RankingCard label="State" rank={data.stateRank} scope="State level" trend="flat" />
        <RankingCard label="National" rank={data.nationalRank} scope="National level" trend="up" />
      </div>

      {data.history.length > 0 && (
        <DashboardCard title="Ranking history" className="mb-8">
          <ul className="divide-y divide-border" role="list">
            {data.history.map((entry) => (
              <li key={entry.id} className="flex items-center justify-between py-3 text-sm">
                <span>{entry.season ?? 'Season'} · {entry.scope}</span>
                <span className="font-semibold">#{entry.rank} · {entry.points} pts</span>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      {data.leaderboard.length > 0 && (
        <DashboardCard title="Student leaderboard">
          <ol className="divide-y divide-border">
            {data.leaderboard.map((entry) => (
              <li
                key={entry.id}
                className={`flex items-center justify-between py-3 text-sm ${entry.subjectId === userId ? 'font-semibold text-primary' : ''}`}
              >
                <span>#{entry.rank}</span>
                <span>{entry.points} pts</span>
              </li>
            ))}
          </ol>
        </DashboardCard>
      )}
    </div>
  )
}
