import { supabase } from '../lib/supabase'
import type { ClassOrderInput } from './classOrders'
import { buildYogstraBookingMessage } from './classOrders'

export type TeacherNotification = {
  id: string
  teacherId: string
  studentId: string | null
  orderId: string | null
  requestId: string | null
  type: string
  title: string
  body: string
  readAt: string | null
  createdAt: string
  studentName?: string
}

function mapRow(row: Record<string, unknown>): TeacherNotification {
  const student = row.student as { full_name?: string } | null
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    studentId: (row.student_id as string) ?? null,
    orderId: (row.order_id as string) ?? null,
    requestId: (row.request_id as string) ?? null,
    type: row.type as string,
    title: row.title as string,
    body: row.body as string,
    readAt: (row.read_at as string) ?? null,
    createdAt: row.created_at as string,
    studentName: student?.full_name ?? undefined,
  }
}

export async function fetchTeacherNotifications(
  teacherId: string,
): Promise<TeacherNotification[]> {
  const { data, error } = await supabase
    .from('teacher_notifications')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })
    .limit(50)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    console.error('fetchTeacherNotifications', error)
    return []
  }

  return (data ?? []).map((row) => mapRow(row as Record<string, unknown>))
}

export async function fetchUnreadNotificationCount(teacherId: string): Promise<number> {
  const { count, error } = await supabase
    .from('teacher_notifications')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .is('read_at', null)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return 0
    throw error
  }

  return count ?? 0
}

export async function markNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('teacher_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) throw error
}

export async function markAllNotificationsRead(teacherId: string) {
  const { error } = await supabase
    .from('teacher_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('teacher_id', teacherId)
    .is('read_at', null)

  if (error) throw error
}

export async function createTeacherBookingNotification(
  orderId: string,
  input: ClassOrderInput,
  paymentId: string,
) {
  const chatBody = buildYogstraBookingMessage(input, paymentId)

  const { error } = await supabase.from('teacher_notifications').insert({
    teacher_id: input.teacherId,
    student_id: input.studentId,
    order_id: orderId,
    type: 'class_booking',
    title: 'New class booking',
    body: chatBody,
  })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error('Notifications are not set up. Run supabase/teacher-notifications.sql.')
    }
    throw error
  }
}

type Listener = () => void

const notificationChannelByTeacher = new Map<
  string,
  { channel: ReturnType<typeof supabase.channel>; listeners: Set<Listener> }
>()

export function subscribeToTeacherNotifications(
  teacherId: string,
  onChange: () => void,
) {
  let entry = notificationChannelByTeacher.get(teacherId)
  if (!entry) {
    const listeners = new Set<Listener>()
    const channel = supabase
      .channel(`teacher_notifications:${teacherId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teacher_notifications',
          filter: `teacher_id=eq.${teacherId}`,
        },
        () => {
          listeners.forEach((listener) => listener())
        },
      )
      .subscribe()

    entry = { channel, listeners }
    notificationChannelByTeacher.set(teacherId, entry)
  }

  entry.listeners.add(onChange)

  return () => {
    const current = notificationChannelByTeacher.get(teacherId)
    if (!current) return
    current.listeners.delete(onChange)
    if (current.listeners.size === 0) {
      void supabase.removeChannel(current.channel)
      notificationChannelByTeacher.delete(teacherId)
    }
  }
}
