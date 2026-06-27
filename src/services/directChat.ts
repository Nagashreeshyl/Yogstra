import { supabase } from '../lib/supabase'
import { fetchHiddenThreadIds, fetchUserHistoryCutoffs, upsertThreadSettings } from './chatSettings'
import type { ChatThreadStatus, DirectChatMessage, MessagingUser } from '../types'

function orderParticipants(userId: string, otherId: string) {
  const a = userId.toLowerCase()
  const b = otherId.toLowerCase()
  return a < b
    ? { participant_a: userId, participant_b: otherId }
    : { participant_a: otherId, participant_b: userId }
}

const THREADS_CACHE_TTL_MS = 4_000
let threadsCache: { userId: string; threads: ThreadRow[]; at: number } | null = null

export function invalidateMessagingCache() {
  threadsCache = null
}

export function formatChatError(err: unknown): string {
  if (err && typeof err === 'object') {
    const e = err as { code?: string; message?: string; status?: number; statusCode?: number }
    if (isMissingTableError(e)) {
      return 'Messaging is not set up yet. Ask your admin to run supabase/chat-threads.sql and supabase/chat-reads.sql in the Supabase SQL Editor, then refresh this page.'
    }
    if (e.code === '42501' || e.message?.includes('permission') || e.message?.includes('policy')) {
      return 'You do not have permission to start this conversation. Sign out and sign in again, then retry.'
    }
    if (e.code === '23514' || e.message?.includes('chat_threads_ordered')) {
      return 'Could not create the conversation due to a data ordering issue. Please try again.'
    }
    if (e.message) return e.message
  }
  if (err instanceof Error) return err.message
  return 'Could not complete this messaging action. Please try again.'
}

function mapDirectMessage(row: {
  id: string
  thread_id: string
  sender_id: string
  content: string
  created_at: string
  edited_at?: string | null
  edited_by?: string | null
  deleted_at?: string | null
  deleted_by?: string | null
  delete_scope?: 'self' | 'both' | null
  hidden_for?: string[] | null
}): DirectChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
    editedAt: row.edited_at,
    editedBy: row.edited_by,
    deletedAt: row.deleted_at,
    deletedBy: row.deleted_by,
    deleteScope: row.delete_scope,
    hiddenFor: row.hidden_for ?? [],
  }
}

export function formatMessageDisplay(
  msg: DirectChatMessage,
  viewerId: string,
  deleterName?: string,
): { text: string; meta?: string } {
  if (msg.hiddenFor?.includes(viewerId)) {
    return { text: '', meta: undefined }
  }

  if (msg.deleteScope === 'both' && msg.deletedAt) {
    const when = new Date(msg.deletedAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
    return {
      text: `Message deleted by ${deleterName ?? 'user'}`,
      meta: when,
    }
  }

  let meta: string | undefined
  if (msg.editedAt) {
    meta = `Edited ${new Date(msg.editedAt).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })}`
  }

  return { text: msg.content, meta }
}

type ThreadRow = {
  id: string
  participant_a: string
  participant_b: string
  requested_by: string
  status: ChatThreadStatus
  updated_at: string
  history_cleared_at?: string | null
}

async function fetchHistoryCutoffs(threadIds: string[]): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  if (threadIds.length === 0) return map

  const { data, error } = await supabase
    .from('chat_threads')
    .select('id, history_cleared_at')
    .in('id', threadIds)

  if (error) {
    if (isMissingTableError(error) || isMissingColumnError(error)) return map
    throw error
  }

  for (const row of data ?? []) {
    if (row.history_cleared_at) {
      map.set(row.id as string, row.history_cleared_at as string)
    }
  }
  return map
}

function latestCutoffMs(...cutoffs: (string | null | undefined)[]) {
  const times = cutoffs.filter(Boolean).map((c) => new Date(c!).getTime())
  return times.length ? Math.max(...times) : null
}

function isVisibleAfterHistoryClear(
  createdAt: string,
  ...cutoffs: (string | null | undefined)[]
) {
  const cutoffMs = latestCutoffMs(...cutoffs)
  if (cutoffMs === null) return true
  return new Date(createdAt).getTime() > cutoffMs
}

async function fetchThreadHistoryCutoff(
  threadId: string,
  viewerId?: string,
): Promise<string | null> {
  const [threadCutoffs, userCutoffs] = await Promise.all([
    fetchHistoryCutoffs([threadId]),
    viewerId ? fetchUserHistoryCutoffs(viewerId, [threadId]) : Promise.resolve(new Map()),
  ])
  const threadCutoff = threadCutoffs.get(threadId) ?? null
  const userCutoff = userCutoffs.get(threadId) ?? null
  if (!threadCutoff && !userCutoff) return null
  if (!threadCutoff) return userCutoff
  if (!userCutoff) return threadCutoff
  return new Date(threadCutoff) > new Date(userCutoff) ? threadCutoff : userCutoff
}

