import { Link } from 'react-router-dom'
import { CalendarClock, Video } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { QuickActionButton } from '../../shell/QuickActionButton'
import { EmptyState } from '../../shell/EmptyState'
import type { TeacherDashboardTodayClass } from '../../../services/teacherDashboard'

interface TodaysClassesCardProps {
  classes: TeacherDashboardTodayClass[]
}

export function TodaysClassesCard({ classes }: TodaysClassesCardProps) {
  if (classes.length === 0) {
    return (
      <DashboardCard title="Today's classes">
        <EmptyState
          icon={<CalendarClock size={24} />}
          title="No classes today"
          description="Your schedule is clear. Use the time to plan sessions or connect with students."
          action={
            <Link to="/dashboard/teacher/schedule">
              <QuickActionButton showIcon={false}>View schedule</QuickActionButton>
            </Link>
          }
          className="py-8"
        />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Today's classes" description={`${classes.length} session${classes.length === 1 ? '' : 's'} scheduled`}>
      <ul className="space-y-3">
        {classes.map((cls) => (
          <li
            key={`${cls.id}-${cls.scheduledAt}`}
            className="rounded-[12px] border border-border px-4 py-4"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-medium text-foreground">{cls.timeLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground">{cls.batchLabel}</p>
                <p className="mt-1 text-sm text-muted-foreground truncate">
                  {cls.studentNames.join(', ')}
                </p>
                <p className="mt-2 text-xs text-muted-foreground">
                  {cls.studentCount} student{cls.studentCount === 1 ? '' : 's'} · {cls.classType}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Link to="/dashboard/teacher/classes">
                  <QuickActionButton showIcon={false} className="text-sm">
                    <span className="inline-flex items-center gap-2">
                      <Video size={16} aria-hidden />
                      {cls.isLive ? 'Join live' : 'Start class'}
                    </span>
                  </QuickActionButton>
                </Link>
                <Link to="/dashboard/teacher/students">
                  <QuickActionButton showIcon={false} className="text-sm bg-muted text-foreground hover:bg-muted/80">
                    Attendance
                  </QuickActionButton>
                </Link>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </DashboardCard>
  )
}
