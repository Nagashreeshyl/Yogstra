import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchStudentRankings,
  fetchTeacherRankings,
  fetchAcademyRankings,
  fetchStateRankings,
  fetchNationalRankings,
} from '../../services/rankingService'
import type { CompetitionRanking } from '../../domain/competition/models'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'

type RankingTab = 'student' | 'teacher' | 'academy' | 'state' | 'national'

const TABS: { id: RankingTab; label: string }[] = [
  { id: 'student', label: 'Students' },
  { id: 'teacher', label: 'Teachers' },
  { id: 'academy', label: 'Academies' },
  { id: 'state', label: 'State' },
  { id: 'national', label: 'National' },
]

async function fetchRankingsForTab(tab: RankingTab): Promise<CompetitionRanking[]> {
  switch (tab) {
    case 'student':
      return fetchStudentRankings()
    case 'teacher':
      return fetchTeacherRankings()
    case 'academy':
      return fetchAcademyRankings()
    case 'state':
      return fetchStateRankings()
    case 'national':
      return fetchNationalRankings()
  }
}

export function CompetitionRankingsPage() {
  const [tab, setTab] = useState<RankingTab>('student')

  const { data, loading, error, refetch } = useAsyncData(
    () => fetchRankingsForTab(tab),
    [tab],
  )

  return (
    <>
      <PageHeader
        title="Rankings"
        description="Student, teacher, academy, state, and national leaderboards."
      />

      <nav
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
        role="tablist"
        aria-label="Ranking scopes"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-[44px] shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {loading ? (
        <LoadingSkeleton variant="page" />
      ) : error ? (
        <ErrorState
          title="Could not load rankings"
          message={error}
          onRetry={() => void refetch()}
        />
      ) : !data?.length ? (
        <EmptyState
          title="No rankings yet"
          description="Rankings are published after competitions conclude."
        />
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full min-w-[480px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left">
                <th className="px-4 py-3 font-medium">Rank</th>
                <th className="px-4 py-3 font-medium">Subject</th>
                <th className="px-4 py-3 font-medium">Points</th>
                <th className="px-4 py-3 font-medium">Season</th>
              </tr>
            </thead>
            <tbody>
              {data.map((entry) => (
                <tr key={entry.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-semibold">#{entry.rank}</td>
                  <td className="px-4 py-3">{entry.subjectName ?? entry.subjectId}</td>
                  <td className="px-4 py-3">{entry.points}</td>
                  <td className="px-4 py-3 text-muted-foreground">{entry.season ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
}
