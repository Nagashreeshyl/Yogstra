import { supabase } from '../lib/supabase'
import { fetchLiveKitToken } from './classSessions'
import { requiresChatRequest } from './directChat'

export type DirectVideoCallStatus = 'ringing' | 'active' | 'ended' | 'declined' | 'missed'

export type DirectVideoCall = {
  id: string
  threadId: string
  callerId: string
  calleeId: string
  roomName: string
  status: DirectVideoCallStatus
  startedAt: string | null
  endedAt: string | null
  createdAt: string
  callerName?: string
  callerAvatar?: string
  calleeName?: string
  calleeAvatar?: string
}

const callSelect = `
  *,
  caller:profiles!caller_id(full_name, avatar_url),
  callee:profiles!callee_id(full_name, avatar_url)
`

function mapCall(row: Record<string, unknown>): DirectVideoCall {
  const caller = row.caller as { full_name?: string; avatar_url?: string } | null
  const callee = row.callee as { full_name?: string; avatar_url?: string } | null
  return {
    id: row.id as string,
    threadId: row.thread_id as string,
    callerId: row.caller_id as string,
    calleeId: row.callee_id as string,
    roomName: row.room_name as string,
    status: row.status as DirectVideoCallStatus,
    startedAt: (row.started_at as string) ?? null,
    endedAt: (row.ended_at as string) ?? null,
    createdAt: row.created_at as string,
    callerName: caller?.full_name,
    callerAvatar: caller?.avatar_url,
    calleeName: callee?.full_name,
    calleeAvatar: callee?.avatar_url,
  }
}

export function canDirectVideoCall(params: {
  currentUserRole: 'student' | 'teacher'
  participantRole: 'student' | 'teacher'
  threadStatus?: string | null
  blocked?: boolean
}): boolean {
  if (params.blocked) return false
  if (requiresChatRequest(params.currentUserRole, params.participantRole)) {
    return params.threadStatus === 'accepted'
  }
  return params.threadStatus === 'accepted' || params.threadStatus == null
}

export { fetchLiveKitToken }

export async function createDirectVideoCall(params: {
  threadId: string
  callerId: string
  calleeId: string
}): Promise<DirectVideoCall> {
  const roomName = `yogstra-dm-${crypto.randomUUID()}`

  const { data, error } = await supabase
    .from('direct_video_calls')
    .insert({
      thread_id: params.threadId,
      caller_id: params.callerId,
      callee_id: params.calleeId,
      room_name: roomName,
      status: 'ringing',
    })
    .select(callSelect)
    .single()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error('Video calls are not set up. Run supabase/direct-video-calls.sql.')
    }
    throw error
  }

  return mapCall(data as Record<string, unknown>)
}

export async function fetchDirectVideoCall(callId: string): Promise<DirectVideoCall | null> {
  const { data, error } = await supabase
    .from('direct_video_calls')
    .select(callSelect)
    .eq('id', callId)
    .maybeSingle()

  if (error) throw error
  return data ? mapCall(data as Record<string, unknown>) : null
}

export async function updateDirectVideoCallStatus(
  callId: string,
  status: DirectVideoCallStatus,
  extra?: { startedAt?: string; endedAt?: string },
) {
  const patch: Record<string, unknown> = { status }
  if (extra?.startedAt) patch.started_at = extra.startedAt
  if (extra?.endedAt) patch.ended_at = extra.endedAt

  const { error } = await supabase.from('direct_video_calls').update(patch).eq('id', callId)
  if (error) throw error
}

export async function fetchIncomingRingingCall(userId: string): Promise<DirectVideoCall | null> {
  const { data, error } = await supabase
    .from('direct_video_calls')
    .select(callSelect)
    .eq('callee_id', userId)
    .eq('status', 'ringing')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return null
    throw error
  }

  return data ? mapCall(data as Record<string, unknown>) : null
}

export async function fetchUserActiveDirectCall(userId: string): Promise<DirectVideoCall | null> {
  const { data, error } = await supabase
    .from('direct_video_calls')
    .select(callSelect)
    .or(`caller_id.eq.${userId},callee_id.eq.${userId}`)
    .in('status', ['ringing', 'active'])
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return null
    throw error
  }

  return data ? mapCall(data as Record<string, unknown>) : null
}

type Listener = () => void

const userCallChannels = new Map<
  string,
  { channel: ReturnType<typeof supabase.channel>; listeners: Set<Listener> }
>()

export function subscribeToDirectVideoCalls(userId: string, onChange: () => void) {
  let entry = userCallChannels.get(userId)
  if (!entry) {
    const listeners = new Set<Listener>()
    const channel = supabase
      .channel(`direct_video_calls:${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_video_calls',
          filter: `caller_id=eq.${userId}`,
        },
        () => listeners.forEach((l) => l()),
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'direct_video_calls',
          filter: `callee_id=eq.${userId}`,
        },
        () => listeners.forEach((l) => l()),
      )
      .subscribe()

    entry = { channel, listeners }
    userCallChannels.set(userId, entry)
  }

  entry.listeners.add(onChange)
  return () => {
    entry!.listeners.delete(onChange)
    if (entry!.listeners.size === 0) {
      void supabase.removeChannel(entry!.channel)
      userCallChannels.delete(userId)
    }
  }
}

type CallListener = (call: DirectVideoCall) => void

const callByIdChannels = new Map<
  string,
  { channel: ReturnType<typeof supabase.channel>; listeners: Set<CallListener> }
>()

export function subscribeToDirectVideoCallById(callId: string, onChange: CallListener) {
  let entry = callByIdChannels.get(callId)
  if (!entry) {
    const listeners = new Set<CallListener>()
    const channel = supabase
      .channel(`direct_video_call:${callId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'direct_video_calls',
          filter: `id=eq.${callId}`,
        },
        (payload) => {
          const call = mapCall(payload.new as Record<string, unknown>)
          listeners.forEach((l) => l(call))
        },
      )
      .subscribe()

    entry = { channel, listeners }
    callByIdChannels.set(callId, entry)
  }

  entry.listeners.add(onChange)
  return () => {
    entry!.listeners.delete(onChange)
    if (entry!.listeners.size === 0) {
      void supabase.removeChannel(entry!.channel)
      callByIdChannels.delete(callId)
    }
  }
}
