import { Link } from 'react-router-dom'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import type { OrganizerDashboardCompetitionGroup } from '../../../services/organizerDashboard'
import type { Competition } from '../../../domain/competition/models'
import { formatCompetitionStatus } from '../../../domain/competition/permissions'

interface CompetitionSummaryCardProps {
  groups: OrganizerDashboardCompetitionGroup
  selectedId: string | null
  onSelect: (id: string) => void
}

function CompetitionList({
  title,
  items,
  selectedId,
  onSelect,
}: {
  title: string
  items: Competition[]
  selectedId: string | null
  onSelect: (id: string) => void
}) {
  if (items.length === 0) {
    return (
      <div>
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
        <p className="mt-2 text-sm text-muted-foreground">None</p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{title}</p>
      <ul className="mt-2 space-y-2">
        {items.map((competition) => (
          <li key={competition.id}>
            <button
              type="button"
              onClick={() => onSelect(competition.id)}
              className={`w-full rounded-[12px] border px-3 py-2 text-left transition-colors ${
                selectedId === competition.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/40'
              }`}
            >
              <p className="text-sm font-medium text-foreground truncate">{competition.name}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {formatCompetitionStatus(competition.status)}
                {competition.startDate ? ` · ${competition.startDate}` : ''}
              </p>
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function CompetitionSummaryCard({
  groups,
  selectedId,
  onSelect,
}: CompetitionSummaryCardProps) {
  return (
    <DashboardCard
      title="Active competitions"
      description="Switch between events you manage."
      action={
        <Link to="/dashboard/competitions" className="text-sm font-medium text-primary hover:underline">
          View all
        </Link>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <CompetitionList title="Active" items={groups.active} selectedId={selectedId} onSelect={onSelect} />
        <CompetitionList title="Upcoming" items={groups.upcoming} selectedId={selectedId} onSelect={onSelect} />
        <CompetitionList title="Completed" items={groups.completed} selectedId={selectedId} onSelect={onSelect} />
      </div>
    </DashboardCard>
  )
}
