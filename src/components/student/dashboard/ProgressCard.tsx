import { lazy, Suspense } from 'react'
import type { StudentDashboardAttendance, StudentDashboardProgress } from '../../../services/studentDashboard'
import { DashboardCard } from './DashboardCard'

const MiniBarChart = lazy(() =>
  import('./MiniBarChart').then((m) => ({ default: m.MiniBarChart })),
)

interface ProgressCardProps {
  attendance: StudentDashboardAttendance
  progress: StudentDashboardProgress
}

export function ProgressCard({ attendance, progress }: ProgressCardProps) {
  const attendanceLabel =
    attendance.percentage === null ? '—' : `${attendance.percentage}%`

  return (
    <DashboardCard
      title="Progress & attendance"
      description={`${attendance.monthLabel} overview`}
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <p className="text-sm text-muted-foreground">Attendance</p>
          <p className="mt-1 font-heading text-3xl font-semibold text-foreground">
            {attendanceLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Based on completed sessions this month
          </p>
          <div className="mt-4 h-16">
            <Suspense fallback={<div className="h-full rounded-[12px] bg-muted animate-pulse" />}>
              <MiniBarChart
                values={attendance.monthlyCounts}
                labels={['W1', 'W2', 'W3', 'W4']}
                accent="primary"
              />
            </Suspense>
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-[12px] bg-muted/60 px-3 py-3">
              <p className="text-xs text-muted-foreground">Streak</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {progress.streakWeeks}w
              </p>
            </div>
            <div className="rounded-[12px] bg-muted/60 px-3 py-3">
              <p className="text-xs text-muted-foreground">This week</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {progress.weeklyHours}h
              </p>
            </div>
          </div>
          <div className="mt-4 h-16">
            <Suspense fallback={<div className="h-full rounded-[12px] bg-muted animate-pulse" />}>
              <MiniBarChart
                values={progress.weeklySessionCounts}
                labels={['M', 'T', 'W', 'T', 'F', 'S', 'S']}
                accent="accent"
              />
            </Suspense>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {progress.sessionsCompleted} sessions completed overall
          </p>
        </div>
      </div>
    </DashboardCard>
  )
}
