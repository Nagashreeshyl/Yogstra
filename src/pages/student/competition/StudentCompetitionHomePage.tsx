import { useMemo, useState, useCallback, memo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, CreditCard, Search, Sparkles } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchUserCertificates } from '../../../services/certificateService'
import { payStudentRegistration } from '../../../services/studentCompetitionOperations'
import { formatUserFacingError } from '../../../utils/format'
import {
  buildStudentCompetitionNotifications,
  DEFAULT_COMPETITION_FILTERS,
  fetchStudentCompetitionHome,
  fetchStudentMyCompetitions,
  type CompetitionListFilters,
} from '../../../services/studentCompetitionExperience'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { EmptyState } from '../../../components/shell/EmptyState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { StudentCompetitionListCard } from '../../../components/student/competition/StudentCompetitionListCard'
import { CompetitionFilters } from '../../../components/student/competition/CompetitionFilters'
import { listRegistrationDrafts } from '../../../utils/studentRegistrationDraft'

const PAGE_SIZE = 6

export const StudentCompetitionHomePage = memo(function StudentCompetitionHomePage() {
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [filters, setFilters] = useState<CompetitionListFilters>(DEFAULT_COMPETITION_FILTERS)
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId
        ? Promise.all([
            fetchStudentCompetitionHome(userId, filters),
            fetchUserCertificates(userId),
          ]).then(([home, certificates]) => ({
            ...home,
            issuedCertificateCompetitionIds: new Set(
              certificates
                .filter((c) => c.status === 'issued' && !c.revokedAt)
                .map((c) => c.competitionId),
            ),
          }))
        : Promise.reject(new Error('Not signed in')),
    [userId, filters],
    { enabled: Boolean(userId) },
  )

  const notifications = useMemo(() => {
    if (!data) return []
    return buildStudentCompetitionNotifications(
      data.all,
      data.registrations,
      data.issuedCertificateCompetitionIds,
    )
  }, [data])

  const visibleUpcoming = useMemo(
    () => data?.upcoming.slice(0, visibleCount) ?? [],
    [data, visibleCount],
  )

  const savedDrafts = useMemo(() => {
    const registeredIds = new Set(data?.registrations.map((r) => r.competitionId) ?? [])
    return listRegistrationDrafts(userId).filter(({ competitionId }) => !registeredIds.has(competitionId))
  }, [userId, data?.registrations])

  const loadMore = useCallback(() => setVisibleCount((n) => n + PAGE_SIZE), [])

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

      <label className="relative mb-4 block">
        <span className="sr-only">Search competitions</span>
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <input
          type="search"
          value={filters.search}
          onChange={(e) => {
            setVisibleCount(PAGE_SIZE)
            setFilters({ ...filters, search: e.target.value })
          }}
          placeholder="Search by name, city, or organizer…"
          className="min-h-[44px] w-full rounded-lg border border-border bg-elevated py-2 pl-10 pr-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </label>

      <CompetitionFilters
        filters={filters}
        onChange={(next) => {
          setVisibleCount(PAGE_SIZE)
          setFilters(next)
        }}
        states={data.filterOptions.states}
        countries={data.filterOptions.countries}
        organizers={data.filterOptions.organizers}
      />

      {savedDrafts.length > 0 && (
        <DashboardCard title="Continue registration" className="mb-6">
          <ul className="divide-y divide-border">
            {savedDrafts.map(({ competitionId, draft }) => {
              const competition = data.all.find((c) => c.id === competitionId)
              return (
                <li key={competitionId}>
                  <Link
                    to={`/dashboard/student/competitions/register/${competitionId}`}
                    className="flex min-h-[44px] flex-wrap items-center justify-between gap-2 py-3 text-sm hover:text-primary"
                  >
                    <span className="font-medium">{competition?.name ?? 'Saved registration'}</span>
                    <span className="text-muted-foreground">
                      Step {draft.step + 1} of 7 · Resume
                    </span>
                  </Link>
                </li>
              )
            })}
          </ul>
        </DashboardCard>
      )}

      {notifications.length > 0 && (
        <DashboardCard title="Notifications" className="mb-6" action={<Bell className="h-4 w-4 text-muted-foreground" aria-hidden />}>
          <ul className="divide-y divide-border">
            {notifications.slice(0, 6).map((n) => (
              <li key={n.id}>
                <Link to={n.href} className="block py-3 text-sm hover:text-primary">
                  <span className="font-medium">{n.title}</span>
                  <span className="mt-0.5 block text-muted-foreground">{n.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </DashboardCard>
      )}

      {data.registered.length > 0 && (
        <section className="mb-8" aria-labelledby="my-competitions-heading">
          <h2 id="my-competitions-heading" className="mb-4 font-heading text-lg font-semibold">
            My competitions
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.registered.map((c) => {
              const registration = data.registrations.find((r) => r.competitionId === c.id)
              const needsPayment =
                registration &&
                registration.paymentStatus !== 'paid' &&
                registration.paymentStatus !== 'waived'
              return (
                <div key={c.id} className="space-y-2">
                  <StudentCompetitionListCard competition={c} />
                  {needsPayment && registration && (
                    <MyCompetitionPayButton
                      competitionId={c.id}
                      competitionName={c.name}
                      registrationId={registration.id}
                      entryFee={c.entryFee}
                    />
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {data.featured.length > 0 && (
        <section className="mb-8" aria-labelledby="featured-heading">
          <h2 id="featured-heading" className="mb-4 flex items-center gap-2 font-heading text-lg font-semibold">
            <Sparkles className="h-5 w-5 text-accent" aria-hidden />
            Featured
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {data.featured.map((c) => (
              <StudentCompetitionListCard key={c.id} competition={c} variant="featured" />
            ))}
          </div>
        </section>
      )}

      {data.recommended.length > 0 && (
        <section className="mb-8" aria-labelledby="recommended-heading">
          <h2 id="recommended-heading" className="mb-4 font-heading text-lg font-semibold">Recommended</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recommended.map((c) => (
              <StudentCompetitionListCard key={c.id} competition={c} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-8" aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="mb-4 font-heading text-lg font-semibold">Upcoming</h2>
        {visibleUpcoming.length === 0 ? (
          <EmptyState title="No upcoming competitions" description="Try adjusting your filters." />
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visibleUpcoming.map((c) => (
                <StudentCompetitionListCard key={c.id} competition={c} />
              ))}
            </div>
            {visibleCount < (data.upcoming.length ?? 0) && (
              <button
                type="button"
                onClick={loadMore}
                className="mt-4 min-h-[44px] w-full rounded-lg border border-border text-sm font-medium hover:bg-muted sm:w-auto sm:px-6"
              >
                Load more
              </button>
            )}
          </>
        )}
      </section>

      {data.recent.length > 0 && (
        <section aria-labelledby="recent-heading">
          <h2 id="recent-heading" className="mb-4 font-heading text-lg font-semibold">Recently announced</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {data.recent.map((c) => (
              <StudentCompetitionListCard key={c.id} competition={c} variant="compact" />
            ))}
          </div>
        </section>
      )}
    </>
  )
})

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
      <ErrorState title="Could not load your competitions" message={error} onRetry={() => void refetch()} />
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
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
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
        {data.map(({ competition, registration }) => {
          const needsPayment =
            registration.paymentStatus !== 'paid' && registration.paymentStatus !== 'waived'
          return (
            <div key={competition.id} className="space-y-2">
              <StudentCompetitionListCard competition={competition} />
              <div className="flex flex-wrap gap-2 px-1">
                {needsPayment && (
                  <MyCompetitionPayButton
                    competitionId={competition.id}
                    competitionName={competition.name}
                    registrationId={registration.id}
                    entryFee={competition.entryFee}
                    onPaid={() => void refetch(true)}
                  />
                )}
                <Link to={`/dashboard/student/competitions/${competition.id}/preparation`} className="text-xs font-medium text-primary hover:underline">
                  Prepare
                </Link>
                <Link to={`/dashboard/student/competitions/${competition.id}/live`} className="text-xs font-medium text-primary hover:underline">
                  Live
                </Link>
                {registration.status === 'confirmed' && (
                  <Link to="/dashboard/student/results" className="text-xs font-medium text-primary hover:underline">
                    Results
                  </Link>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </>
  )
}

function MyCompetitionPayButton({
  competitionId,
  competitionName,
  registrationId,
  entryFee,
  onPaid,
}: {
  competitionId: string
  competitionName: string
  registrationId: string
  entryFee: number
  onPaid?: () => void
}) {
  const { user } = useApp()
  const [paying, setPaying] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handlePay() {
    setPaying(true)
    setError(null)
    try {
      await payStudentRegistration(registrationId, entryFee, {
        studentName: user?.name ?? 'Student',
        studentEmail: user?.email ?? undefined,
        competitionName,
      })
      onPaid?.()
    } catch (err) {
      setError(formatUserFacingError(err, 'Payment failed.'))
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="px-1">
      <button
        type="button"
        disabled={paying}
        onClick={() => void handlePay()}
        className="inline-flex min-h-[40px] items-center gap-2 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
      >
        <CreditCard className="h-3.5 w-3.5" aria-hidden />
        {paying ? 'Processing…' : `Pay ₹${entryFee.toLocaleString('en-IN')}`}
      </button>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      <Link
        to={`/dashboard/student/competitions/register/${competitionId}`}
        className="mt-1 block text-xs text-muted-foreground hover:text-primary"
      >
        Upload documents
      </Link>
    </div>
  )
}
