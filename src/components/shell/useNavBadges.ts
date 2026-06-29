import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useMessageNotifications } from '../../hooks/useMessageNotifications'
import { useTeacherNotificationCount } from '../../hooks/useTeacherNotificationCount'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchUnreadNotificationCountForUser } from '../../services/notificationCenter'
import type { NavBadgeKey, ShellVariant } from './types'

export function useNavBadges(variant: ShellVariant) {
  const { user } = useApp()
  const role =
    variant === 'student' || (variant === 'public' && user?.role === 'student')
      ? 'student'
      : variant === 'teacher'
        ? 'teacher'
        : null

  const { unreadTotal, incomingRequests } = useMessageNotifications(
    role ? user?.id : undefined,
    role ?? 'student',
  )
  const { count: teacherNotificationCount } = useTeacherNotificationCount(
    variant === 'teacher' ? user?.id : undefined,
  )

  const { data: studentNotificationCount } = useAsyncData(
    () =>
      variant === 'student' && user?.id
        ? fetchUnreadNotificationCountForUser(user.id, 'student')
        : Promise.resolve(0),
    [variant, user?.id],
    { enabled: variant === 'student' && Boolean(user?.id) },
  )

  return useMemo(() => {
    const messageBadge = unreadTotal > 0 ? unreadTotal : incomingRequests
    const badges: Partial<Record<NavBadgeKey, number>> = {}

    if (variant === 'student' || variant === 'teacher' || variant === 'public') {
      if (messageBadge > 0) badges.messages = messageBadge
    }
    if (variant === 'teacher' && teacherNotificationCount > 0) {
      badges.notifications = teacherNotificationCount
    }
    if (variant === 'student' && (studentNotificationCount ?? 0) > 0) {
      badges.notifications = studentNotificationCount ?? 0
    }

    return badges
  }, [variant, unreadTotal, incomingRequests, teacherNotificationCount, studentNotificationCount])
}
