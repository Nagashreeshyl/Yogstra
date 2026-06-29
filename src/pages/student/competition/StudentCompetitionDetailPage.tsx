import { Link, useParams } from 'react-router-dom'
import {
  Calendar,
  Download,
  MapPin,
  MessageCircle,
  Share2,
  Users,
} from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentCompetitionDetail, formatCategoryLabel } from '../../../services/studentCompetitionExperience'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'

function formatDate(date: string | null) {
  if (!date) return 'TBA'
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'short',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function StudentCompetitionDetailPage() {
  const { id = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && id
        ? fetchStudentCompetitionDetail(id, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, id],
    { enabled: Boolean(userId && id) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState
        title="Competition not found"
        message={error ?? 'This event may have been removed.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const { competition, categories, events, registration, judges } = data
  const isRegistered = Boolean(registration)
  const canRegister = data.registrationOpen && !isRegistered

  const share = async () => {
    const url = window.location.href
    if (navigator.share) {
      await navigator.share({ title: competition.name, url })
    } else {
      await navigator.clipboard.writeText(url)
    }
  }

  return (
    <>
      <div
        className="mb-6 overflow-hidden rounded-[16px] bg-gradient-to-br from-primary to-primary/80 p-6 text-primary-foreground sm:p-8"
        role="banner"
      >
        <p className="text-xs font-medium uppercase tracking-widest opacity-80">
          {competition.scope} · {competition.format}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{competition.name}</h1>
        {competition.description && (
          <p className="mt-2 max-w-2xl text-sm opacity-90">{competition.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <span className="inline-flex items-center gap-1.5">
            <Calendar className="h-4 w-4" aria-hidden />
            {formatDate(competition.startDate)}
            {competition.endDate && ` – ${formatDate(competition.endDate)}`}
          </span>
          {(competition.city || competition.venue) && (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-4 w-4" aria-hidden />
              {[competition.venue, competition.city, competition.state].filter(Boolean).join(', ')}
            </span>
          )}
        </div>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        {canRegister && (
          <Link
            to={`/dashboard/student/competitions/${id}/register`}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          >
            Register now
          </Link>
        )}
        {isRegistered && (
          <Link
            to={`/dashboard/student/competitions/${id}/prepare`}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Preparation dashboard
          </Link>
        )}
        {competition.rules && (
          <button
            type="button"
            onClick={() => {
              const blob = new Blob([competition.rules ?? ''], { type: 'text/plain' })
              const url = URL.createObjectURL(blob)
              const a = document.createElement('a')
              a.href = url
              a.download = `${competition.slug}-rulebook.txt`
              a.click()
              URL.revokeObjectURL(url)
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <Download className="h-4 w-4" aria-hidden />
            Rulebook
          </button>
        )}
        <Link
          to={`/dashboard/student/messages`}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <MessageCircle className="h-4 w-4" aria-hidden />
          Message organizer
        </Link>
        <button
          type="button"
          onClick={() => void share()}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border bg-elevated px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          <Share2 className="h-4 w-4" aria-hidden />
          Share
        </button>
      </div>

      {registration && (
        <div className="mb-6 rounded-[12px] border border-primary/30 bg-primary/5 px-4 py-3 text-sm">
          Registration status:{' '}
          <strong className="capitalize">{registration.status.replace(/_/g, ' ')}</strong>
          {' · '}
          Payment:{' '}
          <strong className="capitalize">{registration.paymentStatus.replace(/_/g, ' ')}</strong>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard title="Event details">
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted-foreground">Organizer</dt>
              <dd className="font-medium">{competition.organizerName ?? 'Yogstra organizer'}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Registration deadline</dt>
              <dd className="font-medium">{formatDate(competition.registrationDeadline)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Entry fee</dt>
              <dd className="font-medium">
                {competition.entryFee > 0
                  ? `₹${competition.entryFee.toLocaleString('en-IN')}`
                  : 'Free'}
              </dd>
            </div>
            {competition.maxParticipants && (
              <div>
                <dt className="text-muted-foreground">Capacity</dt>
                <dd className="font-medium">{competition.maxParticipants} participants</dd>
              </div>
            )}
          </dl>
        </DashboardCard>

        <DashboardCard title="Age categories & styles">
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground">Categories coming soon.</p>
          ) : (
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li
                  key={cat.id}
                  className="rounded-lg border border-border px-3 py-2 text-sm font-medium"
                >
                  {formatCategoryLabel(cat)}
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        {competition.rules && (
          <DashboardCard title="Rules" className="lg:col-span-2">
            <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-muted-foreground">
              {competition.rules}
            </div>
          </DashboardCard>
        )}

        <DashboardCard title="Judges">
          {judges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Judges will be announced.</p>
          ) : (
            <ul className="space-y-2">
              {judges.map((j) => (
                <li key={j.id} className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
                  <span className="font-medium">{j.userName ?? 'Judge'}</span>
                  <span className="text-muted-foreground capitalize">· {j.role.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>

        <DashboardCard title="Schedule preview">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Schedule not published yet.</p>
          ) : (
            <ul className="space-y-2">
              {events.slice(0, 5).map((ev) => (
                <li key={ev.id} className="text-sm">
                  <span className="font-medium">{ev.name}</span>
                  <span className="text-muted-foreground">
                    {' '}
                    · {new Date(ev.startsAt).toLocaleString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      </div>
    </>
  )
}
