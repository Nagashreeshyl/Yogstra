import { useMemo } from 'react'
import { useApp } from '../../context/AppContext'
import { useMessageNotifications } from '../../hooks/useMessageNotifications'
import { useTeacherNotificationCount } from '../../hooks/useTeacherNotificationCount'
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
  const { count: notificationCount } = useTeacherNotificationCount(
    variant === 'teacher' ? user?.id : undefined,
  )

  return useMemo(() => {
    const messageBadge = unreadTotal > 0 ? unreadTotal : incomingRequests
    const badges: Partial<Record<NavBadgeKey, number>> = {}

    if (variant === 'student' || variant === 'teacher' || variant === 'public') {
      if (messageBadge > 0) badges.messages = messageBadge
    }
    if (variant === 'teacher' && notificationCount > 0) {
      badges.notifications = notificationCount
    }

    return badges
  }, [variant, unreadTotal, incomingRequests, notificationCount])
}
