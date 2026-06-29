import { Link } from 'react-router-dom'
import { AlertTriangle } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { EmptyState } from '../../shell/EmptyState'
import type { TeacherDashboardAlert } from '../../../services/teacherDashboard'

interface StudentAlertsCardProps {
  alerts: TeacherDashboardAlert[]
}

const alertLabels: Record<TeacherDashboardAlert['type'], string> = {
  payment: 'Payment',
  attendance: 'Attendance',
  competition: 'Competition',
  assignment: 'Assignment',
}

export function StudentAlertsCard({ alerts }: StudentAlertsCardProps) {
  return (
    <DashboardCard title="Student alerts" description="Actionable items only">
      {alerts.length === 0 ? (
        <EmptyState
          icon={<AlertTriangle size={24} />}
          title="No alerts"
          description="Students are on track. Alerts appear for payments, attendance, and competitions."
          className="py-8"
        />
      ) : (
        <ul className="space-y-2">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                to={alert.href}
                className="block rounded-[12px] border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{alert.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {alert.description}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                    {alertLabels[alert.type]}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}
