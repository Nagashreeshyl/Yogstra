import { supabase } from '../lib/supabase'
import { snapshotThreadMessages } from './directChat'
import type { AdminChatMessage, ReportedChatConversation } from '../types'
import { formatRelativeDate, formatTime } from '../utils/format'

export async function submitChatReport(params: {
  threadId: string
  reporterId: string
  reportedUserId: string
  reason: string
}) {
  const trimmed = params.reason.trim()
  if (!trimmed) throw new Error('Please enter a reason for your report.')

  let messagesSnapshot: AdminChatMessage[] = []
  try {
    messagesSnapshot = await snapshotThreadMessages(params.threadId)
  } catch {
    messagesSnapshot = []
  }

  const { error } = await supabase.from('chat_reports').insert({
    thread_id: params.threadId,
    reporter_id: params.reporterId,
    reported_user_id: params.reportedUserId,
    reason: trimmed,
    status: 'open',
    messages_snapshot: messagesSnapshot,
  })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error(
        'Reporting is not set up yet. Ask your admin to run supabase/chat-reports.sql in Supabase.',
      )
    }
    throw error
  }
}

function mapSnapshotMessage(msg: AdminChatMessage) {
  const timeStr =
    typeof msg.time === 'string' && msg.time.includes('T')
      ? formatTime(msg.time)
      : msg.time

  if (msg.deleteScope === 'both') {
    return {
      ...msg,
      text: msg.text || '[Message was deleted — preserved in report snapshot]',
      time: timeStr,
    }
  }
  return { ...msg, time: timeStr }
}

async function mapReportToConversation(
  report: Record<string, unknown>,
): Promise<ReportedChatConversation | null> {
  const threadId = report.thread_id as string
  const { data: thread } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('id', threadId)
    .maybeSingle()

  if (!thread) return null

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', [thread.participant_a, thread.participant_b])

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { name: p.full_name ?? 'User', role: p.role ?? 'user' }]),
  )

  const one = profileMap.get(thread.participant_a)
  const two = profileMap.get(thread.participant_b)
  const reporter = report.reporter
  const reporterObj = Array.isArray(reporter) ? reporter[0] : reporter

  const snapshot = (report.messages_snapshot as AdminChatMessage[] | null) ?? []
  const mappedMessages = snapshot.map(mapSnapshotMessage)

  return {
    id: threadId,
    reportId: report.id as string,
    participantOneName: one?.name ?? 'User',
    participantTwoName: two?.name ?? 'User',
    participantOneRole: one?.role ?? 'user',
    participantTwoRole: two?.role ?? 'user',
    lastMessage: mappedMessages.at(-1)?.text ?? '',
    messages: mappedMessages,
    messagesSnapshot: snapshot,
    reportReason: (report.reason as string) ?? '',
    reportedAt: (report.created_at as string) ?? '',
    reporterName: (reporterObj as { full_name?: string })?.full_name ?? 'User',
    reportCount: 1,
    reportStatus: (report.status as 'open' | 'reviewed') ?? 'open',
    reviewedAt: (report.reviewed_at as string) ?? null,
  }
}

export async function fetchReportedChatConversations(): Promise<ReportedChatConversation[]> {
  const { data: reports, error } = await supabase
    .from('chat_reports')
    .select('*, reporter:profiles!reporter_id(full_name, role)')
    .eq('status', 'open')
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  const convos = await Promise.all((reports ?? []).map(mapReportToConversation))
  return convos.filter((c): c is ReportedChatConversation => c !== null)
}

export async function fetchReportHistory(): Promise<ReportedChatConversation[]> {
  const { data: reports, error } = await supabase
    .from('chat_reports')
    .select('*, reporter:profiles!reporter_id(full_name, role)')
    .eq('status', 'reviewed')
    .order('reviewed_at', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  const convos = await Promise.all((reports ?? []).map(mapReportToConversation))
  return convos.filter((c): c is ReportedChatConversation => c !== null)
}

export function subscribeToChatReports(onUpdate: () => void) {
  const channel = supabase
    .channel('admin_chat_reports')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_reports' },
      () => onUpdate(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function markChatReportReviewed(reportId: string, adminId: string) {
  const { error } = await supabase
    .from('chat_reports')
    .update({
      status: 'reviewed',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
    })
    .eq('id', reportId)

  if (error) throw error
}

export function formatReportDate(iso: string) {
  if (!iso) return ''
  return formatRelativeDate(iso)
}
