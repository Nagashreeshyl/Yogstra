import { Link, useParams } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchCompetitionSummary } from '../../services/competitionService'
import { formatCategoryLabel } from '../../services/studentCompetitionExperience'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { AnnouncementCard } from '../../components/student/competition/AnnouncementCard'
import { Badge } from '../../components/ui/Badge'

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function CompetitionDetailPage() {
  const { id = '' } = useParams()
  const { user } = useApp()
  const isStudent = user?.role === 'student'

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      id
        ? fetchCompetitionSummary(id)
        : Promise.reject(new Error('Missing competition id')),
    [id],
    { enabled: Boolean(id) },
  )

  if (loading) return <LoadingSkeleton variant="page" />

  if (error || !data?.competition) {
    return (
      <ErrorState
        title="Competition not found"
        message={error ?? 'This event may have been removed or is not published.'}
        onRetry={() => void refetch()}
      />
    )
  }

  const { competition, categories, events, announcements } = data
  const registrationOpen = competition.status === 'registration_open'

  return (
    <>
      <PageHeader
        title={competition.name}
        description={competition.description ?? undefined}
        actions={
          <div className="flex flex-wrap gap-2">
            <Badge variant={registrationOpen ? 'verified' : 'default'}>
              {competition.status.replace(/_/g, ' ')}
            </Badge>
            {isStudent && registrationOpen && (
              <Link
                to={`/dashboard/student/competitions/register/${competition.id}`}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Register
              </Link>
            )}
          </div>
        }
      />

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Start date</p>
          <p className="mt-1 font-medium">{competition.startDate ?? 'TBA'}</p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Location</p>
          <p className="mt-1 font-medium">
            {[competition.city, competition.state, competition.country].filter(Boolean).join(', ') || 'TBA'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Entry fee</p>
          <p className="mt-1 font-medium">
            {competition.entryFee > 0
              ? `₹${competition.entryFee.toLocaleString('en-IN')}`
              : 'Free'}
          </p>
        </div>
        <div className="rounded-lg border border-border p-4">
          <p className="text-xs text-muted-foreground">Registration deadline</p>
          <p className="mt-1 font-medium">{competition.registrationDeadline ?? 'TBA'}</p>
        </div>
      </div>

      <section className="mb-8" aria-labelledby="categories-heading">
        <h2 id="categories-heading" className="mb-4 font-heading text-lg font-semibold">
          Categories
        </h2>
        {categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Categories will be published soon.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {categories.map((cat) => (
              <li key={cat.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                {formatCategoryLabel(cat)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {events.length > 0 && (
        <section className="mb-8" aria-labelledby="schedule-heading">
          <h2 id="schedule-heading" className="mb-4 font-heading text-lg font-semibold">
            Schedule
          </h2>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {events.map((ev) => (
              <li key={ev.id} className="px-4 py-3 text-sm">
                <span className="font-medium">{ev.name}</span>
                <span className="text-muted-foreground"> · {formatDateTime(ev.startsAt)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="announcements-heading">
        <h2 id="announcements-heading" className="mb-4 font-heading text-lg font-semibold">
          Announcements
        </h2>
        {announcements.length === 0 ? (
          <p className="text-sm text-muted-foreground">No announcements yet.</p>
        ) : (
          <div className="space-y-3">
            {announcements.map((announcement) => (
              <AnnouncementCard key={announcement.id} announcement={announcement} />
            ))}
          </div>
        )}
      </section>

      {competition.rules && (
        <section className="mt-8" aria-labelledby="rules-heading">
          <h2 id="rules-heading" className="mb-4 font-heading text-lg font-semibold">
            Rules
          </h2>
          <div className="whitespace-pre-wrap rounded-lg border border-border p-4 text-sm text-muted-foreground">
            {competition.rules}
          </div>
        </section>
      )}
    </>
  )
}
