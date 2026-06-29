import { Link } from 'react-router-dom'
import { ArrowRight, Calendar, MapPin } from 'lucide-react'
import type { PublicCompetitionItem } from '../../services/publicCompetitionService'

interface CompetitionsTeaserProps {
  competitions: PublicCompetitionItem[]
  loading?: boolean
  error?: string | null
}

function formatDate(date: string | null) {
  if (!date) return 'Dates TBA'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function CompetitionsTeaser({ competitions, loading, error }: CompetitionsTeaserProps) {
  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between gap-2">
        <h2 className="font-heading text-lg font-medium">Upcoming Competitions</h2>
        <Link
          to="/competitions"
          className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
        >
          View all
          <ArrowRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-[12px] border border-border bg-muted" />
          ))}
        </div>
      ) : error ? (
        <p className="text-sm text-muted-foreground rounded-[16px] border border-border px-4 py-3 bg-elevated">
          Competitions unavailable right now.
        </p>
      ) : competitions.length === 0 ? (
        <p className="text-sm text-muted-foreground rounded-[16px] border border-border px-4 py-3 bg-elevated">
          No upcoming competitions yet.
        </p>
      ) : (
        <div className="space-y-3">
          {competitions.map((comp) => (
            <Link
              key={comp.id}
              to={`/competitions/${comp.slug}`}
              className="block rounded-sm border border-border bg-elevated p-4 transition hover:border-primary/40 hover:bg-muted"
            >
              <h3 className="font-medium text-sm mb-2">{comp.name}</h3>
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                {(comp.city || comp.state) && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} /> {[comp.city, comp.state].filter(Boolean).join(', ')}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Calendar size={12} /> {formatDate(comp.startDate)}
                </span>
                {comp.registrationOpen && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-primary">Open</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
