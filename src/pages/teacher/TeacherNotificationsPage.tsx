import { Bell, CheckCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useTeacherNotificationCount } from '../../hooks/useTeacherNotificationCount'
import {
  fetchTeacherNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from '../../services/teacherNotifications'
import { Button } from '../../components/ui/Button'
import { NotificationBody } from '../../components/notifications/NotificationBody'
import { NotificationsListSkeleton } from '../../components/ui/Skeleton'
import { formatRelativeDate } from '../../utils/format'
import { studentProfilePath } from '../../utils/chatRoutes'

export function TeacherNotificationsPage() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''
  const { refresh: refreshCount } = useTeacherNotificationCount(teacherId)

  const { data: notifications, loading, error, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherNotifications(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  const unread = (notifications ?? []).filter((n) => !n.readAt).length

  const handleMarkRead = async (id: string) => {
    await markNotificationRead(id)
    await refetch(true)
    refreshCount()
  }

  const handleMarkAllRead = async () => {
    if (!teacherId) return
    await markAllNotificationsRead(teacherId)
    await refetch(true)
    refreshCount()
  }

  if (loading && !notifications?.length) {
    return <NotificationsListSkeleton />
  }

  return (
    <div className="p-4 sm:p-8 max-w-3xl">
      <div className="flex items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <Bell size={22} className="text-teal" />
          <h1 className="text-xl font-semibold">Notifications</h1>
          {unread > 0 && (
            <span className="text-xs font-semibold text-cream bg-teal px-2 py-0.5 rounded-full">
              {unread} new
            </span>
          )}
        </div>
        {unread > 0 && (
          <Button variant="secondary" size="sm" onClick={() => void handleMarkAllRead()}>
            <CheckCheck size={14} className="mr-1.5" />
            Mark all read
          </Button>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mb-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      {!notifications?.length ? (
        <div className="border border-border rounded-sm bg-cream px-6 py-12 text-center">
          <p className="text-charcoal/50 text-sm">No notifications yet.</p>
          <p className="text-charcoal/40 text-xs mt-2">
            New class bookings appear here after students complete payment.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {(notifications ?? []).map((n) => (
            <li
              key={n.id}
              className={`border rounded-sm p-4 transition-colors ${
                n.readAt
                  ? 'border-border bg-cream'
                  : 'border-teal/30 bg-teal-soft/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-charcoal/45 mt-0.5">
                    {formatRelativeDate(n.createdAt)}
                  </p>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(n.id)}
                    className="text-xs text-teal font-medium shrink-0 cursor-pointer hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="text-sm text-charcoal/80 whitespace-pre-wrap font-sans leading-relaxed">
                <NotificationBody text={n.body} />
              </div>
              {n.studentId && (
                <Link
                  to={studentProfilePath(n.studentId, 'teacher')}
                  className="inline-block text-xs text-teal font-medium mt-3 hover:underline"
                >
                  View student profile →
                </Link>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
