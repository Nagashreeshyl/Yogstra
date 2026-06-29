import { useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import {
  buildCompetitionTimeline,
  fetchStudentCompetitionDetail,
} from '../../../services/studentCompetitionExperience'
import { fetchCompetitionParticipants } from '../../../services/registrationService'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { TimelineCard } from '../../../components/student/competition/TimelineCard'

export function StudentTimelinePage() {
  const { id = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    async () => {
      if (!userId || !id) throw new Error('Not signed in')
      const detail = await fetchStudentCompetitionDetail(id, userId)
      if (!detail) return null
      const participants = await fetchCompetitionParticipants(id)
      const myParticipant = participants.find((p) => p.studentId === userId)
      const stages = buildCompetitionTimeline(
        detail.competition,
        detail.registration,
        myParticipant?.documentsVerified ?? false,
      )
      return { detail, stages }
    },
    [userId, id],
    { enabled: Boolean(userId && id) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState
        title="Timeline unavailable"
        message={error ?? 'Could not load timeline.'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Competition timeline"
        description={data.detail.competition.name}
      />
      <DashboardCard title="Your journey">
        <TimelineCard stages={data.stages} />
      </DashboardCard>
    </>
  )
}
