import { supabase } from '../lib/supabase'
import type { ChatMessage, MessageConversation } from '../types'

function mapMessage(row: {
  id: string
  booking_id: string
  sender_id: string
  content: string | null
  created_at: string
}): ChatMessage {
  return {
    id: row.id,
    bookingId: row.booking_id,
    senderId: row.sender_id,
    content: row.content ?? '',
    createdAt: row.created_at,
  }
}

export async function fetchMessages(bookingId: string): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('booking_id', bookingId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map(mapMessage)
}

export async function sendMessage(bookingId: string, senderId: string, content: string) {
  const trimmed = content.trim()
  if (!trimmed) return

  const { error } = await supabase.from('messages').insert({
    booking_id: bookingId,
    sender_id: senderId,
    content: trimmed,
  })

  if (error) throw error
}

export function subscribeToMessages(
  bookingId: string,
  onInsert: (message: ChatMessage) => void,
) {
  const channel = supabase
    .channel(`messages:${bookingId}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `booking_id=eq.${bookingId}`,
      },
      (payload) => {
        onInsert(mapMessage(payload.new as Parameters<typeof mapMessage>[0]))
      },
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}

async function fetchLastMessagesByBooking(
  bookingIds: string[],
): Promise<Map<string, { content: string; createdAt: string }>> {
  const map = new Map<string, { content: string; createdAt: string }>()
  if (bookingIds.length === 0) return map

  const { data, error } = await supabase
    .from('messages')
    .select('booking_id, content, created_at')
    .in('booking_id', bookingIds)
    .order('created_at', { ascending: false })

  if (error) throw error

  for (const row of data ?? []) {
    if (!map.has(row.booking_id)) {
      map.set(row.booking_id, {
        content: row.content ?? '',
        createdAt: row.created_at,
      })
    }
  }

  return map
}

const bookingSelect = `
  *,
  student:profiles!student_id (*),
  teacher:profiles!teacher_id (*, teacher_profiles(status))
`

export async function fetchStudentConversation(
  studentId: string,
): Promise<MessageConversation | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const teacher = Array.isArray(data.teacher) ? data.teacher[0] : data.teacher
  const tp = teacher?.teacher_profiles
  const teacherProfile = Array.isArray(tp) ? tp[0] : tp

  const lastMessages = await fetchLastMessagesByBooking([data.id])
  const last = lastMessages.get(data.id)

  return {
    bookingId: data.id,
    participantId: data.teacher_id,
    participantName: teacher?.full_name ?? 'Teacher',
    participantVerified: teacherProfile?.status === 'verified',
    lastMessage: last?.content,
    lastMessageAt: last?.createdAt,
  }
}

export async function fetchTeacherConversations(
  teacherId: string,
): Promise<MessageConversation[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error

  const bookings = data ?? []
  const lastMessages = await fetchLastMessagesByBooking(bookings.map((b) => b.id))

  return bookings.map((booking) => {
    const student = Array.isArray(booking.student) ? booking.student[0] : booking.student
    const last = lastMessages.get(booking.id)

    return {
      bookingId: booking.id,
      participantId: booking.student_id,
      participantName: student?.full_name ?? 'Student',
      lastMessage: last?.content,
      lastMessageAt: last?.createdAt,
    }
  })
}
