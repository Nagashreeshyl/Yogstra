import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchPublishedCompetitions, fetchCompetitionById } from '../../services/competitionService'
import { fetchUserRegistrations } from '../../services/registrationService'
import { fetchPublishedResults } from '../../services/judgeService'
import type { Competition, CompetitionResult } from '../../domain/competition/models'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { ResultCard } from '../../components/student/competition/ResultCard'

type ResultRow = {
  competition: Competition
  result: CompetitionResult
}

async function loadFoundationResults(userId?: string): Promise<ResultRow[]> {
  let competitionIds: string[] = []

  if (userId) {
    const registrations = await fetchUserRegistrations(userId)
    competitionIds = [...new Set(registrations.map((r) => r.competitionId))]
  }

  if (competitionIds.length === 0) {
    const published = await fetchPublishedCompetitions(100)
    competitionIds = published.map((c) => c.id)
  }

  const rows = await Promise.all(
    competitionIds.map(async (competitionId) => {
      const [competition, results] = await Promise.all([
        fetchCompetitionById(competitionId),
        fetchPublishedResults(competitionId),
      ])
      if (!competition || results.length === 0) return []
      return results.map((result) => ({ competition, result }))
    }),
  )

  return rows.flat().sort((a, b) => {
    const aTime = a.result.approvedAt ? new Date(a.result.approvedAt).getTime() : 0
    const bTime = b.result.approvedAt ? new Date(b.result.approvedAt).getTime() : 0
    return bTime - aTime
  })
}

export function CompetitionResultsPage() {
  const { user } = useApp()

  const { data, loading, error, refetch } = useAsyncData(
    () => loadFoundationResults(user?.id),
    [user?.id],
  )

  const grouped = useMemo(() => {
    const map = new Map<string, ResultRow[]>()
    for (const row of data ?? []) {
      const list = map.get(row.competition.id) ?? []
      list.push(row)
      map.set(row.competition.id, list)
    }
    return [...map.entries()]
  }, [data])

  if (loading) return <LoadingSkeleton variant="page" />

  if (error) {
    return (
      <ErrorState
        title="Results unavailable"
        message={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data?.length) {
    return (
      <>
        <PageHeader
          title="Results"
          description="View approved competition results and medals."
        />
        <EmptyState
          title="No published results"
          description="Results appear here after organizers approve and publish scores."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Results"
        description={
          user
            ? 'Published results from your competitions and platform-wide events.'
            : 'Published competition results across the platform.'
        }
      />

      <div className="space-y-10">
        {grouped.map(([competitionId, rows]) => (
          <section key={competitionId} aria-labelledby={`results-${competitionId}`}>
            <h2 id={`results-${competitionId}`} className="mb-4 font-heading text-lg font-semibold">
              {rows[0]?.competition.name}
            </h2>
            <div className="space-y-4">
              {rows.map(({ competition, result }) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  competitionName={competition.name}
                />
              ))}
            </div>
          </section>
        ))}
      </div>
    </>
  )
}
