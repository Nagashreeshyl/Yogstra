import { Link } from 'react-router-dom'
import { Calendar, MapPin, Trophy } from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import { QuickActionButton } from '../../shell/QuickActionButton'
import { EmptyState } from '../../shell/EmptyState'
import type { StudentDashboardCompetition } from '../../../services/studentDashboard'

interface CompetitionCardProps {
  competition: StudentDashboardCompetition | null
}

const registrationLabels = {
  not_registered: 'Not registered',
  registered: 'Registered',
  pending: 'Registration pending',
} as const

export function CompetitionCard({ competition }: CompetitionCardProps) {
  if (!competition) {
    return (
      <DashboardCard title="Competition">
        <EmptyState
          icon={<Trophy size={24} />}
          title="No competitions yet"
          description="Competition registration opens soon. Check back for upcoming events."
          action={
            <Link to="/dashboard/student/competitions">
              <QuickActionButton showIcon={false}>Browse competitions</QuickActionButton>
            </Link>
          }
          className="py-8"
        />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Competition"
      description={`${competition.daysUntil} days remaining`}
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground">
            {competition.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="inline-flex items-center gap-1.5">
              <MapPin size={14} aria-hidden />
              {competition.city}
            </span>
            <span className="inline-flex items-center gap-1.5">
              <Calendar size={14} aria-hidden />
              {competition.date}
            </span>
          </div>
        </div>

        <div className="rounded-[12px] bg-accent/10 px-4 py-3">
          <p className="text-xs font-medium uppercase tracking-wide text-accent">Countdown</p>
          <p className="mt-1 font-heading text-2xl font-semibold text-foreground">
            {competition.daysUntil} days
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Status: {registrationLabels[competition.registrationStatus]}
          </p>
        </div>

        <Link to="/dashboard/student/competitions">
          <QuickActionButton showIcon={false} className="w-full sm:w-auto">
            Register for competition
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