async function fetchLastMessagesByThread(
  threadIds: string[],
  viewerId?: string,
): Promise<Map<string, { content: string; createdAt: string }>> {
  const map = new Map<string, { content: string; createdAt: string }>()
  if (threadIds.length === 0) return map

  const [threadCutoffs, userCutoffs] = await Promise.all([
    fetchHistoryCutoffs(threadIds),
    viewerId ? fetchUserHistoryCutoffs(viewerId, threadIds) : Promise.resolve(new Map()),
  ])

  const rows = await Promise.all(
    threadIds.map(async (threadId) => {
      const clearedAt = await (async () => {
        const t = threadCutoffs.get(threadId) ?? null
        const u = userCutoffs.get(threadId) ?? null
        if (!t && !u) return null
        if (!t) return u
        if (!u) return t
        return new Date(t) > new Date(u) ? t : u
      })()

      let query = supabase
        .from('direct_messages')
        .select('thread_id, content, created_at')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: false })
        .limit(1)

      if (clearedAt) {
        query = query.gt('created_at', clearedAt)
      }

      const { data, error } = await query.maybeSingle()

      if (error) {
        if (isMissingTableError(error)) return null
        throw error
      }
      return data
    }),
  )

  for (const row of rows) {
    if (!row) continue
    map.set(row.thread_id, {
      content: row.content,
      createdAt: row.created_at,
    })
  }

  return map
}

function isMissingTableError(error: {
  code?: string
  message?: string
  status?: number
  statusCode?: number
}) {
  const status = error.status ?? error.statusCode
  if (status === 404) return true
  return (
    error.code === 'PGRST205' ||
    error.code === '42P01' ||
    error.message?.includes('chat_threads') ||
    error.message?.includes('direct_messages') ||
    error.message?.includes('chat_thread_reads')
  )
}

function isMissingColumnError(error: { code?: string; message?: string }) {
  return error.code === '42703' || Boolean(error.message?.includes('does not exist'))
}

/** Skip repeated 404s when chat_thread_reads has not been migrated yet. */
let chatReadsTableAvailable: boolean | null = null

/** In-memory read cursor when DB table is missing or write is pending. */
const localReadAt = new Map<string, string>()

function readStateKey(userId: string, threadId: string) {
  return `${userId}:${threadId}`
}

const unreadRefreshCallbacks = new Set<() => void>()

export function subscribeToUnreadRefresh(callback: () => void) {
  unreadRefreshCallbacks.add(callback)
  return () => {
    unreadRefreshCallbacks.delete(callback)
  }
}

function notifyUnreadRefresh() {
  unreadRefreshCallbacks.forEach((cb) => cb())
}

function applyLocalReadState(userId: string, threadId: string, readMap: Map<string, string>) {
  const local = localReadAt.get(readStateKey(userId, threadId))
  if (!local) return
  const existing = readMap.get(threadId)
  if (!existing || new Date(local) > new Date(existing)) {
    readMap.set(threadId, local)
  }
}

function removeExistingChannel(channelName: string) {
  const topic = `realtime:${channelName}`
  const existing = supabase.getChannels().find((c) => c.topic === topic)
  if (existing) {
    void supabase.removeChannel(existing)
  }
}

async function fetchThreadsForUser(userId: string, useCache = true): Promise<ThreadRow[]> {
  if (
    useCache &&
    threadsCache?.userId === userId &&
    Date.now() - threadsCache.at < THREADS_CACHE_TTL_MS
  ) {
    return threadsCache.threads
  }

  const { data, error } = await supabase
    .from('chat_threads')
    .select('id, participant_a, participant_b, requested_by, status, updated_at')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)

  if (error) {
    if (isMissingTableError(error)) return []
    throw error
  }

  const threads = (data ?? []) as ThreadRow[]
  threadsCache = { userId, threads, at: Date.now() }
  return threads
}

