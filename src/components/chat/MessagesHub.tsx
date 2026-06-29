import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchMessagingUsers,
  formatChatError,
  invalidateMessagingCache,
  requiresChatRequest,
  subscribeToIncomingMessages,
  subscribeToReadUpdates,
  subscribeToUnreadRefresh,
} from '../../services/directChat'
import type { ChatNavigationState } from '../../utils/chatNavigation'
import type { MessagingUser } from '../../types'
import { UserDirectory } from './UserDirectory'
import { DirectChatPanel } from './DirectChatPanel'
import { ChatWindowSkeleton } from '../ui/Skeleton'

type Tab = 'students' | 'teachers'

type MessagesLocationState = Partial<ChatNavigationState>

async function loadMessagingUsers(currentUserId: string, role: 'student' | 'teacher') {
  try {
    return await fetchMessagingUsers(currentUserId, role)
  } catch (err) {
    throw new Error(formatChatError(err))
  }
}

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
  const location = useLocation()
  const navState = (location.state as MessagesLocationState | null) ?? {}
  const defaultTab: Tab = navState.tab ?? (user?.role === 'teacher' ? 'students' : 'teachers')
  const [tab, setTab] = useState<Tab>(defaultTab)
  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    navState.selectedUserId ?? null,
  )
  const pendingSelectRef = useRef<string | null>(navState.selectedUserId ?? null)
  const [loadStudents, setLoadStudents] = useState(
    defaultTab === 'students' || Boolean(navState.selectedUserId),
  )
  const [loadTeachers, setLoadTeachers] = useState(
    defaultTab === 'teachers' || Boolean(navState.selectedUserId),
  )

  const userId = user?.id ?? ''
  const userRole = user?.role === 'teacher' ? 'teacher' : 'student'

  useEffect(() => {
    if (tab === 'students') setLoadStudents(true)
    else setLoadTeachers(true)
  }, [tab])

  useEffect(() => {
    if (!userId) return
    const timer = window.setTimeout(() => {
      setLoadStudents(true)
      setLoadTeachers(true)
    }, 500)
    return () => clearTimeout(timer)
  }, [userId])

  const { data: students, loading: studentsLoading, error: studentsError, refetch: refetchStudents, setData: setStudents } =
    useAsyncData(
      () => (userId ? loadMessagingUsers(userId, 'student') : Promise.resolve([])),
      [userId],
      { enabled: loadStudents && Boolean(userId) },
    )

  const { data: teachers, loading: teachersLoading, error: teachersError, refetch: refetchTeachers, setData: setTeachers } =
    useAsyncData(
      () => (userId ? loadMessagingUsers(userId, 'teacher') : Promise.resolve([])),
      [userId],
      { enabled: loadTeachers && Boolean(userId) },
    )

  const users = tab === 'students' ? students ?? [] : teachers ?? []
  const loading = tab === 'students' ? studentsLoading : teachersLoading
  const fetchError = tab === 'students' ? studentsError : teachersError

  const selectedUser = useMemo((): MessagingUser | null => {
    if (!selectedUserId) return null
    const fromList = users.find((u) => u.id === selectedUserId)
    if (fromList) return fromList
    // Wait for the directory list so threadHidden / thread metadata is known
    if (loading) return null
    if (navState.participant?.id === selectedUserId) {
      return {
        id: navState.participant.id,
        name: navState.participant.name,
        avatar: navState.participant.avatar,
        role: navState.participant.role,
        verified: navState.participant.verified,
      }
    }
    return null
  }, [users, selectedUserId, navState.participant, loading])

  const awaitingNavTarget = Boolean(selectedUserId && loading && !selectedUser)

  const clearThreadUnread = useCallback((threadId: string) => {
    const zeroUnread = (list: MessagingUser[] | null) =>
      list?.map((u) => (u.threadId === threadId ? { ...u, unreadCount: 0 } : u)) ?? null
    setStudents((current) => zeroUnread(current))
    setTeachers((current) => zeroUnread(current))
  }, [setStudents, setTeachers])

  const handleThreadRead = useCallback(
    (threadId: string) => {
      clearThreadUnread(threadId)
    },
    [clearThreadUnread],
  )

  const handleThreadHidden = useCallback(() => {
    invalidateMessagingCache()
    void refetchStudents(true)
    void refetchTeachers(true)
  }, [refetchStudents, refetchTeachers])

  const refreshLists = useCallback(() => {
    invalidateMessagingCache()
    void refetchStudents(true)
    void refetchTeachers(true)
  }, [refetchStudents, refetchTeachers])

  useEffect(() => {
    if (!userId) return
    const refresh = () => {
      invalidateMessagingCache()
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
    if (navState.tab) setTab(navState.tab)
    if (navState.selectedUserId) {
      pendingSelectRef.current = navState.selectedUserId
      setSelectedUserId(navState.selectedUserId)
    }
  }, [navState.selectedUserId, navState.tab])

  useEffect(() => {
    const pending = pendingSelectRef.current
    if (pending) {
      if (users.some((u) => u.id === pending) || navState.participant?.id === pending) {
        setSelectedUserId(pending)
        pendingSelectRef.current = null
        return
      }
      if (loading) return
    }
    if (selectedUserId && users.some((u) => u.id === selectedUserId)) return
    // Desktop split-pane: pre-select first contact. Mobile: stay on list until user picks someone.
    const isSplitPane = window.matchMedia('(min-width: 768px)').matches
    if (isSplitPane && users.length && !selectedUserId && !pending) {
      setSelectedUserId(users[0].id)
    }
  }, [users, selectedUserId, loading, navState.participant?.id])

  const handleTabChange = (next: Tab) => {
    if (next === tab) return
    pendingSelectRef.current = null
    setSelectedUserId(null)
    setTab(next)
  }

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

  const inChatView = Boolean(awaitingNavTarget || selectedUser)

  useEffect(() => {
    if (!inChatView) return
    const isMobile = window.matchMedia('(max-width: 767px)').matches
    if (!isMobile) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [inChatView])

  const showListChrome = !inChatView

  return (
    <div
      className={`h-full flex flex-col min-h-0 ${
        inChatView ? 'p-0 md:p-4 sm:p-6 lg:p-8' : 'p-4 sm:p-6 lg:p-8'
      }`}
    >
      <div className={showListChrome ? 'contents' : 'hidden md:contents'}>
        <div className="flex items-center flex-wrap gap-2 mb-4 shrink-0">
          <h1 className="text-xl font-semibold">Messages</h1>
          {unreadTotal > 0 && (
            <span className="text-xs font-semibold text-primary-foreground bg-primary px-2.5 py-1 rounded-full">
              {unreadTotal} unread
            </span>
          )}
          {incomingCount > 0 && (
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-1 rounded-full">
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
          <p className="text-sm text-red-600 mb-4 border border-red-200 bg-elevated px-4 py-3 rounded-sm">
            {fetchError}
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
                onClick={() => handleTabChange(t)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold capitalize cursor-pointer border-b-2 -mb-px transition-colors ${
                  tab === t
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground/70 hover:text-muted-foreground'
                }`}
              >
                {t}
                {tabIndicator > 0 && (
                  <span
                    className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold ${
                      tabUnread > 0 ? 'bg-primary text-primary-foreground' : 'bg-amber-500 text-primary-foreground'
                    }`}
                  >
                    {tabIndicator > 99 ? '99+' : tabIndicator}
                  </span>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {inChatView && fetchError && (
        <p className="text-sm text-red-600 mb-4 border border-red-200 bg-elevated px-4 py-3 rounded-sm shrink-0">
          {fetchError}
        </p>
      )}

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0 md:h-[calc(100vh-200px)]">
        <UserDirectory
          tab={tab}
          users={users}
          selectedUserId={selectedUserId}
          currentUserId={userId}
          currentUserRole={userRole}
          loading={loading && !users.length}
          onSelect={setSelectedUserId}
          className={
            inChatView
              ? 'hidden md:flex md:h-full md:w-72'
              : 'flex flex-1 min-h-0 md:flex-none md:h-full md:w-72'
          }
        />

        {awaitingNavTarget ? (
          <div
            className={
              inChatView
                ? 'fixed inset-0 z-[55] flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden bg-elevated md:static md:z-auto md:inset-auto md:h-auto md:max-h-none md:flex-1 md:min-h-0'
                : 'hidden md:block flex-1 min-h-0'
            }
          >
            <ChatWindowSkeleton />
          </div>
        ) : selectedUser && user ? (
          <div
            className={
              inChatView
                ? 'fixed inset-0 z-[55] flex flex-col h-[100dvh] max-h-[100dvh] overflow-hidden bg-elevated md:static md:z-auto md:inset-auto md:h-auto md:max-h-none md:flex-1 md:min-h-0'
                : 'hidden md:flex flex-1 min-h-0 flex-col'
            }
          >
            <DirectChatPanel
              key={`${selectedUser.id}-${selectedUser.threadId ?? 'new'}-${selectedUser.threadStatus ?? 'none'}-${selectedUser.threadHidden ?? false}`}
              user={selectedUser}
              currentUserId={user.id}
              currentUserName={user.name}
              currentUserRole={userRole}
              onThreadChange={refreshLists}
              onRead={handleThreadRead}
              onThreadHidden={handleThreadHidden}
              onBack={() => setSelectedUserId(null)}
            />
          </div>
        ) : loading && !users.length ? (
          <div className="flex-1 min-h-[420px] hidden md:block">
            <ChatWindowSkeleton />
          </div>
        ) : (
          !loading && (
            <div className="flex-1 hidden md:flex items-center justify-center rounded-[16px] border border-border text-sm text-muted-foreground bg-elevated min-h-[200px]">
              Select someone to start chatting
            </div>
          )
        )}
      </div>
    </div>
  )
}
