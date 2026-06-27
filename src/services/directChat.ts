import { supabase } from '../lib/supabase'
import type { ChatThreadStatus, DirectChatMessage, MessagingUser } from '../types'

function orderParticipants(userId: string, otherId: string) {
  return userId < otherId
    ? { participant_a: userId, participant_b: otherId }
    : { participant_a: otherId, participant_b: userId }
}

function mapDirectMessage(row: {
  id: string
  thread_id: string
  sender_id: string
  content: string
  created_at: string
}): DirectChatMessage {
  return {
    id: row.id,
    threadId: row.thread_id,
    senderId: row.sender_id,
    content: row.content,
    createdAt: row.created_at,
  }
}

type ThreadRow = {
  id: string
  participant_a: string
  participant_b: string
  requested_by: string
  status: ChatThreadStatus
  updated_at: string
}

async function fetchLastMessagesByThread(
  threadIds: string[],
): Promise<Map<string, { content: string; createdAt: string }>> {
  const map = new Map<string, { content: string; createdAt: string }>()
  if (threadIds.length === 0) return map

  const { data, error } = await supabase
    .from('direct_messages')
    .select('thread_id, content, created_at')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: false })

  if (error) {
    if (isMissingTableError(error)) return map
    throw error
  }

  for (const row of data ?? []) {
    if (!map.has(row.thread_id)) {
      map.set(row.thread_id, {
        content: row.content,
        createdAt: row.created_at,
      })
    }
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

async function fetchThreadsForUser(userId: string): Promise<ThreadRow[]> {
  const { data, error } = await supabase
    .from('chat_threads')
    .select('*')
    .or(`participant_a.eq.${userId},participant_b.eq.${userId}`)

  if (error) {
    if (isMissingTableError(error)) return []
    throw error
  }
  return (data ?? []) as ThreadRow[]
}

export async function fetchMessagingUsers(
  currentUserId: string,
  role: 'student' | 'teacher',
): Promise<MessagingUser[]> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, full_name, avatar_url, role, teacher_profiles(status)')
    .eq('role', role)
    .neq('id', currentUserId)
    .order('full_name', { ascending: true })

  if (error) throw error

  const filtered =
    role === 'teacher'
      ? (profiles ?? []).filter((row) => {
          const tp = row.teacher_profiles
          const teacherProfile = Array.isArray(tp) ? tp[0] : tp
          return teacherProfile?.status === 'verified'
        })
      : profiles ?? []

  const threads = await fetchThreadsForUser(currentUserId)
  const threadByOther = new Map<string, ThreadRow>()

  for (const thread of threads) {
    const otherId =
      thread.participant_a === currentUserId ? thread.participant_b : thread.participant_a
    threadByOther.set(otherId, thread)
  }

  const lastMessages = await fetchLastMessagesByThread(threads.map((t) => t.id))
  let unreadCounts = new Map<string, number>()
  try {
    const acceptedThreadIds = threads.filter((t) => t.status === 'accepted').map((t) => t.id)
    unreadCounts = await fetchUnreadCountsByThread(currentUserId, acceptedThreadIds)
  } catch {
    unreadCounts = new Map()
  }

  return filtered.map((row) => {
    const tp = row.teacher_profiles
    const teacherProfile = Array.isArray(tp) ? tp[0] : tp
    const thread = threadByOther.get(row.id)
    const last = thread ? lastMessages.get(thread.id) : undefined

    return {
      id: row.id,
      name: row.full_name ?? 'User',
      avatar: row.avatar_url ?? '',
      role: row.role as 'student' | 'teacher',
      verified: teacherProfile?.status === 'verified',
      threadId: thread?.id,
      threadStatus: thread?.status,
      requestedBy: thread?.requested_by,
      lastMessage: last?.content,
      lastMessageAt: last?.createdAt ?? thread?.updated_at,
      unreadCount: thread?.id ? unreadCounts.get(thread.id) ?? 0 : 0,
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

  const { data: messages, error: messagesError } = await supabase
    .from('direct_messages')
    .select('thread_id, sender_id, created_at')
    .in('thread_id', threadIds)
    .neq('sender_id', userId)

  if (messagesError) {
    if (isMissingTableError(messagesError)) return counts
    throw messagesError
  }

  for (const msg of messages ?? []) {
    const lastRead = readMap.get(msg.thread_id)
    if (!lastRead || new Date(msg.created_at) > new Date(lastRead)) {
      counts.set(msg.thread_id, (counts.get(msg.thread_id) ?? 0) + 1)
    }
  }

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
      requested_by: fromUserId,
      status: 'pending',
    })
    .select('id, status')
    .single()

  if (error) throw error
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
  return data.status as ChatThreadStatus
}

export async function fetchDirectMessages(threadId: string): Promise<DirectChatMessage[]> {
  const { data, error } = await supabase
    .from('direct_messages')
    .select('*')
    .eq('thread_id', threadId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapDirectMessage)
}

export async function sendDirectMessage(
  threadId: string,
  senderId: string,
  content: string,
) {
  const trimmed = content.trim()
  if (!trimmed) return

  const { error } = await supabase.from('direct_messages').insert({
    thread_id: threadId,
    sender_id: senderId,
    content: trimmed,
  })

  if (error) throw error

  await supabase
    .from('chat_threads')
    .update({ updated_at: new Date().toISOString() })
    .eq('id', threadId)
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