export async function fetchMessagingUsers(
  currentUserId: string,
  role: 'student' | 'teacher',
): Promise<MessagingUser[]> {
  const profileQuery =
    role === 'teacher'
      ? supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role, teacher_profiles!inner(status)')
          .eq('role', 'teacher')
          .eq('teacher_profiles.status', 'verified')
          .neq('id', currentUserId)
          .order('full_name', { ascending: true })
      : supabase
          .from('profiles')
          .select('id, full_name, avatar_url, role')
          .eq('role', 'student')
          .neq('id', currentUserId)
          .order('full_name', { ascending: true })

  const [{ data: profiles, error }, threads, hiddenThreadIds] = await Promise.all([
    profileQuery,
    fetchThreadsForUser(currentUserId),
    fetchHiddenThreadIds(currentUserId).catch(() => new Set<string>()),
  ])

  if (error) throw error

  const filtered = profiles ?? []

  const threadByOther = new Map<string, ThreadRow>()

  for (const thread of threads) {
    const otherId =
      thread.participant_a === currentUserId ? thread.participant_b : thread.participant_a
    threadByOther.set(otherId, thread)
  }

  const acceptedThreadIds = threads.filter((t) => t.status === 'accepted').map((t) => t.id)
  const [lastMessages, unreadCounts] = await Promise.all([
    fetchLastMessagesByThread(threads.map((t) => t.id), currentUserId),
    fetchUnreadCountsByThread(currentUserId, acceptedThreadIds).catch(
      () => new Map<string, number>(),
    ),
  ])

  return filtered.map((row) => {
    const tp = 'teacher_profiles' in row ? row.teacher_profiles : null
    const teacherProfile = Array.isArray(tp) ? tp[0] : tp
    const thread = threadByOther.get(row.id)
    const isHidden = Boolean(thread && hiddenThreadIds.has(thread.id))
    const last = thread && !isHidden ? lastMessages.get(thread.id) : undefined

    return {
      id: row.id,
      name: row.full_name ?? 'User',
      avatar: row.avatar_url ?? '',
      role: row.role as 'student' | 'teacher',
      verified: teacherProfile?.status === 'verified',
      threadHidden: isHidden,
      threadId: thread?.id,
      threadStatus: thread?.status as ChatThreadStatus | undefined,
      requestedBy: thread?.requested_by,
      lastMessage: last?.content,
      lastMessageAt: isHidden ? undefined : last?.createdAt ?? thread?.updated_at,
      unreadCount: thread && !isHidden && thread.id ? unreadCounts.get(thread.id) ?? 0 : 0,
    }
  })
}

async function fetchUnreadCountsByThread(
  userId: string,
  threadIds: string[],
): Promise<Map<string, number>> {
  const counts = new Map<string, number>()
  if (threadIds.length === 0) return counts

  for (const id of threadIds) counts.set(id, 0)

  let readMap = new Map<string, string>()

  if (chatReadsTableAvailable !== false) {
    const { data: reads, error: readsError } = await supabase
      .from('chat_thread_reads')
      .select('thread_id, last_read_at')
      .eq('user_id', userId)
      .in('thread_id', threadIds)

    if (readsError) {
      if (isMissingTableError(readsError)) {
        chatReadsTableAvailable = false
      } else {
        throw readsError
      }
    } else {
      chatReadsTableAvailable = true
      readMap = new Map((reads ?? []).map((r) => [r.thread_id, r.last_read_at]))
    }
  }

  for (const threadId of threadIds) {
    applyLocalReadState(userId, threadId, readMap)
  }

  const [threadCutoffs, userCutoffs] = await Promise.all([
    fetchHistoryCutoffs(threadIds),
    fetchUserHistoryCutoffs(userId, threadIds),
  ])

  await Promise.all(
    threadIds.map(async (threadId) => {
      const lastRead = readMap.get(threadId)
      const t = threadCutoffs.get(threadId) ?? null
      const u = userCutoffs.get(threadId) ?? null
      const clearedAt =
        t && u ? (new Date(t) > new Date(u) ? t : u) : t ?? u
      let query = supabase
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', threadId)
        .neq('sender_id', userId)

      if (lastRead) {
        query = query.gt('created_at', lastRead)
      }
      if (clearedAt) {
        query = query.gt('created_at', clearedAt)
      }

      const { count, error: countError } = await query
      if (countError) {
        if (isMissingTableError(countError)) return
        throw countError
      }
      counts.set(threadId, count ?? 0)
    }),
  )

  return counts
}

export async function markThreadAsRead(
  threadId: string,
  userId: string,
  lastReadAt?: string,
) {
  const timestamp = lastReadAt ?? new Date().toISOString()
  localReadAt.set(readStateKey(userId, threadId), timestamp)
  notifyUnreadRefresh()

  const { error } = await supabase.from('chat_thread_reads').upsert(
    {
      thread_id: threadId,
      user_id: userId,
      last_read_at: timestamp,
    },
    { onConflict: 'thread_id,user_id' },
  )

  if (error) {
    if (isMissingTableError(error)) {
      chatReadsTableAvailable = false
      return
    }
    throw error
  }

  chatReadsTableAvailable = true
}

