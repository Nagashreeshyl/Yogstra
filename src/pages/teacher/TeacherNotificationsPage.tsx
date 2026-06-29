import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Check, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useTeacherNotificationCount } from '../../hooks/useTeacherNotificationCount'
import {
  fetchTeacherNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToTeacherNotifications,
} from '../../services/teacherNotifications'
import {
  approveScheduleChangeRequest,
  rejectScheduleChangeRequest,
} from '../../services/scheduleChangeRequests'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { ErrorState } from '../../components/shell/ErrorState'
import { Button } from '../../components/ui/Button'
import { NotificationBody } from '../../components/notifications/NotificationBody'
import { NotificationsListSkeleton } from '../../components/ui/Skeleton'
import { formatRelativeDate } from '../../utils/format'
import { studentProfilePath } from '../../utils/chatRoutes'

export function TeacherNotificationsPage() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''
  const { refresh: refreshCount } = useTeacherNotificationCount(teacherId)
  const [resolvingId, setResolvingId] = useState<string | null>(null)

  const { data: notifications, loading, error, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherNotifications(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  useEffect(() => {
    if (!teacherId) return
    return subscribeToTeacherNotifications(teacherId, () => {
      void refetch(true)
      refreshCount()
    })
  }, [teacherId, refetch, refreshCount])

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

  const handleApproveScheduleChange = async (requestId: string, notificationId: string) => {
    if (!teacherId) return
    setResolvingId(requestId)
    try {
      await approveScheduleChangeRequest(requestId, teacherId)
      await markNotificationRead(notificationId)
      await refetch(true)
      refreshCount()
    } finally {
      setResolvingId(null)
    }
  }

  const handleRejectScheduleChange = async (requestId: string, notificationId: string) => {
    if (!teacherId) return
    setResolvingId(requestId)
    try {
      await rejectScheduleChangeRequest(requestId, teacherId)
      await markNotificationRead(notificationId)
      await refetch(true)
      refreshCount()
    } finally {
      setResolvingId(null)
    }
  }

  if (loading && !notifications?.length) {
    return <NotificationsListSkeleton />
  }

  return (
    <PageContainer width="narrow">
      <div className="space-y-6">
        <PageHeader
          title="Notifications"
          description={
            unread > 0
              ? `${unread} unread notification${unread === 1 ? '' : 's'}`
              : 'New class bookings appear here after students complete payment.'
          }
          actions={
            unread > 0 ? (
              <Button variant="secondary" size="sm" onClick={() => void handleMarkAllRead()}>
                <CheckCheck size={14} className="mr-1.5" />
                Mark all read
              </Button>
            ) : undefined
          }
        />

        {error && <ErrorState message={error} onRetry={() => void refetch(true)} />}

        {!notifications?.length ? (
          <EmptyState
            icon={<Bell size={24} />}
            title="No notifications yet"
            description="New class bookings appear here after students complete payment."
          />
        ) : (
        <ul className="space-y-3">
          {(notifications ?? []).map((n) => (
            <li
              key={n.id}
              className={`rounded-[16px] border border-border p-4 transition-colors ${
                n.readAt
                  ? 'border-border bg-elevated'
                  : 'border-primary/20 bg-primary/10/40'
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div>
                  <p className="font-medium text-sm">{n.title}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5">
                    {formatRelativeDate(n.createdAt)}
                  </p>
                </div>
                {!n.readAt && (
                  <button
                    type="button"
                    onClick={() => void handleMarkRead(n.id)}
                    className="text-xs text-primary font-medium shrink-0 cursor-pointer hover:underline"
                  >
                    Mark read
                  </button>
                )}
              </div>
              <div className="text-sm text-muted-foreground whitespace-pre-wrap font-sans leading-relaxed">
                <NotificationBody text={n.body} />
              </div>
              {n.type === 'schedule_change' && n.requestId && !n.readAt && (
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    className="gap-1.5"
                    disabled={resolvingId === n.requestId}
                    onClick={() => void handleApproveScheduleChange(n.requestId!, n.id)}
                  >
                    <Check size={14} />
                    Approve
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="gap-1.5"
                    disabled={resolvingId === n.requestId}
                    onClick={() => void handleRejectScheduleChange(n.requestId!, n.id)}
                  >
                    <X size={14} />
                    Decline
                  </Button>
                </div>
              )}
              {n.studentId && (
                <Link
                  to={studentProfilePath(n.studentId, 'teacher')}
                  className="inline-block text-xs text-primary font-medium mt-3 hover:underline"
                >
                  View student profile →
                </Link>
              )}
            </li>
          ))}
        </ul>
        )}
      </div>
    </PageContainer>
  )
}
