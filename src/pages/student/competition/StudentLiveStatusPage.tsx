import { useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentLiveStatus } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { LiveStatusCard } from '../../../components/student/competition/LiveStatusCard'
import { AnnouncementCard } from '../../../components/student/competition/AnnouncementCard'

export function StudentLiveStatusPage() {
  const { competitionId = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && competitionId
        ? fetchStudentLiveStatus(competitionId, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, competitionId],
    { enabled: Boolean(userId && competitionId) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState title="Live status unavailable" message={error ?? 'Could not load live updates.'} onRetry={() => void refetch()} />
    )
  }

  const checkInStatus = data.myParticipant?.checkInAt || data.myParticipant?.status === 'checked_in'
    ? 'Checked in'
    : 'Not checked in yet'

  const estimatedTime =
    (data.myParticipant?.metadata?.estimatedPerformanceTime as string | undefined) ?? null

  return (
    <>
      <PageHeader title="Live competition" description={data.detail.competition.name} />
      <LiveStatusCard
        checkInStatus={checkInStatus}
        currentStage={data.currentStage}
        participants={data.participants}
        myParticipantId={data.myParticipant?.id}
        estimatedTime={estimatedTime}
        queuePosition={data.queuePosition}
        announcements={data.announcements}
        emergencyContact={data.emergencyContact}
        liveScores={data.scores}
      />

      {data.announcements.length > 0 && (
        <DashboardCard title="Announcements" className="mt-6">
          <div className="space-y-3">
            {data.announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </DashboardCard>
      )}
    </>
  )
}
