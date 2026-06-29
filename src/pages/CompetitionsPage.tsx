import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import {
  DEFAULT_PUBLIC_COMPETITION_FILTERS,
  fetchPublicCompetitions,
  type PublicCompetitionFilters,
} from '../services/publicCompetitionService'
import { fetchCompetitionBySlug, fetchCompetitionSummary } from '../services/competitionService'
import { formatCategoryLabel } from '../services/studentCompetitionExperience'
import { PublicCompetitionListCard } from '../components/competitions/PublicCompetitionListCard'
import { AnnouncementCard } from '../components/student/competition/AnnouncementCard'
import { PageContainer } from '../components/shell/PageContainer'
import { PageHeader } from '../components/shell/PageHeader'
import { ErrorState } from '../components/shell/ErrorState'
import { EmptyState } from '../components/shell/EmptyState'
import { LoadingSkeleton } from '../components/shell/LoadingSkeleton'
import { Badge } from '../components/ui/Badge'

const PAGE_SIZE = 12

function PublicCompetitionFiltersBar({
  filters,
  onChange,
}: {
  filters: PublicCompetitionFilters
  onChange: (next: PublicCompetitionFilters) => void
}) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="block flex-1 text-sm">
        <span className="mb-1 block text-muted-foreground">Search</span>
        <input
          type="search"
          value={filters.search}
          onChange={(e) => onChange({ ...filters, search: e.target.value })}
          placeholder="Name, city, or state…"
          className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-3 text-sm"
        />
      </label>
      <label className="block text-sm sm:w-40">
        <span className="mb-1 block text-muted-foreground">Sort</span>
        <select
          value={filters.sort}
          onChange={(e) =>
            onChange({ ...filters, sort: e.target.value as PublicCompetitionFilters['sort'] })
          }
          className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-2 text-sm"
        >
          <option value="nearest">Nearest</option>
          <option value="newest">Newest</option>
          <option value="closing_soon">Closing soon</option>
          <option value="name">Name</option>
        </select>
      </label>
      <label className="flex min-h-[44px] items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={Boolean(filters.registrationOpen)}
          onChange={(e) => onChange({ ...filters, registrationOpen: e.target.checked || undefined })}
          className="rounded border-border"
        />
        Registration open only
      </label>
    </div>
  )
}

export function CompetitionsPage() {
  const { user } = useApp()
  const [filters, setFilters] = useState<PublicCompetitionFilters>(DEFAULT_PUBLIC_COMPETITION_FILTERS)
  const [page, setPage] = useState(1)

  const { data, loading, error, refetch } = useAsyncData(
    () => fetchPublicCompetitions(filters, user?.id, page, PAGE_SIZE),
    [filters, user?.id, page],
  )

  const totalPages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader title="Competitions" description="Discover yoga competitions across India." />

      <PublicCompetitionFiltersBar
        filters={filters}
        onChange={(next) => {
          setPage(1)
          setFilters(next)
        }}
      />

      {loading ? (
        <LoadingSkeleton variant="page" />
      ) : error ? (
        <ErrorState
          title="Could not load competitions"
          message={error}
          onRetry={() => void refetch()}
        />
      ) : !data?.items.length ? (
        <EmptyState
          title="No competitions match your filters"
          description="Try clearing filters or check back later."
        />
      ) : (
        <>
          {data.featured.length > 0 && page === 1 && (
            <section className="mb-8" aria-labelledby="featured-competitions">
              <h2 id="featured-competitions" className="mb-4 font-heading text-lg font-semibold">
                Featured
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {data.featured.map((c) => (
                  <PublicCompetitionListCard key={c.id} competition={c} variant="featured" />
                ))}
              </div>
            </section>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.items.map((c) => (
              <PublicCompetitionListCard key={c.id} competition={c} />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-8 flex items-center justify-center gap-3">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => p - 1)}
                className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm text-muted-foreground">
                Page {page} of {totalPages} · {data.total} total
              </span>
              <button
                type="button"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="rounded-lg border border-border px-4 py-2 text-sm disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
      </div>
    </PageContainer>
  )
}

export function PublicCompetitionDetailPage() {
  const { slug = '' } = useParams()
  const { user } = useApp()
  const isStudent = user?.role === 'student'

  const { data: competition, loading: slugLoading, error: slugError, refetch: refetchSlug } =
    useAsyncData(
      () =>
        slug
          ? fetchCompetitionBySlug(slug)
          : Promise.reject(new Error('Missing competition slug')),
      [slug],
      { enabled: Boolean(slug) },
    )

  const { data: summary, loading: summaryLoading, error: summaryError, refetch: refetchSummary } =
    useAsyncData(
      () =>
        competition?.id
          ? fetchCompetitionSummary(competition.id)
          : Promise.reject(new Error('Competition not found')),
      [competition?.id],
      { enabled: Boolean(competition?.id) },
    )

  const loading = slugLoading || summaryLoading
  const error = slugError || summaryError

  if (loading) return <LoadingSkeleton variant="page" />

  if (error || !competition || !summary) {
    return (
      <ErrorState
        title="Competition not found"
        message={error ?? 'This event may not be published yet.'}
        onRetry={() => {
          void refetchSlug()
          void refetchSummary()
        }}
      />
    )
  }

  const registrationOpen = competition.status === 'registration_open'

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <Link to="/competitions" className="mb-4 inline-block text-sm text-primary hover:underline">
        ← All competitions
      </Link>

      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-heading text-3xl font-medium">{competition.name}</h1>
          {competition.description && (
            <p className="mt-2 text-muted-foreground">{competition.description}</p>
          )}
        </div>
        <Badge variant={registrationOpen ? 'verified' : 'default'}>
          {competition.status.replace(/_/g, ' ')}
        </Badge>
      </div>

      <div className="mb-8 flex flex-wrap gap-3">
        {registrationOpen &&
          (isStudent ? (
            <Link
              to={`/dashboard/student/competitions/register/${competition.id}`}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Register
            </Link>
          ) : (
            <Link
              to="/auth/student"
              state={{ from: `/dashboard/student/competitions/register/${competition.id}` }}
              className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
            >
              Sign in to register
            </Link>
          ))}
      </div>

      <section className="mb-8">
        <h2 className="mb-4 font-heading text-lg font-semibold">Categories</h2>
        {summary.categories.length === 0 ? (
          <p className="text-sm text-muted-foreground">Categories coming soon.</p>
        ) : (
          <ul className="grid gap-2 sm:grid-cols-2">
            {summary.categories.map((cat) => (
              <li key={cat.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                {formatCategoryLabel(cat)}
              </li>
            ))}
          </ul>
        )}
      </section>

      {summary.announcements.length > 0 && (
        <section>
          <h2 className="mb-4 font-heading text-lg font-semibold">Announcements</h2>
          <div className="space-y-3">
            {summary.announcements.map((a) => (
              <AnnouncementCard key={a.id} announcement={a} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
