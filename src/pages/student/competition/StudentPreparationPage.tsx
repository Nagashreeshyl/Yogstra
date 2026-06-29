import { Link, useParams } from 'react-router-dom'
import { ArrowRight, Calendar, FileText, Zap } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentPreparation } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { PreparationChecklist } from '../../../components/student/competition/PreparationChecklist'

export function StudentPreparationPage() {
  const { id = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && id
        ? fetchStudentPreparation(id, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, id],
    { enabled: Boolean(userId && id) },
  )

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

  const { detail, checklist, readiness, countdownDays } = data
  const documents = data.myParticipant?.metadata?.documents as Record<string, boolean> | undefined

  return (
    <>
      <PageHeader
        title="Preparation"
        description={detail.competition.name}
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-[16px] border border-border bg-gradient-to-br from-primary/10 to-accent/10 p-5 text-center sm:col-span-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Countdown
          </p>
          <p className="mt-2 font-heading text-4xl font-bold text-primary">
            {countdownDays !== null && countdownDays >= 0 ? countdownDays : '—'}
          </p>
          <p className="text-sm text-muted-foreground">days to go</p>
        </div>

        <div className="rounded-[16px] border border-border bg-elevated p-5 sm:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Readiness score
              </p>
              <p className="mt-1 font-heading text-3xl font-bold">{readiness}%</p>
            </div>
            <Zap className="h-8 w-8 text-accent" aria-hidden />
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${readiness}%` }}
              role="progressbar"
              aria-valuenow={readiness}
              aria-valuemin={0}
              aria-valuemax={100}
            />
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Coach checklist">
          <PreparationChecklist items={checklist} />
        </DashboardCard>

        <DashboardCard title="Training progress">
          <p className="text-sm text-muted-foreground">
            Keep practicing with your coach. Your readiness score updates as you complete registration
            steps and document verification.
          </p>
          <div className="mt-4 rounded-lg bg-muted/40 p-4">
            <p className="text-2xl font-bold text-primary">{readiness}%</p>
            <p className="text-xs text-muted-foreground">Overall preparation</p>
          </div>
        </DashboardCard>

        <DashboardCard title="Required documents">
          {documents ? (
            <ul className="space-y-2 text-sm">
              {Object.entries(documents).map(([key, done]) => (
                <li key={key} className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                  <span className={done ? 'text-primary' : 'text-muted-foreground'}>
                    {done ? 'Submitted' : 'Pending'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              Complete registration to track document status.
            </p>
          )}
        </DashboardCard>

        <DashboardCard title="Coach feedback">
          <p className="text-sm text-muted-foreground">
            Feedback from your coach will appear here as you prepare for the event.
          </p>
        </DashboardCard>

        <DashboardCard title="Quick actions" className="lg:col-span-2">
          <div className="flex flex-wrap gap-3">
            <Link
              to={`/dashboard/student/competitions/${id}/timeline`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              <Calendar className="h-4 w-4" aria-hidden />
              View timeline
            </Link>
            <Link
              to={`/dashboard/student/competitions/${id}/live`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Live status
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
            <Link
              to={`/dashboard/student/competitions/${id}`}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
            >
              Competition details
            </Link>
          </div>
        </DashboardCard>
      </div>
    </>
  )
}
