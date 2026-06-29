import { Link } from 'react-router-dom'
import { ChevronRight, Lock } from 'lucide-react'
import { DashboardCard } from '../student/dashboard/DashboardCard'
import { Button } from '../ui/Button'
import type { JudgeAssignmentView } from '../../services/judgeDashboard'
import { formatTime } from '../../utils/format'

interface JudgeAssignmentCardProps {
  assignment: JudgeAssignmentView
}

export function JudgeAssignmentCard({ assignment }: JudgeAssignmentCardProps) {
  const { competition, category, event, participantCount, scoredCount, isLocked, statusLabel } =
    assignment

  if (!category) return null

  const sessionPath = `/dashboard/judge/session/${competition.id}/${category.id}`

  return (
    <DashboardCard
      title={competition.name}
      description={category.name}
      action={
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-medium ${
            isLocked
              ? 'bg-muted text-muted-foreground'
              : statusLabel === 'Live'
                ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200'
                : 'bg-primary/10 text-primary'
          }`}
        >
          {isLocked && <Lock size={12} className="inline mr-1" aria-hidden />}
          {statusLabel}
        </span>
      }
    >
      <dl className="grid grid-cols-2 gap-3 text-sm mb-4">
        <div>
          <dt className="text-muted-foreground text-xs">Stage</dt>
          <dd className="font-medium">{event?.stage ?? 'Main stage'}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Session</dt>
          <dd className="font-medium">
            {event ? formatTime(event.startsAt) : competition.startDate ?? 'TBD'}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Participants</dt>
          <dd className="font-medium">{participantCount}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground text-xs">Scored</dt>
          <dd className="font-medium">
            {scoredCount}/{participantCount}
          </dd>
        </div>
      </dl>

      {isLocked ? (
        <Link
          to={sessionPath}
          className="inline-flex w-full items-center justify-center gap-2 rounded-[12px] border border-border py-3 text-sm font-medium hover:bg-muted min-h-[48px]"
        >
          Review scores
          <ChevronRight size={16} aria-hidden />
        </Link>
      ) : (
        <Link to={sessionPath} className="block">
          <Button className="w-full min-h-[48px] text-base" size="lg">
            Start judging
            <ChevronRight size={18} className="ml-1" aria-hidden />
          </Button>
        </Link>
      )}
    </DashboardCard>
  )
}
