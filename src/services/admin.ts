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
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!sender_id (*),
      booking:bookings (
        *,
        student:profiles!student_id (*),
        teacher:profiles!teacher_id (*)
      )
    `)
    .order('created_at', { ascending: true })

  if (error) throw error

  const convMap = new Map<string, ChatConversation>()

  for (const msg of data ?? []) {
    const bookingId = msg.booking_id ?? msg.id
    const booking = Array.isArray(msg.booking) ? msg.booking[0] : msg.booking
    const teacher = booking?.teacher
    const student = booking?.student
    const teacherName = teacher?.full_name ?? 'Teacher'
    const studentName = student?.full_name ?? 'Student'

    if (!convMap.has(bookingId)) {
      convMap.set(bookingId, {
        id: bookingId,
        teacherName,
        studentName,
        lastMessage: msg.content ?? '',
        messages: [],
      })
    }

    const conv = convMap.get(bookingId)!
    conv.messages.push({
      sender: msg.sender?.full_name ?? 'Unknown',
      text: msg.content ?? '',
      time: formatTime(msg.created_at),
    })
    conv.lastMessage = msg.content ?? ''
  }

  return Array.from(convMap.values())
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
