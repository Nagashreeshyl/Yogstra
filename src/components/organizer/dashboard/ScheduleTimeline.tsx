import { AlertTriangle, Clock } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { EmptyState } from '../../shell/EmptyState'
import type { OrganizerScheduleSummary } from '../../../services/organizerDashboard'
import { formatTime } from '../../../utils/format'

interface ScheduleTimelineProps {
  summary: OrganizerScheduleSummary
}

function EventRow({
  name,
  startsAt,
  venue,
  stage,
  badge,
}: {
  name: string
  startsAt: string
  venue?: string | null
  stage?: string | null
  badge?: string
}) {
  return (
    <li className="flex items-start gap-3 rounded-[12px] border border-border px-3 py-2">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-semibold">
        {formatTime(startsAt).slice(0, 5)}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-foreground">{name}</p>
          {badge && (
            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium uppercase text-amber-800 dark:bg-amber-950 dark:text-amber-200">
              {badge}
            </span>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {[venue, stage].filter(Boolean).join(' · ') || 'Venue TBD'}
        </p>
      </div>
    </li>
  )
}

export function ScheduleTimeline({ summary }: ScheduleTimelineProps) {
  return (
    <DashboardCard
      title="Schedule"
      description={`${summary.todayEvents.length} today · ${summary.upcomingEvents.length} upcoming · ${summary.conflicts.length} conflicts`}
    >
      {summary.conflicts.length > 0 && (
        <div className="mb-4 space-y-2">
          {summary.conflicts.map((conflict) => (
            <div
              key={`${conflict.eventA}-${conflict.eventB}`}
              className="flex items-start gap-2 rounded-[12px] border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/40 dark:bg-amber-950/30"
            >
              <AlertTriangle size={16} className="mt-0.5 shrink-0 text-amber-700" aria-hidden />
              <p>
                <span className="font-medium">{conflict.eventA}</span> ↔{' '}
                <span className="font-medium">{conflict.eventB}</span> — {conflict.reason}
              </p>
            </div>
          ))}
        </div>
      )}

      {summary.lateStarts.length > 0 && (
        <div className="mb-4 flex items-center gap-2 text-sm text-amber-800 dark:text-amber-200">
          <Clock size={16} aria-hidden />
          {summary.lateStarts.length} session{summary.lateStarts.length === 1 ? '' : 's'} past start time
        </div>
      )}

      <div className="space-y-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Today</p>
          {summary.todayEvents.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions scheduled for today.</p>
          ) : (
            <ul className="space-y-2">
              {summary.todayEvents.map((event) => (
                <EventRow key={event.id} {...event} />
              ))}
            </ul>
          )}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-2">Upcoming</p>
          {summary.upcomingEvents.length === 0 ? (
            <EmptyState
              title="No upcoming sessions"
              description="Build your schedule in the creation wizard or add events later."
              className="py-6"
            />
          ) : (
            <ul className="space-y-2">
              {summary.upcomingEvents.map((event) => (
                <EventRow key={event.id} {...event} />
              ))}
            </ul>
          )}
        </div>
      </div>
    </DashboardCard>
  )
}
