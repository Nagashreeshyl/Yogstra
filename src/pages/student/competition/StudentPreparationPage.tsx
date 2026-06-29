import { Link, useParams } from 'react-router-dom'
import { Calendar, Download, MessageCircle, Upload, Video } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentPreparation } from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { CountdownCard } from '../../../components/student/competition/CountdownCard'
import { PreparationCard } from '../../../components/student/competition/PreparationCard'
import { PreparationChecklist } from '../../../components/student/competition/PreparationChecklist'
import { TimelineCard } from '../../../components/student/competition/TimelineCard'

export function StudentPreparationPage() {
  const { competitionId = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && competitionId
        ? fetchStudentPreparation(competitionId, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, competitionId],
    { enabled: Boolean(userId && competitionId) },
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

  const { detail, checklist, readiness, countdownDays, timeline, myParticipant } = data
  const documents = myParticipant?.metadata?.documents as Record<string, boolean> | undefined

  return (
    <>
      <PageHeader title="Preparation" description={detail.competition.name} />

      <div className="mb-6 grid gap-4 lg:grid-cols-3">
        <CountdownCard daysUntil={countdownDays} />
        <PreparationCard title="Readiness score" description="Your overall preparation">
          <p className="font-heading text-4xl font-bold text-primary">{readiness}%</p>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
            <div className="h-full rounded-full bg-primary" style={{ width: `${readiness}%` }} role="progressbar" aria-valuenow={readiness} aria-valuemin={0} aria-valuemax={100} />
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
          {documents ? (
            <ul className="space-y-2 text-sm">
              {Object.entries(documents).map(([key, done]) => (
                <li key={key} className="flex justify-between capitalize">
                  {key.replace(/([A-Z])/g, ' $1')}
                  <span className={done ? 'text-primary' : 'text-muted-foreground'}>{done ? 'Ready' : 'Pending'}</span>
                </li>
              ))}
            </ul>
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
          <button type="button" className="action-btn" disabled title="Coming soon">
            <Upload className="h-4 w-4" aria-hidden />
            Upload practice
          </button>
        </div>
      </PreparationCard>
    </>
  )
}
