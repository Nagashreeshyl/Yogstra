import { Trophy } from 'lucide-react'
import { getOrganizerGreeting, getOrganizerTodayLabel } from '../../../services/organizerDashboard'
import type { Competition } from '../../../domain/competition/models'
import { formatCompetitionStatus } from '../../../domain/competition/permissions'

interface OrganizerWelcomeSectionProps {
  organizerName: string
  selectedCompetition: Competition | null
}

export function OrganizerWelcomeSection({
  organizerName,
  selectedCompetition,
}: OrganizerWelcomeSectionProps) {
  return (
    <section className="mb-6 lg:mb-8">
      <div className="flex items-start gap-4">
        <div className="hidden sm:flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-primary/10 text-primary">
          <Trophy size={22} aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-primary">Organizer command center</p>
          <h1 className="font-heading text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
            {getOrganizerGreeting(organizerName)}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{getOrganizerTodayLabel()}</p>
          {selectedCompetition && (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              <span className="font-medium text-foreground">{selectedCompetition.name}</span>
              <span aria-hidden>·</span>
              {formatCompetitionStatus(selectedCompetition.status)}
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
