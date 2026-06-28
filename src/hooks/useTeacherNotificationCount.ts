import { useCallback, useEffect, useState } from 'react'
import {
  fetchUnreadNotificationCount,
  subscribeToTeacherNotifications,
} from '../services/teacherNotifications'

export function useTeacherNotificationCount(teacherId: string | undefined) {
  const [count, setCount] = useState(0)

  const refresh = useCallback(() => {
    if (!teacherId) return
    void fetchUnreadNotificationCount(teacherId).then(setCount).catch(() => setCount(0))
  }, [teacherId])

  useEffect(() => {
    refresh()
    if (!teacherId) return
    return subscribeToTeacherNotifications(teacherId, refresh)
  }, [teacherId, refresh])

  return { count, refresh }
}
