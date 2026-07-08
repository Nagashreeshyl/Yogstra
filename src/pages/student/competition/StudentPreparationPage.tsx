import { Link, useParams } from 'react-router-dom'
import { useState } from 'react'
import { Calendar, CreditCard, Download, MessageCircle, Upload, Video } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentPreparation } from '../../../services/studentCompetitionExperience'
import { payStudentRegistration, updateStudentRegistrationDocuments } from '../../../services/studentCompetitionOperations'
import { formatUserFacingError } from '../../../utils/format'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { CountdownCard } from '../../../components/student/competition/CountdownCard'
import { PreparationCard } from '../../../components/student/competition/PreparationCard'
import { PreparationChecklist } from '../../../components/student/competition/PreparationChecklist'
import { TimelineCard } from '../../../components/student/competition/TimelineCard'
import { CompetitionDocumentUploads } from '../../../components/student/competition/CompetitionDocumentUploads'
import type { StudentRegistrationDraft } from '../../../utils/studentRegistrationDraft'

export function StudentPreparationPage() {
  const { competitionId = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [paying, setPaying] = useState(false)
  const [payError, setPayError] = useState<string | null>(null)
  const [docSaving, setDocSaving] = useState(false)
  const [docMessage, setDocMessage] = useState<string | null>(null)

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && competitionId
        ? fetchStudentPreparation(competitionId, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, competitionId],
    { enabled: Boolean(userId && competitionId) },
  )

  const registration = data?.detail.registration
  const needsPayment =
    registration &&
    registration.paymentStatus !== 'paid' &&
    registration.paymentStatus !== 'waived'

  const meta = (data?.myParticipant?.metadata ?? {}) as Record<string, unknown>
  const documents = (meta.documents ?? {
    identity: false,
    medical: false,
    photo: false,
    ageProof: false,
  }) as StudentRegistrationDraft['documents']
  const documentFiles = (meta.documentFiles ?? {}) as StudentRegistrationDraft['documentFiles']
  const emergencyContact = (meta.emergencyContact ?? {
    name: '',
    phone: '',
    relation: '',
  }) as StudentRegistrationDraft['emergencyContact']

  const [docDraft, setDocDraft] = useState<{
    documents: StudentRegistrationDraft['documents']
    documentFiles: StudentRegistrationDraft['documentFiles']
  } | null>(null)

  const activeDocs = docDraft ?? { documents, documentFiles: documentFiles ?? {} }

  async function handlePay() {
    if (!registration) return
    const fee =
      data?.detail.categories.find((c) => c.id === registration.categoryId)?.entryFeeOverride ??
      data?.detail.competition.entryFee ??
      0
    setPaying(true)
    setPayError(null)
    try {
      await payStudentRegistration(registration.id, fee, {
        studentName: user?.name ?? 'Student',
        studentEmail: user?.email ?? undefined,
        competitionName: data.detail.competition.name,
      })
      await refetch(true)
    } catch (err) {
      setPayError(formatUserFacingError(err, 'Payment failed. Please try again.'))
    } finally {
      setPaying(false)
    }
  }

  async function handleSaveDocuments() {
    if (!registration) return
    setDocSaving(true)
    setDocMessage(null)
    try {
      await updateStudentRegistrationDocuments({
        registrationId: registration.id,
        studentId: userId,
        draft: {
          documents: activeDocs.documents,
          documentFiles: activeDocs.documentFiles,
          emergencyContact,
        },
      })
      setDocMessage('Documents saved successfully.')
      await refetch(true)
    } catch (err) {
      setDocMessage(formatUserFacingError(err, 'Could not save documents.'))
    } finally {
      setDocSaving(false)
    }
  }

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState
        title="Preparation unavailable"
        message={error ?? 'Register first to access your prep dashboard.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const { detail, checklist, readiness, countdownDays, timeline, myParticipant } = data

  return (
    <>
      <PageHeader title="Preparation" description={detail.competition.name} />

      {needsPayment && (
        <div className="mb-6 rounded-[16px] border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-950/30">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-100">Payment required</p>
          <p className="mt-1 text-sm text-amber-800 dark:text-amber-200/90">
            Complete payment to confirm your registration and unlock full preparation tools.
          </p>
          {payError && (
            <p className="mt-2 text-sm text-destructive" role="alert">
              {payError}
            </p>
          )}
          <button
            type="button"
            disabled={paying}
            onClick={() => void handlePay()}
            className="mt-3 inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            <CreditCard className="h-4 w-4" aria-hidden />
            {paying ? 'Processing…' : 'Pay entry fee'}
          </button>
        </div>
      )}

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <CountdownCard daysUntil={countdownDays} />
        <PreparationCard title="Readiness score" description="Your overall preparation">
          <p className="font-heading text-4xl font-bold text-primary">{readiness}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${readiness}%` }}
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </PreparationCard>
        <PreparationCard title="Attendance" description="Check-in status">
          <p className="text-sm capitalize">{myParticipant?.status?.replace(/_/g, ' ') ?? 'Registered'}</p>
        </PreparationCard>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <PreparationCard title="Coach checklist">
          <PreparationChecklist items={checklist} />
        </PreparationCard>
        <PreparationCard title="Required documents">
          {registration ? (
            <>
              <CompetitionDocumentUploads
                competitionId={competitionId}
                userId={userId}
                documents={activeDocs.documents}
                documentFiles={activeDocs.documentFiles ?? {}}
                onChange={(nextDocuments, nextFiles) =>
                  setDocDraft({ documents: nextDocuments, documentFiles: nextFiles })
                }
              />
              {docMessage && <p className="mt-3 text-sm text-muted-foreground">{docMessage}</p>}
              <button
                type="button"
                disabled={docSaving}
                onClick={() => void handleSaveDocuments()}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {docSaving ? 'Saving…' : 'Save documents'}
              </button>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">Complete registration to track documents.</p>
          )}
        </PreparationCard>
        <PreparationCard title="Training calendar">
          <p className="text-sm text-muted-foreground">Practice sessions from your coach will appear here.</p>
        </PreparationCard>
        <PreparationCard title="Coach feedback">
          <p className="text-sm text-muted-foreground">Feedback from your coach will appear as you prepare.</p>
        </PreparationCard>
      </div>

      <PreparationCard title="Competition timeline" className="mb-8">
        <TimelineCard stages={timeline} />
      </PreparationCard>

      <PreparationCard title="Quick actions">
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard/student/messages" className="action-btn">
            <MessageCircle className="h-4 w-4" aria-hidden />
            Message coach
          </Link>
          <Link to="/dashboard/student/classes" className="action-btn">
            <Video className="h-4 w-4" aria-hidden />
            Join practice
          </Link>
          <button type="button" className="action-btn" onClick={() => window.print()}>
            <Download className="h-4 w-4" aria-hidden />
            Download schedule
          </button>
          <Link to={`/dashboard/student/competitions/${competitionId}/live`} className="action-btn">
            <Calendar className="h-4 w-4" aria-hidden />
            Live status
          </Link>
          <Link
            to={`/dashboard/student/competitions/register/${competitionId}`}
            className="action-btn"
          >
            <Upload className="h-4 w-4" aria-hidden />
            Update registration
          </Link>
        </div>
      </PreparationCard>
    </>
  )
}
