import { Link, useParams } from 'react-router-dom'
import { Download, Heart, MessageCircle, Share2 } from 'lucide-react'
import { memo, useState } from 'react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { isCompetitionSaved, toggleSavedCompetition } from '../../../utils/savedCompetitions'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { CompetitionHero } from '../../../components/student/competition/CompetitionHero'
import { fetchStudentCompetitionDetail, formatCategoryLabel } from '../../../services/studentCompetitionExperience'

type TabId = 'overview' | 'rules' | 'schedule' | 'judges' | 'participants' | 'faqs' | 'gallery'

const TABS: { id: TabId; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'rules', label: 'Rules' },
  { id: 'schedule', label: 'Schedule' },
  { id: 'judges', label: 'Judges' },
  { id: 'participants', label: 'Participants' },
  { id: 'faqs', label: 'FAQs' },
  { id: 'gallery', label: 'Gallery' },
]

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export const StudentCompetitionDetailPage = memo(function StudentCompetitionDetailPage() {
  const { competitionId = '' } = useParams()
  const { user } = useApp()
  const userId = user?.id ?? ''
  const [tab, setTab] = useState<TabId>('overview')
  const [saved, setSaved] = useState(() => isCompetitionSaved(userId, competitionId))

  const { data, loading, error, refetch } = useAsyncData(
    () =>
      userId && competitionId
        ? fetchStudentCompetitionDetail(competitionId, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, competitionId],
    { enabled: Boolean(userId && competitionId) },
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

  const { competition, categories, events, registration, judges, participantCount, faqs, gallery } =
    data
  const canRegister = data.registrationOpen && !registration

  const share = async () => {
    const url = window.location.href
    if (navigator.share) await navigator.share({ title: competition.name, url })
    else await navigator.clipboard.writeText(url)
  }

  const toggleSave = () => {
    const next = toggleSavedCompetition(userId, competitionId)
    setSaved(next)
  }

  return (
    <>
      <CompetitionHero
        competition={competition}
        daysUntil={data.daysUntil}
        registrationStatus={registration?.status ?? null}
        registrationOpen={data.registrationOpen}
      />

      <div className="mb-6 flex flex-wrap gap-3">
        {canRegister && (
          <Link
            to={`/dashboard/student/competitions/register/${competitionId}`}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover"
          >
            Register
          </Link>
        )}
        {registration && (
          <Link
            to={`/dashboard/student/competitions/${competitionId}/preparation`}
            className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
          >
            Preparation
          </Link>
        )}
        <button type="button" onClick={() => void share()} className="action-btn">
          <Share2 className="h-4 w-4" aria-hidden />
          Share
        </button>
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
            className="action-btn"
          >
            <Download className="h-4 w-4" aria-hidden />
            Rulebook
          </button>
        )}
        <Link to="/dashboard/student/messages" className="action-btn">
          <MessageCircle className="h-4 w-4" aria-hidden />
          Message organizer
        </Link>
        <button
          type="button"
          onClick={toggleSave}
          className={`action-btn ${saved ? 'border-primary text-primary' : ''}`}
          aria-pressed={saved}
        >
          <Heart className={`h-4 w-4 ${saved ? 'fill-current' : ''}`} aria-hidden />
          {saved ? 'Saved' : 'Save'}
        </button>
      </div>

      <nav
        className="mb-6 flex gap-1 overflow-x-auto border-b border-border"
        role="tablist"
        aria-label="Competition sections"
      >
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
            className={`min-h-[44px] shrink-0 border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            {label}
          </button>
        ))}
      </nav>

      {tab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <DashboardCard title="About">
            <p className="text-sm text-muted-foreground">{competition.description ?? 'Details coming soon.'}</p>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Entry fee</dt>
                <dd className="font-medium">
                  {competition.entryFee > 0
                    ? `₹${competition.entryFee.toLocaleString('en-IN')}`
                    : 'Free'}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted-foreground">Deadline</dt>
                <dd>{competition.registrationDeadline ?? 'TBA'}</dd>
              </div>
            </dl>
          </DashboardCard>
          <DashboardCard title="Categories">
            <ul className="space-y-2">
              {categories.map((cat) => (
                <li key={cat.id} className="rounded-lg border border-border px-3 py-2 text-sm">
                  {formatCategoryLabel(cat)}
                </li>
              ))}
            </ul>
          </DashboardCard>
        </div>
      )}

      {tab === 'rules' && (
        <DashboardCard title="Rules">
          <div className="whitespace-pre-wrap text-sm text-muted-foreground">
            {competition.rules ?? 'Rules will be published by the organizer.'}
          </div>
        </DashboardCard>
      )}

      {tab === 'schedule' && (
        <DashboardCard title="Schedule">
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">Schedule not published yet.</p>
          ) : (
            <ul className="space-y-2">
              {events.map((ev) => (
                <li key={ev.id} className="text-sm">
                  <span className="font-medium">{ev.name}</span>
                  <span className="text-muted-foreground"> · {formatDateTime(ev.startsAt)}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      )}

      {tab === 'judges' && (
        <DashboardCard title="Judges">
          {judges.length === 0 ? (
            <p className="text-sm text-muted-foreground">Judges will be announced.</p>
          ) : (
            <ul className="space-y-2">
              {judges.map((j) => (
                <li key={j.id} className="text-sm font-medium">
                  {j.userName ?? 'Judge'} · <span className="capitalize text-muted-foreground">{j.role.replace(/_/g, ' ')}</span>
                </li>
              ))}
            </ul>
          )}
        </DashboardCard>
      )}

      {tab === 'participants' && (
        <DashboardCard title="Participants">
          <p className="text-sm">
            <strong>{participantCount}</strong> registered
            {competition.maxParticipants && ` · ${competition.maxParticipants} capacity`}
          </p>
        </DashboardCard>
      )}

      {tab === 'faqs' && (
        <DashboardCard title="FAQs">
          {faqs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No FAQs yet.</p>
          ) : (
            <dl className="space-y-4">
              {faqs.map((f) => (
                <div key={f.q}>
                  <dt className="font-medium">{f.q}</dt>
                  <dd className="mt-1 text-sm text-muted-foreground">{f.a}</dd>
                </div>
              ))}
            </dl>
          )}
        </DashboardCard>
      )}

      {tab === 'gallery' && (
        <DashboardCard title="Gallery">
          {gallery.length === 0 ? (
            <p className="text-sm text-muted-foreground">Gallery coming soon.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {gallery.map((url) => (
                <img key={url} src={url} alt="" className="aspect-video rounded-lg object-cover" loading="lazy" />
              ))}
            </div>
          )}
        </DashboardCard>
      )}
    </>
  )
})
