import { Link } from 'react-router-dom'
import { Bell } from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import { EmptyState } from '../../shell/EmptyState'
import { formatRelativeDate } from '../../../utils/format'
import type { StudentDashboardNotification } from '../../../services/studentDashboard'

interface NotificationsCardProps {
  notifications: StudentDashboardNotification[]
}

export function NotificationsCard({ notifications }: NotificationsCardProps) {
  return (
    <DashboardCard
      title="Notifications"
      action={
        notifications.length > 0 ? (
          <Link
            to="/dashboard/student/classes"
            className="text-sm font-medium text-primary hover:underline"
          >
            View all
          </Link>
        ) : undefined
      }
    >
      {notifications.length === 0 ? (
        <EmptyState
          icon={<Bell size={24} />}
          title="All caught up"
          description="Schedule updates and coach messages will appear here."
          className="py-8"
        />
      ) : (
        <ul className="space-y-3">
          {notifications.map((item) => (
            <li key={item.id}>
              {item.href ? (
                <Link
                  to={item.href}
                  className="block rounded-[12px] border border-border px-4 py-3 hover:bg-muted/50 transition-colors"
                >
                  <NotificationItem {...item} />
                </Link>
              ) : (
                <div className="rounded-[12px] border border-border px-4 py-3">
                  <NotificationItem {...item} />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  )
}

function NotificationItem({
  title,
  body,
  createdAt,
}: StudentDashboardNotification) {
  return (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-medium text-foreground">{title}</p>
        <time className="text-xs text-muted-foreground shrink-0">
          {formatRelativeDate(createdAt)}
        </time>
      </div>
      <p className="mt-1 text-sm text-muted-foreground line-clamp-2">{body}</p>
    </>
  )
}