export async function fetchTotalUnreadCount(userId: string): Promise<number> {
  try {
    const threads = await fetchThreadsForUser(userId)
    const acceptedIds = threads.filter((t) => t.status === 'accepted').map((t) => t.id)
    const counts = await fetchUnreadCountsByThread(userId, acceptedIds)
    return Array.from(counts.values()).reduce((sum, n) => sum + n, 0)
  } catch {
    return 0
  }
}

export function subscribeToIncomingMessages(
  userId: string,
  onInsert: () => void,
  channelKey = 'default',
) {
  const channelName = `incoming_messages:${channelKey}:${userId}`
  removeExistingChannel(channelName)

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
      },
      (payload) => {
        const row = payload.new as { sender_id: string }
        if (row.sender_id !== userId) onInsert()
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function requiresChatRequest(
  currentRole: 'student' | 'teacher',
  otherRole: 'student' | 'teacher',
): boolean {
  return currentRole === 'student' && otherRole === 'student'
}

/** Read-only lookup — does not create threads or change status. */
export async function fetchDirectChatThread(
  userId: string,
  otherUserId: string,
): Promise<{ threadId: string; status: ChatThreadStatus; requestedBy: string } | null> {
  const { participant_a, participant_b } = orderParticipants(userId, otherUserId)

  const { data, error } = await supabase
    .from('chat_threads')
    .select('id, status, requested_by')
    .eq('participant_a', participant_a)
    .eq('participant_b', participant_b)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  return {
    threadId: data.id,
    status: data.status as ChatThreadStatus,
    requestedBy: data.requested_by,
  }
}

export async function ensureDirectChat(
  userId: string,
  otherUserId: string,
): Promise<{ threadId: string; status: ChatThreadStatus }> {
  const { participant_a, participant_b } = orderParticipants(userId, otherUserId)

  const { data: existing, error: fetchError } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('participant_a', participant_a)
    .eq('participant_b', participant_b)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing) {
    if (existing.status !== 'accepted') {
      const { data: updated, error: updateError } = await supabase
        .from('chat_threads')
        .update({
          status: 'accepted',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, status')
        .single()

      if (updateError) throw updateError
      return { threadId: updated.id, status: updated.status as ChatThreadStatus }
    }

    return {
      threadId: existing.id,
      status: existing.status as ChatThreadStatus,
    }
  }

  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      participant_a,
      participant_b,
      requested_by: userId,
      status: 'accepted',
    })
    .select('id, status')
    .single()

  if (error) throw error
  return { threadId: data.id, status: data.status as ChatThreadStatus }
}

export async function requestChat(
  fromUserId: string,
  toUserId: string,
): Promise<{ threadId: string; status: ChatThreadStatus }> {
  const { participant_a, participant_b } = orderParticipants(fromUserId, toUserId)

  const { data: existing, error: fetchError } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('participant_a', participant_a)
    .eq('participant_b', participant_b)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing) {
    if (existing.status === 'rejected') {
      const { data: updated, error: updateError } = await supabase
        .from('chat_threads')
        .update({
          status: 'pending',
          requested_by: fromUserId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, status')
        .single()

      if (updateError) throw updateError
      invalidateMessagingCache()
      return { threadId: updated.id, status: updated.status as ChatThreadStatus }
    }

    invalidateMessagingCache()
    return {
      threadId: existing.id,
      status: existing.status as ChatThreadStatus,
    }
  }

  const { data, error } = await supabase
    .from('chat_threads')
    .insert({
      participant_a,
      participant_b,
      requested_by: fromUserId,
      status: 'pending',
    })
    .select('id, status')
    .single()

  if (error) throw error
  invalidateMessagingCache()
  return { threadId: data.id, status: data.status as ChatThreadStatus }
}

export async function respondToChatRequest(
  threadId: string,
  userId: string,
  accept: boolean,
): Promise<ChatThreadStatus> {
  const status: ChatThreadStatus = accept ? 'accepted' : 'rejected'

  const { data, error } = await supabase
    .from('chat_threads')
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq('id', threadId)
    .neq('requested_by', userId)
    .select('status')
    .single()

  if (error) throw error
  invalidateMessagingCache()
  return data.status as ChatThreadStatus
}

export async function fetchDirectMessages(
  threadId: string,
  viewerId?: string,
): Promise<DirectChatMessage[]> {
  const [{ data, error }, clearedAt] = await Promise.all([
    supabase
      .from('direct_messages')
      .select('*')
      .eq('thread_id', threadId)
      .order('created_at', { ascending: true }),
    fetchThreadHistoryCutoff(threadId, viewerId),
  ])

  if (error) throw error

  const cutoff = clearedAt

  return (data ?? [])
    .map(mapDirectMessage)
    .filter((msg) => isVisibleAfterHistoryClear(msg.createdAt, cutoff))
    .filter((msg) => !viewerId || !msg.hiddenFor?.includes(viewerId))
}

export async function sendDirectMessage(
  threadId: string,
  senderId: string,
  content: string,
): Promise<DirectChatMessage | null> {
  const trimmed = content.trim()
  if (!trimmed) return null

  const { data, error } = await supabase
    .from('direct_messages')
    .insert({
      thread_id: threadId,
      sender_id: senderId,
      content: trimmed,
    })
    .select('*')
    .single()

  if (error) throw error

  await supabase
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId)

  return mapDirectMessage(data)
}

