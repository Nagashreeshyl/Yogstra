import { Link } from 'react-router-dom'
import { CalendarClock, Video } from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import { Avatar } from '../../ui/Avatar'
import { QuickActionButton } from '../../shell/QuickActionButton'
import { EmptyState } from '../../shell/EmptyState'
import { formatTime } from '../../../utils/format'
import type { StudentDashboardNextClass } from '../../../services/studentDashboard'

interface NextClassCardProps {
  nextClass: StudentDashboardNextClass | null
}

function formatCountdown(scheduledAt: string): string {
  const diffMs = new Date(scheduledAt).getTime() - Date.now()
  if (diffMs <= 0) return 'Starting now'
  const hours = Math.floor(diffMs / 3_600_000)
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000)
  if (hours >= 24) {
    const days = Math.floor(hours / 24)
    return `In ${days} day${days === 1 ? '' : 's'}`
  }
  if (hours > 0) return `In ${hours}h ${minutes}m`
  return `In ${minutes} min`
}

export function NextClassCard({ nextClass }: NextClassCardProps) {
  if (!nextClass) {
    return (
      <DashboardCard title="Next class">
        <EmptyState
          icon={<CalendarClock size={24} />}
          title="No upcoming class"
          description="Book a coach or check your schedule to see your next session."
          action={
            <Link to="/dashboard/student/classes">
              <QuickActionButton showIcon={false}>View schedule</QuickActionButton>
            </Link>
          }
          className="py-8"
        />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Next class"
      description={formatCountdown(nextClass.scheduledAt)}
    >
      <div className="flex items-start gap-4">
        <Avatar src={nextClass.teacherPhoto} name={nextClass.teacherName} size={48} />
        <div className="min-w-0 flex-1">
          <p className="font-medium text-foreground">{nextClass.teacherName}</p>
          <p className="mt-1 text-sm text-muted-foreground">{nextClass.batchLabel}</p>
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarClock size={16} className="text-primary" aria-hidden />
            {formatTime(nextClass.scheduledAt)}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <Link to="/dashboard/student/classes">
          <QuickActionButton showIcon={false} className="w-full sm:w-auto" aria-label={nextClass.isLive ? 'Join live class' : 'View class details'}>
            <span className="inline-flex items-center gap-2">
              <Video size={16} aria-hidden />
              {nextClass.isLive ? 'Join live class' : 'View details'}
            </span>
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
