import { Link } from 'react-router-dom'
import { memo } from 'react'
import { Calendar, MapPin, Trophy } from 'lucide-react'
import type { PublicCompetitionItem } from '../../services/publicCompetitionService'
import { useApp } from '../../context/AppContext'

interface PublicCompetitionListCardProps {
  competition: PublicCompetitionItem
  variant?: 'default' | 'featured'
}

function formatDate(date: string | null) {
  if (!date) return 'Dates TBA'
  return new Date(date).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export const PublicCompetitionListCard = memo(function PublicCompetitionListCard({
  competition,
  variant = 'default',
}: PublicCompetitionListCardProps) {
  const { user } = useApp()
  const isStudent = user?.role === 'student'
  const detailHref = `/competitions/${competition.slug}`
  const registerHref = `/dashboard/student/competitions/register/${competition.id}`
  const isFeatured = variant === 'featured'

  return (
    <article
      className={`group relative flex flex-col overflow-hidden rounded-[16px] border border-border bg-elevated shadow-sm transition hover:border-primary/30 hover:shadow-md ${
        isFeatured ? 'lg:flex-row' : ''
      }`}
    >
      <div
        className={`relative shrink-0 bg-gradient-to-br from-primary/90 to-primary ${
          isFeatured ? 'h-40 lg:h-auto lg:w-48' : 'h-28'
        }`}
        aria-hidden
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Trophy className="h-10 w-10 text-primary-foreground/80" strokeWidth={1.5} />
        </div>
        {competition.daysUntil !== null && competition.daysUntil >= 0 && (
          <span className="absolute right-3 top-3 rounded-full bg-black/30 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
            {competition.daysUntil === 0 ? 'Today' : `${competition.daysUntil}d`}
          </span>
        )}
      </div>

      <div className={`flex flex-1 flex-col p-4 ${isFeatured ? 'sm:p-5' : ''}`}>
        <div className="mb-2 flex flex-wrap items-center gap-2">
          {competition.isRegistered ? (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Registered
            </span>
          ) : competition.registrationOpen ? (
            <span className="rounded-full bg-accent/15 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
              Open
            </span>
          ) : (
            <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium text-muted-foreground">
              {competition.scope.replace(/_/g, ' ')}
            </span>
          )}
        </div>

        <h3 className="font-heading text-base font-semibold leading-snug sm:text-lg">
          <Link
            to={detailHref}
            className="after:absolute after:inset-0 hover:text-primary focus:outline-none"
          >
            {competition.name}
          </Link>
        </h3>

        {competition.description && (
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{competition.description}</p>
        )}

        <div className="mt-auto flex flex-wrap gap-3 pt-3 text-xs text-muted-foreground">
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

        <div className="relative z-10 mt-3 flex flex-wrap gap-2">
          <Link
            to={detailHref}
            className="inline-flex min-h-[40px] items-center rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            View details
          </Link>
          {competition.registrationOpen &&
            (isStudent ? (
              <Link
                to={registerHref}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Register
              </Link>
            ) : (
              <Link
                to="/auth/student"
                state={{ from: registerHref }}
                className="inline-flex min-h-[40px] items-center rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary-hover"
              >
                Sign in to register
              </Link>
            ))}
        </div>
      </div>
    </article>
  )
})