/** Hide thread from inbox. Archives visible history for this user (messages stay in DB). */
export async function hideChatFromInbox(threadId: string, userId: string) {
  const clearedAt = new Date().toISOString()

  await upsertThreadSettings(threadId, userId, {
    hidden: true,
    historyClearedAt: clearedAt,
  })

  invalidateMessagingCache()
}

/** Mark the newest message in a thread hidden for one participant (e.g. intro after delete). */
export async function hideLatestMessageForUser(threadId: string, userId: string) {
  const { data: latest, error } = await supabase
    .from('direct_messages')
    .select('id, hidden_for')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error || !latest) return

  const hiddenFor = [...new Set([...(latest.hidden_for ?? []), userId])]
  await supabase.from('direct_messages').update({ hidden_for: hiddenFor }).eq('id', latest.id)
}

export async function editDirectMessage(
  messageId: string,
  userId: string,
  content: string,
) {
  const trimmed = content.trim()
  if (!trimmed) throw new Error('Message cannot be empty.')

  const { error } = await supabase
    .from('direct_messages')
    .update({
      content: trimmed,
      edited_at: new Date().toISOString(),
      edited_by: userId,
    })
    .eq('id', messageId)
    .eq('sender_id', userId)

  if (error) throw error
}

export async function deleteDirectMessageForMe(messageId: string, userId: string) {
  const { data: row, error: fetchError } = await supabase
    .from('direct_messages')
    .select('hidden_for')
    .eq('id', messageId)
    .single()

  if (fetchError) throw fetchError

  const hidden = [...new Set([...(row.hidden_for ?? []), userId])]

  const { error } = await supabase
    .from('direct_messages')
    .update({ hidden_for: hidden })
    .eq('id', messageId)

  if (error) throw error
}

export async function deleteDirectMessageForBoth(messageId: string, userId: string) {
  const { error } = await supabase
    .from('direct_messages')
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: userId,
      delete_scope: 'both',
    })
    .eq('id', messageId)
    .eq('sender_id', userId)

  if (error) throw error
}

export async function snapshotThreadMessages(threadId: string) {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*, sender:profiles!sender_id(full_name, role)')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) throw error

  return (data ?? []).map((msg) => {
    const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
    return {
      id: msg.id,
      sender: sender?.full_name ?? 'Unknown',
      senderRole: sender?.role ?? 'user',
      text: msg.content ?? '',
      time: msg.created_at,
      editedAt: msg.edited_at,
      deletedAt: msg.deleted_at,
      deletedBy: msg.deleted_by,
      deleteScope: msg.delete_scope,
      hiddenFor: msg.hidden_for,
    }
  })
}

export function subscribeToDirectMessages(
  threadId: string,
  onInsert: (message: DirectChatMessage) => void,
) {
  const channelName = `direct_messages:${threadId}`
  removeExistingChannel(channelName)

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'direct_messages',
        filter: `thread_id=eq.${threadId}`,
      },
      (payload) => {
        onInsert(mapDirectMessage(payload.new as Parameters<typeof mapDirectMessage>[0]))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToThreadUpdates(userId: string, onUpdate: () => void) {
  const channelName = `chat_threads:${userId}`
  removeExistingChannel(channelName)

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_threads',
      },
      () => {
        onUpdate()
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToReadUpdates(userId: string, onUpdate: () => void) {
  const channelName = `chat_thread_reads:${userId}`
  removeExistingChannel(channelName)

  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'chat_thread_reads',
        filter: `user_id=eq.${userId}`,
      },
      () => {
        onUpdate()
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
