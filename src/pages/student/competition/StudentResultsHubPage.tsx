import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentResultsHub } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { EmptyState } from '../../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { ResultCard } from '../../../components/student/competition/ResultCard'
import { JudgeFeedbackCard } from '../../../components/student/competition/JudgeFeedbackCard'

export function StudentResultsHubPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchStudentResultsHub(userId)
        : Promise.reject(new Error('Not signed in')),
    [userId],
    { enabled: Boolean(userId) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error) {
    return <ErrorState title="Results unavailable" message={error} onRetry={() => void refetch()} />
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No results yet"
        description="Results appear here after competitions conclude and scores are published."
      />
    )
  }

  return (
    <div className="student-competition py-4 sm:py-6">
      <PageHeader title="My results" description="Placements, scores, and judge feedback across competitions." />
      <div className="space-y-6">
        {data.map(({ competition, result, judgeComments, categoryRank }) => (
          <div key={result.id} className="space-y-4">
            <ResultCard
              result={result}
              competitionName={competition.name}
              categoryRank={categoryRank}
              judgeComments={judgeComments}
              onDownload={() => {
                const text = `Result: ${competition.name}\nRank: ${result.rank}\nScore: ${result.totalScore}`
                const blob = new Blob([text], { type: 'text/plain' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `${competition.slug}-result.txt`
                a.click()
                URL.revokeObjectURL(url)
              }}
              onShare={() => void navigator.clipboard.writeText(`${competition.name}: Rank #${result.rank}`)}
            />
            {judgeComments.length > 1 && <JudgeFeedbackCard comments={judgeComments.slice(1)} />}
          </div>
        ))}
      </div>
    </div>
  )
}
