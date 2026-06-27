import { useCallback, useEffect, useMemo, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchMessagingUsers,
  requiresChatRequest,
  subscribeToIncomingMessages,
  subscribeToReadUpdates,
  subscribeToUnreadRefresh,
} from '../../services/directChat'
import type { MessagingUser } from '../../types'
import { UserDirectory } from './UserDirectory'
import { DirectChatPanel } from './DirectChatPanel'

type Tab = 'students' | 'teachers'

function countStudentChatRequests(
  users: { id: string; role: 'student' | 'teacher'; threadStatus?: string; requestedBy?: string }[],
  currentUserId: string,
  currentUserRole: 'student' | 'teacher',
  kind: 'incoming' | 'outgoing',
) {
  return users.filter((u) => {
    if (!requiresChatRequest(currentUserRole, u.role)) return false
    if (u.threadStatus !== 'pending') return false
    return kind === 'incoming'
      ? u.requestedBy !== currentUserId
      : u.requestedBy === currentUserId
  }).length
}

export function MessagesHub() {
  const { user } = useApp()
  const [tab, setTab] = useState<Tab>(user?.role === 'teacher' ? 'students' : 'teachers')
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null)

  const userId = user?.id ?? ''
  const userRole = user?.role === 'teacher' ? 'teacher' : 'student'

  const { data: students, loading: studentsLoading, error: studentsError, refetch: refetchStudents, setData: setStudents } =
    useAsyncData(
      () => (userId ? fetchMessagingUsers(userId, 'student') : Promise.resolve([])),
      [userId],
    )

  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers, setData: setTeachers } =
    useAsyncData(
      () => (userId ? fetchMessagingUsers(userId, 'teacher') : Promise.resolve([])),
      [userId],
    )

  const users = tab === 'students' ? students ?? [] : teachers ?? []
  const loading = tab === 'students' ? studentsLoading : teachersLoading
  const fetchError = tab === 'students' ? studentsError : teachersError

  const selectedUser = useMemo(
    () => users.find((u) => u.id === selectedUserId) ?? null,
    [users, selectedUserId],
  )

  const clearThreadUnread = useCallback((threadId: string) => {
    const zeroUnread = (list: MessagingUser[] | null) =>
      list?.map((u) => (u.threadId === threadId ? { ...u, unreadCount: 0 } : u)) ?? null
    setStudents((current) => zeroUnread(current))
    setTeachers((current) => zeroUnread(current))
  }, [setStudents, setTeachers])

  const handleThreadRead = useCallback(
    (threadId: string) => {
      clearThreadUnread(threadId)
      void refetchStudents(true)
      void refetchTeachers(true)
    },
    [clearThreadUnread, refetchStudents, refetchTeachers],
  )

  const refreshLists = useCallback(() => {
    void refetchStudents(true)
    void refetchTeachers(true)
  }, [refetchStudents, refetchTeachers])

  useEffect(() => {
    if (!userId) return
    const refresh = () => {
      void refetchStudents(true)
      void refetchTeachers(true)
    }
    const unsubRefresh = subscribeToUnreadRefresh(refresh)
    const unsubReads = subscribeToReadUpdates(userId, refresh)
    return () => {
      unsubRefresh()
      unsubReads()
    }
  }, [userId, refetchStudents, refetchTeachers])

  useEffect(() => {
    if (users.length && !selectedUserId) {
      setSelectedUserId(users[0].id)
    }
  }, [users, selectedUserId])

  useEffect(() => {
    setSelectedUserId(null)
  }, [tab])

  useEffect(() => {
    if (!userId) return
    const unsubscribe = subscribeToIncomingMessages(userId, refreshLists, 'hub')
    return unsubscribe
  }, [userId, refreshLists])

  const incomingCount = useMemo(
    () => countStudentChatRequests(students ?? [], userId, userRole, 'incoming'),
    [students, userId, userRole],
  )

  const outgoingCount = useMemo(
    () => countStudentChatRequests(students ?? [], userId, userRole, 'outgoing'),
    [students, userId, userRole],
  )

  const unreadTotal = useMemo(
    () =>
      [...(students ?? []), ...(teachers ?? [])].reduce(
        (sum, u) => sum + (u.unreadCount ?? 0),
        0,
      ),
    [students, teachers],
  )

  const studentsTabBadge = incomingCount + outgoingCount
  const teachersTabUnread = useMemo(
    () => (teachers ?? []).reduce((sum, u) => sum + (u.unreadCount ?? 0), 0),
    [teachers],
  )
  const studentsTabUnread = useMemo(
    () => (students ?? []).reduce((sum, u) => sum + (u.unreadCount ?? 0), 0),
    [students],
  )

  return (
    <div className="p-4 sm:p-8 h-full flex flex-col min-h-0">
      <div className="flex items-center flex-wrap gap-2 mb-4 shrink-0">
        <h1 className="text-xl font-semibold">Messages</h1>
        {unreadTotal > 0 && (
          <span className="text-xs font-semibold text-cream bg-teal px-2.5 py-1 rounded-full">
            {unreadTotal} unread
          </span>
        )}
        {incomingCount > 0 && (
          <span className="text-xs font-semibold text-teal bg-teal-soft px-2 py-1 rounded-full">
            {incomingCount} new request{incomingCount === 1 ? '' : 's'}
          </span>
        )}
        {outgoingCount > 0 && (
          <span className="text-xs font-semibold text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
            {outgoingCount} sent
          </span>
        )}
      </div>

      {fetchError && (
        <p className="text-sm text-red-600 mb-4 border border-red-200 bg-cream px-4 py-3 rounded-sm">
          Could not load messages. Run{' '}
          <code className="text-xs">supabase/chat-threads.sql</code> and{' '}
          <code className="text-xs">supabase/chat-reads.sql</code> in Supabase, then refresh.
        </p>
      )}

      <div className="flex gap-1 mb-4 shrink-0 border-b border-border">
        {(['students', 'teachers'] as const).map((t) => {
          const tabUnread = t === 'students' ? studentsTabUnread : teachersTabUnread
          const tabRequests = t === 'students' ? studentsTabBadge : 0
          const tabIndicator = tabUnread + tabRequests

          return (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold capitalize cursor-pointer border-b-2 -mb-px transition-colors ${
                tab === t
                  ? 'border-teal text-charcoal'
                  : 'border-transparent text-charcoal/45 hover:text-charcoal/70'
              }`}
            >
              {t}
              {tabIndicator > 0 && (
                <span
                  className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
                    tabUnread > 0 ? 'bg-teal text-cream' : 'bg-amber-500 text-cream'
                  }`}
                >
                  {tabIndicator > 99 ? '99+' : tabIndicator}
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 md:h-[calc(100vh-200px)]">
        <UserDirectory
          tab={tab}
          users={users}
          selectedUserId={selectedUserId}
          currentUserId={userId}
          currentUserRole={userRole}
          loading={loading && !users.length}
          onSelect={setSelectedUserId}
        />

        {selectedUser && user ? (
          <div className="flex-1 min-h-[420px] md:min-h-0">
            <DirectChatPanel
              key={`${selectedUser.id}-${selectedUser.threadId}-${selectedUser.threadStatus}`}
              user={selectedUser}
              currentUserId={user.id}
              currentUserRole={userRole}
              onThreadChange={refreshLists}
              onRead={handleThreadRead}
            />
          </div>
        ) : (
          !loading && (
            <div className="flex-1 hidden md:flex items-center justify-center border border-border rounded-sm text-sm text-charcoal/50 bg-cream">
              Select someone to start chatting
            </div>
          )
        )}
      </div>
    </div>
  )
}
