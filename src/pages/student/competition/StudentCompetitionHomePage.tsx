import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, Search, Sparkles } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import {
  buildStudentCompetitionNotifications,
  fetchStudentCompetitionHome,
  fetchStudentMyCompetitions,
} from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { EmptyState } from '../../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { CompetitionCard } from '../../../components/student/competition/CompetitionCard'

const SCOPES = ['', 'friendly', 'state', 'national', 'international'] as const

export function StudentCompetitionHomePage() {
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [search, setSearch] = useState('')
  const [scopeFilter, setScopeFilter] = useState('')

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchStudentCompetitionHome(userId, search, scopeFilter)
        : Promise.reject(new Error('Not signed in')),
    [userId, search, scopeFilter],
    { enabled: Boolean(userId) },
  )

  const notifications = useMemo(() => {
    if (!data) return []
    return buildStudentCompetitionNotifications(data.all, data.registrations)
  }, [data])

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState
        title="Could not load competitions"
        message={error ?? 'Please try again.'}
        onRetry={() => void refetch()}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Competitions"
        description="Discover events, register, and track your journey from warm-up to podium."
      />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search competitions</span>
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden
          />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or location…"
            className="min-h-[44px] w-full rounded-lg border border-border bg-elevated py-2 pl-10 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          />
        </label>

        <select
          value={scopeFilter}
          onChange={(e) => setScopeFilter(e.target.value)}
          aria-label="Filter by scope"
          className="min-h-[44px] rounded-lg border border-border bg-elevated px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        >
          <option value="">All scopes</option>
          {SCOPES.filter(Boolean).map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
      </div>

      {notifications.length > 0 && (
        <DashboardCard
          title="Updates"
          description="Stay on top of your competition journey."
          className="mb-6"
          action={<Bell className="h-4 w-4 text-muted-foreground" aria-hidden />}
        >
          <ul className="divide-y divide-border">
            {notifications.slice(0, 5).map((n) => (
              <li key={n.id}>
                <Link
                  to={n.href}
                  className="flex flex-col gap-0.5 py-3 text-sm hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  <span className="font-medium">{n.title}</span>
                  <span className="text-muted-foreground">{n.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      {data.registered.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 font-heading text-lg font-semibold">My registered competitions</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.registered.map((c) => (
              <CompetitionCard key={c.id} competition={c} />
            ))}
          </div>
        </section>
      )}

      {data.featured.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden />
            Featured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.featured.map((c) => (
              <CompetitionCard key={c.id} competition={c} variant="featured" />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">Upcoming</h2>
        {data.upcoming.length === 0 ? (
          <EmptyState title="No upcoming competitions" description="Check back soon for new events." />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.upcoming.map((c) => (
              <CompetitionCard key={c.id} competition={c} />
            ))}
          </div>
        )}
      </section>

      {data.recommended.length > 0 && (
        <section className="mb-8">
          <h2 className="mb-4 font-heading text-lg font-semibold">Recommended for you</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended.map((c) => (
              <CompetitionCard key={c.id} competition={c} />
            ))}
          </div>
        </section>
      )}

      {data.recent.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold">Recently announced</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((c) => (
              <CompetitionCard key={c.id} competition={c} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

export function StudentMyCompetitionsPage() {
  const { user } = useApp()
  const userId = user?.id ?? ''

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? fetchStudentMyCompetitions(userId)
        : Promise.reject(new Error('Not signed in')),
    [userId],
    { enabled: Boolean(userId) },
  )

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error) {
    return (
      <ErrorState
        title="Could not load your competitions"
        message={error}
        onRetry={() => void refetch()}
      />
    )
  }

  if (!data?.length) {
    return (
      <EmptyState
        title="No competitions yet"
        description="Browse events and register to see them here."
        action={
          <Link
            to="/dashboard/student/competitions"
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Discover competitions
          </Link>
        }
      />
    )
  }

  return (
    <>
      <PageHeader title="My competitions" description="Every event you're training for." />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.map(({ competition, registration }) => (
          <div key={competition.id} className="space-y-2">
            <CompetitionCard competition={competition} />
            <div className="flex flex-wrap gap-2 px-1">
              <Link
                to={`/dashboard/student/competitions/${competition.id}/prepare`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Prepare
              </Link>
              <Link
                to={`/dashboard/student/competitions/${competition.id}/timeline`}
                className="text-xs font-medium text-primary hover:underline"
              >
                Timeline
              </Link>
              {registration.status === 'confirmed' && (
                <Link
                  to={`/dashboard/student/competitions/${competition.id}/live`}
                  className="text-xs font-medium text-primary hover:underline"
                >
                  Live status
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
