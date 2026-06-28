import { useEffect, useState } from 'react'
import { useAsyncData } from './useAsyncData'
import {
  fetchMessagingUsers,
  fetchTotalUnreadCount,
  requiresChatRequest,
  subscribeToIncomingMessages,
  subscribeToReadUpdates,
  subscribeToUnreadRefresh,
} from '../services/directChat'

export function useMessageNotifications(
  userId: string | undefined,
  userRole: 'student' | 'teacher',
) {
  const [tick, setTick] = useState(0)

  const { data: students, refetch: refetchStudents } = useAsyncData(
    () => (userId ? fetchMessagingUsers(userId, 'student') : Promise.resolve([])),
    [userId, tick],
  )

  const { data: teachers, refetch: refetchTeachers } = useAsyncData(
    () => (userId ? fetchMessagingUsers(userId, 'teacher') : Promise.resolve([])),
    [userId, tick],
  )

  const { data: unreadTotal, refetch: refetchUnread } = useAsyncData(
    () => (userId ? fetchTotalUnreadCount(userId) : Promise.resolve(0)),
    [userId, tick],
  )

  useEffect(() => {
    if (!userId) return
    const refresh = () => {
      setTick((t) => t + 1)
      void refetchStudents(true)
      void refetchTeachers(true)
      void refetchUnread(true)
    }
    const unsubMessages = subscribeToIncomingMessages(userId, refresh, 'notifications')
    const unsubReads = subscribeToReadUpdates(userId, refresh)
    const unsubUnread = subscribeToUnreadRefresh(refresh)
    return () => {
      unsubMessages()
      unsubReads()
      unsubUnread()
    }
  }, [userId, refetchStudents, refetchTeachers, refetchUnread])

  const allUsers = [...(students ?? []), ...(teachers ?? [])]

  const incomingRequests = allUsers.filter(
    (u) =>
      requiresChatRequest(userRole, u.role) &&
      u.threadStatus === 'pending' &&
      u.requestedBy !== userId,
  ).length

  const outgoingRequests = allUsers.filter(
    (u) =>
      requiresChatRequest(userRole, u.role) &&
      u.threadStatus === 'pending' &&
      u.requestedBy === userId,
  ).length

  return {
    unreadTotal: unreadTotal ?? 0,
    incomingRequests,
    outgoingRequests,
    requestTotal: incomingRequests + outgoingRequests,
  }
}
