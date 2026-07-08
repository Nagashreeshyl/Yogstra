import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import {
  fetchStudentCompetitionDetail,
  fetchStudentPreparation,
} from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { RegistrationWizard } from '../../../components/student/competition/RegistrationWizard'

function isFullyRegistered(registration: {
  status: string
  paymentStatus: string
} | null | undefined) {
  if (!registration) return false
  const paid = registration.paymentStatus === 'paid' || registration.paymentStatus === 'waived'
  return paid && registration.status === 'confirmed'
}

export function StudentRegistrationWizardPage() {
  const { competitionId = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''
  const userName = user?.name ?? 'Student'

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && competitionId
        ? Promise.all([
            fetchStudentCompetitionDetail(competitionId, userId),
            fetchStudentPreparation(competitionId, userId),
          ]).then(([detail, preparation]) => ({
            detail,
            participantMetadata: preparation?.myParticipant?.metadata ?? null,
          }))
        : Promise.reject(new Error('Not signed in')),
    [userId, competitionId],
    { enabled: Boolean(userId && competitionId) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data?.detail) {
    return <ErrorState title="Cannot register" message={error ?? 'Competition unavailable.'} />
  }

  const { detail, participantMetadata } = data

  if (isFullyRegistered(detail.registration)) {
    return (
      <div className="py-12 text-center">
        <h2 className="font-heading text-xl font-semibold">Already registered</h2>
        <p className="mt-2 text-sm text-muted-foreground">You're signed up for {detail.competition.name}.</p>
        <Link
          to={`/dashboard/student/competitions/${competitionId}/preparation`}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to preparation
        </Link>
      </div>
    )
  }

  return (
    <>
      <PageHeader title="Registration" description={`Join ${detail.competition.name}`} />
      <RegistrationWizard
        competitionId={competitionId}
        userId={userId}
        userName={userName}
        userEmail={user.email ?? undefined}
        categories={detail.categories}
        entryFee={detail.competition.entryFee}
        competitionName={detail.competition.name}
        existingRegistration={detail.registration}
        initialParticipantMetadata={participantMetadata as Record<string, unknown> | null}
        onComplete={() => void refetch(true)}
      />
    </>
  )
}
