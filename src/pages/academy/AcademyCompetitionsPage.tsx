import { Trophy } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { fetchAcademyCompetitionSummary } from '../../services/academyCompetitionService'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { EmptyState } from '../../components/shell/EmptyState'
import { Badge } from '../../components/ui/Badge'

export function AcademyCompetitionsPage() {
  const { academyId } = useAcademyContext()

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      academyId
        ? fetchAcademyCompetitionSummary(academyId)
        : Promise.reject(new Error('No academy selected')),
    [academyId],
    { enabled: Boolean(academyId) },
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
        title="Competitions"
        description="Track academy student participation in Yogstra competitions."
      />

      <div className="grid grid-cols-2 gap-4 mb-6 sm:grid-cols-4">
        <Stat label="Registrations" value={data.totalRegistrations} />
        <Stat label="Confirmed" value={data.confirmedRegistrations} />
        <Stat label="Participants" value={data.totalParticipants} />
        <Stat label="Pending docs" value={data.pendingDocuments} />
      </div>

      {data.competitions.length === 0 ? (
        <EmptyState
          icon={<Trophy size={24} />}
          title="No competition activity yet"
          description="Enrolled students will appear here when they register for competitions."
        />
      ) : (
        <div className="space-y-4">
          {data.competitions.map((item) => (
            <DashboardCard key={item.competitionId} title={item.competitionName}>
              <div className="flex flex-wrap gap-3 text-sm">
                <Badge>{item.registrations} registrations</Badge>
                <Badge>{item.participants} participants</Badge>
                {item.pendingDocuments > 0 && (
                  <Badge>{item.pendingDocuments} docs pending</Badge>
                )}
              </div>
            </DashboardCard>
          ))}
        </div>
      )}
    </PageContainer>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-[12px] border border-border px-3 py-2 text-center">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-xl font-semibold">{value}</p>
    </div>
  )
}
