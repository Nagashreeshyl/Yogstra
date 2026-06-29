import { Link } from 'react-router-dom'
import { ClipboardCheck } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { QuickActionButton } from '../../shell/QuickActionButton'
import type { TeacherDashboardAttendance } from '../../../services/teacherDashboard'

interface AttendanceWidgetProps {
  attendance: TeacherDashboardAttendance
}

export function AttendanceWidget({ attendance }: AttendanceWidgetProps) {
  const weeklyLabel =
    attendance.weeklyPercentage === null ? '—' : `${attendance.weeklyPercentage}%`

  return (
    <DashboardCard title="Attendance summary" description="Based on scheduled sessions">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Today scheduled</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{attendance.todayScheduled}</p>
        </div>
        <div className="rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Weekly rate</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">{weeklyLabel}</p>
        </div>
        <div className="rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Absent today</p>
          <p className="mt-1 text-2xl font-semibold text-foreground">
            {attendance.absentToday.length}
          </p>
        </div>
      </div>
      {attendance.absentToday.length > 0 && (
        <p className="mt-3 text-sm text-muted-foreground">
          Absent: {attendance.absentToday.join(', ')}
        </p>
      )}
      <div className="mt-5">
        <Link to="/dashboard/teacher/students">
          <QuickActionButton showIcon={false}>
            <span className="inline-flex items-center gap-2">
              <ClipboardCheck size={16} aria-hidden />
              Mark attendance
            </span>
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
