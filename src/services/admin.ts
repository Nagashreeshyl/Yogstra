import { supabase } from '../lib/supabase'
import type { ChatConversation, Payout } from '../types'
import { formatRelativeDate, formatTime } from '../utils/format'
import { mapPayout } from '../utils/mappers'

const payoutSelect = `
  *,
  teacher:profiles!teacher_id (*)
`

export async function fetchPayouts(): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select(payoutSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPayout(row))
}

export async function markPayoutPaid(id: string) {
  const { error } = await supabase.from('payouts').update({ status: 'paid' }).eq('id', id)
  if (error) throw error
}

export async function fetchTeacherPayouts(teacherId: string): Promise<Payout[]> {
  const { data, error } = await supabase
    .from('payouts')
    .select(payoutSelect)
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapPayout(row))
}

export async function fetchChatConversations(): Promise<ChatConversation[]> {
  const { data: threads, error: threadsError } = await supabase
    .from('chat_threads')
    .select('*')
    .eq('status', 'accepted')
    .order('updated_at', { ascending: false })

  if (threadsError) {
    if (threadsError.code === 'PGRST205' || threadsError.code === '42P01') return []
    throw threadsError
  }

  if (!threads?.length) return []

  const threadIds = threads.map((t) => t.id)
  const participantIds = [
    ...new Set(threads.flatMap((t) => [t.participant_a, t.participant_b])),
  ]

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, full_name, role')
    .in('id', participantIds)

  if (profilesError) throw profilesError

  const profileMap = new Map(
    (profiles ?? []).map((p) => [p.id, { name: p.full_name ?? 'User', role: p.role ?? 'user' }]),
  )

  const { data: messages, error: messagesError } = await supabase
    .from('direct_messages')
    .select('*, sender:profiles!sender_id(full_name)')
    .in('thread_id', threadIds)
    .order('created_at', { ascending: true })

  if (messagesError) {
    if (messagesError.code === 'PGRST205' || messagesError.code === '42P01') return []
    throw messagesError
  }

  const messagesByThread = new Map<string, typeof messages>()
  for (const msg of messages ?? []) {
    const list = messagesByThread.get(msg.thread_id) ?? []
    list.push(msg)
    messagesByThread.set(msg.thread_id, list)
  }

  return threads.map((thread) => {
    const one = profileMap.get(thread.participant_a)
    const two = profileMap.get(thread.participant_b)
    const threadMessages = messagesByThread.get(thread.id) ?? []
    const mappedMessages = threadMessages.map((msg) => {
      const sender = Array.isArray(msg.sender) ? msg.sender[0] : msg.sender
      return {
        sender: sender?.full_name ?? 'Unknown',
        text: msg.content ?? '',
        time: formatTime(msg.created_at),
      }
    })

    return {
      id: thread.id,
      participantOneName: one?.name ?? 'User',
      participantTwoName: two?.name ?? 'User',
      participantOneRole: one?.role ?? 'user',
      participantTwoRole: two?.role ?? 'user',
      lastMessage: mappedMessages.at(-1)?.text ?? '',
      messages: mappedMessages,
    }
  })
}

export function subscribeToAdminChats(onUpdate: () => void) {
  const channel = supabase
    .channel('admin_chats')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'direct_messages' },
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'chat_threads' },
      () => onUpdate(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export function subscribeToAdminDashboard(onUpdate: () => void) {
  const channel = supabase
    .channel('admin_dashboard')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'profiles' },
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'teacher_profiles' },
      () => onUpdate(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

export async function fetchRecentActivity(): Promise<{ id: string; text: string; time: string }[]> {
  const activities: { id: string; text: string; time: string; ts: number }[] = []

  const { data: newTeachers } = await supabase
    .from('profiles')
    .select('full_name, created_at, teacher_profiles(status)')
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })
    .limit(3)

  for (const t of newTeachers ?? []) {
    activities.push({
      id: `t-${t.full_name}`,
      text: `New teacher registration: ${t.full_name}`,
      time: formatRelativeDate(t.created_at),
      ts: new Date(t.created_at).getTime(),
    })
  }

  const { data: newBookings } = await supabase
    .from('bookings')
    .select('created_at, student:profiles!student_id(full_name), teacher:profiles!teacher_id(full_name)')
    .order('created_at', { ascending: false })
    .limit(3)

  for (const b of newBookings ?? []) {
    const student = Array.isArray(b.student) ? b.student[0] : b.student
    const teacher = Array.isArray(b.teacher) ? b.teacher[0] : b.teacher
    activities.push({
      id: `b-${b.created_at}`,
      text: `Booking confirmed: ${student?.full_name} → ${teacher?.full_name}`,
      time: formatRelativeDate(b.created_at),
      ts: new Date(b.created_at).getTime(),
    })
  }

  return activities
    .sort((a, b) => b.ts - a.ts)
    .slice(0, 5)
    .map(({ id, text, time }) => ({ id, text, time }))
}
