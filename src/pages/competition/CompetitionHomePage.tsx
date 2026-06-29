import { Link } from 'react-router-dom'
import { Calendar, MapPin, Trophy } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchPublishedCompetitions } from '../../services/competitionService'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { EmptyState } from '../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { Badge } from '../../components/ui/Badge'

function formatDate(date: string | null) {
  if (!date) return 'Dates TBA'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function statusLabel(status: string) {
  return status.replace(/_/g, ' ')
}

export function CompetitionHomePage() {
  const { user } = useApp()
  const isStudent = user?.role === 'student'

  const { data: competitions, loading, error, refetch } = useAsyncData(() =>
    fetchPublishedCompetitions(100),
  )

  if (loading) return <LoadingSkeleton variant="page" />

  if (error) {
    return (
      <ErrorState
        title="Could not load competitions"
        message={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!competitions?.length) {
    return (
      <>
        <PageHeader
          title="Competitions"
          description="Browse and manage yoga competitions."
        />
        <EmptyState
          title="No published competitions"
          description="Check back soon for upcoming events."
        />
      </>
    )
  }

  return (
    <>
      <PageHeader
        title="Competitions"
        description="Browse published events, view details, and register when open."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {competitions.map((competition) => {
          const registrationOpen = competition.status === 'registration_open'

          return (
            <article
              key={competition.id}
              className="flex flex-col overflow-hidden rounded-[16px] border border-border bg-elevated shadow-sm"
            >
              <div className="relative flex h-28 items-center justify-center bg-gradient-to-br from-primary/90 to-primary">
                <Trophy className="h-10 w-10 text-primary-foreground/80" strokeWidth={1.5} aria-hidden />
                <Badge variant={registrationOpen ? 'verified' : 'default'} className="absolute right-3 top-3">
                  {statusLabel(competition.status)}
                </Badge>
              </div>

              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-heading text-lg font-semibold">
                  <Link
                    to={`/dashboard/competitions/${competition.id}`}
                    className="hover:text-primary"
                  >
                    {competition.name}
                  </Link>
                </h2>

                {competition.description && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                    {competition.description}
                  </p>
                )}

                <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" aria-hidden />
                    {formatDate(competition.startDate)}
                  </span>
                  {(competition.city || competition.state) && (
                    <span className="inline-flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" aria-hidden />
                      {[competition.city, competition.state].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  <Link
                    to={`/dashboard/competitions/${competition.id}`}
                    className="inline-flex min-h-[40px] items-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
                  >
                    View details
                  </Link>
                  {isStudent && registrationOpen && (
                    <Link
                      to={`/dashboard/student/competitions/register/${competition.id}`}
                      className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
                    >
                      Register
                    </Link>
                  )}
                </div>
              </div>
            </article>
          )
        })}
      </div>
    </>
  )
}
