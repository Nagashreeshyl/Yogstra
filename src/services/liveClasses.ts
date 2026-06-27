import { supabase } from '../lib/supabase'
import type { Student } from '../types'
import { mapStudent } from '../utils/mappers'
import { isClassOrderActive } from './classOrders'

export type PaidCoachingStudent = Student & {
  nextSessionAt: string | null
  scheduleId: string | null
  isScheduledNow: boolean
}

export type StudentCoachingTeacher = {
  id: string
  name: string
  photo: string
  nextSessionAt: string | null
}

const SCHEDULE_EARLY_MINUTES = 15
const DEFAULT_SESSION_MINUTES = 60

function isScheduleActiveNow(scheduledAt: string, durationMinutes = DEFAULT_SESSION_MINUTES) {
  const start = new Date(scheduledAt)
  const windowStart = new Date(start.getTime() - SCHEDULE_EARLY_MINUTES * 60_000)
  const windowEnd = new Date(start.getTime() + durationMinutes * 60_000)
  const now = new Date()
  return now >= windowStart && now <= windowEnd
}

export async function fetchTeacherPaidStudents(teacherId: string): Promise<PaidCoachingStudent[]> {
  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select('student_id, student:profiles!student_id(*)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .eq('payment_status', 'paid')

  if (bookingError) throw bookingError

  const studentIds = (bookings ?? []).map((b) => b.student_id as string)
  if (studentIds.length === 0) return []

  const { data: schedules, error: scheduleError } = await supabase
    .from('schedules')
    .select('id, student_id, scheduled_at, duration_minutes')
    .eq('teacher_id', teacherId)
    .in('student_id', studentIds)
    .gte('scheduled_at', new Date(Date.now() - 24 * 60 * 60_000).toISOString())
    .order('scheduled_at', { ascending: true })

  if (scheduleError) throw scheduleError

  const nextByStudent = new Map<string, { at: string; scheduleId: string; isNow: boolean }>()
  for (const row of schedules ?? []) {
    const sid = row.student_id as string
    const scheduledAt = row.scheduled_at as string
    const scheduleId = row.id as string
    const duration = Number(row.duration_minutes ?? DEFAULT_SESSION_MINUTES)
    const isNow = isScheduleActiveNow(scheduledAt, duration)
    const existing = nextByStudent.get(sid)
    if (!existing || isNow || new Date(scheduledAt) < new Date(existing.at)) {
      nextByStudent.set(sid, {
        at: scheduledAt,
        scheduleId,
        isNow: isNow || existing?.isNow === true,
      })
    }
  }

  return (bookings ?? []).map((b) => {
    const student = Array.isArray(b.student) ? b.student[0] : b.student
    const schedule = nextByStudent.get(b.student_id as string)
    const base = mapStudent(student, '', 0)
    return {
      ...base,
      nextSessionAt: schedule?.at ?? null,
      scheduleId: schedule?.scheduleId ?? null,
      isScheduledNow: schedule?.isNow ?? false,
    }
  })
}

export async function fetchScheduledStudentNow(
  teacherId: string,
): Promise<PaidCoachingStudent | null> {
  const students = await fetchTeacherPaidStudents(teacherId)
  return students.find((s) => s.isScheduledNow) ?? null
}

export async function studentHasPaidCoaching(studentId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .eq('status', 'active')
    .eq('payment_status', 'paid')

  if (error) throw error
  if ((count ?? 0) > 0) return true

  const { data: orders, error: orderError } = await supabase
    .from('class_orders')
    .select('scheduled_at, duration, payment_status')
    .eq('student_id', studentId)
    .eq('payment_status', 'paid')
    .limit(5)

  if (orderError) {
    if (orderError.code === 'PGRST205' || orderError.code === '42P01') return false
    throw orderError
  }

  return (orders ?? []).some((o) =>
    isClassOrderActive({
      scheduled_at: o.scheduled_at as string,
      duration: o.duration as 'week' | 'month' | null,
      payment_status: o.payment_status as string,
    }),
  )
}

export async function fetchStudentCoachingTeachers(
  studentId: string,
): Promise<StudentCoachingTeacher[]> {
  const { data: bookings, error } = await supabase
    .from('bookings')
    .select('teacher_id, teacher:profiles!teacher_id(id, full_name, avatar_url)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .eq('payment_status', 'paid')

  if (error) throw error

  const teacherIds = (bookings ?? []).map((b) => b.teacher_id as string)
  if (teacherIds.length === 0) return []

  const { data: schedules } = await supabase
    .from('schedules')
    .select('teacher_id, scheduled_at')
    .eq('student_id', studentId)
    .in('teacher_id', teacherIds)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })

  const nextByTeacher = new Map<string, string>()
  for (const row of schedules ?? []) {
    const tid = row.teacher_id as string
    if (!nextByTeacher.has(tid)) {
      nextByTeacher.set(tid, row.scheduled_at as string)
    }
  }

  return (bookings ?? []).map((b) => {
    const teacher = Array.isArray(b.teacher) ? b.teacher[0] : b.teacher
    return {
      id: teacher.id as string,
      name: teacher.full_name ?? 'Teacher',
      photo: teacher.avatar_url ?? '',
      nextSessionAt: nextByTeacher.get(b.teacher_id as string) ?? null,
    }
  })
}
