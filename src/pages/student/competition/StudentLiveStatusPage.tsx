import { useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentLiveStatus } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { LiveStatusCard } from '../../../components/student/competition/LiveStatusCard'

export function StudentLiveStatusPage() {
  const { id = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && id
        ? fetchStudentLiveStatus(id, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, id],
    { enabled: Boolean(userId && id) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState
        title="Live status unavailable"
        message={error ?? 'Could not load live updates.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const checkInStatus = data.myParticipant?.checkInAt
    ? 'Checked in'
    : data.myParticipant?.status === 'checked_in'
      ? 'Checked in'
      : 'Not checked in yet'

  const estimatedTime =
    (data.myParticipant?.metadata?.estimatedPerformanceTime as string | undefined) ?? null

  return (
    <>
      <PageHeader
        title="Live status"
        description={data.detail.competition.name}
      />
      <DashboardCard title="On the floor">
        <LiveStatusCard
          checkInStatus={checkInStatus}
          currentStage={data.currentStage}
          participants={data.participants}
          myParticipantId={data.myParticipant?.id}
          estimatedTime={estimatedTime}
          announcements={data.announcements}
        />
      </DashboardCard>
    </>
  )
}
