import { Calendar, MapPin, Timer } from 'lucide-react'
import type { Competition } from '../../../domain/competition/models'

interface CompetitionHeroProps {
  competition: Competition
  daysUntil: number | null
  registrationStatus: string | null
  registrationOpen: boolean
}

function formatDate(date: string | null) {
  if (!date) return 'Dates TBA'
  return new Date(date).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CompetitionHero({
  competition,
  daysUntil,
  registrationStatus,
  registrationOpen,
}: CompetitionHeroProps) {
  const statusLabel = registrationStatus
    ? registrationStatus.replace(/_/g, ' ')
    : registrationOpen
      ? 'Registration open'
      : competition.status.replace(/_/g, ' ')

  return (
    <header
      className="relative mb-6 overflow-hidden rounded-[16px] bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 text-primary-foreground sm:p-8"
      role="banner"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(201,162,39,0.25),transparent_55%)]" aria-hidden />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest opacity-80">
          {competition.scope} · {competition.format}
        </p>
        <h1 className="mt-2 font-heading text-2xl font-bold sm:text-3xl">{competition.name}</h1>
        {competition.description && (
          <p className="mt-2 max-w-2xl text-sm opacity-90">{competition.description}</p>
        )}

        <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <div className="flex items-center gap-1.5">
            <dt className="sr-only">Organizer</dt>
            <dd>{competition.organizerName ?? 'Yogstra organizer'}</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Calendar className="h-4 w-4 shrink-0" aria-hidden />
            <dt className="sr-only">Date</dt>
            <dd>{formatDate(competition.startDate)}</dd>
          </div>
          {(competition.venue || competition.city) && (
            <div className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4 shrink-0" aria-hidden />
              <dt className="sr-only">Venue</dt>
              <dd>{[competition.venue, competition.city, competition.state].filter(Boolean).join(', ')}</dd>
            </div>
          )}
          {daysUntil !== null && daysUntil >= 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-black/20 px-3 py-0.5">
              <Timer className="h-4 w-4" aria-hidden />
              <dt className="sr-only">Countdown</dt>
              <dd>{daysUntil === 0 ? 'Starts today' : `${daysUntil} days to go`}</dd>
            </div>
          )}
        </dl>

        <p className="mt-4 inline-flex rounded-full bg-primary-foreground/15 px-3 py-1 text-xs font-medium capitalize backdrop-blur-sm">
          {statusLabel}
        </p>
      </div>
    </header>
  )
}
