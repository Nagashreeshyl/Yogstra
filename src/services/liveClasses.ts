import { supabase } from '../lib/supabase'
import type { Student } from '../types'
import { mapStudent } from '../utils/mappers'
import { isClassOrderActive, type ClassDuration } from './classOrders'

export type PaidCoachingStudent = Student & {
  nextSessionAt: string | null
  scheduleId: string | null
  isScheduledNow: boolean
}

export type StudentCoachingTeacher = {
  id: string
  name: string
  photo: string
  /** Session happening in the current time window */
  currentSessionAt: string | null
  isScheduledNow: boolean
  /** Next upcoming session after the current window */
  nextSessionAt: string | null
}

const SCHEDULE_EARLY_MINUTES = 15
export const CLASS_SESSION_DURATION_MINUTES = 60
const DEFAULT_SESSION_MINUTES = CLASS_SESSION_DURATION_MINUTES

/** Student may join/wait from 15 min before scheduled start. */
function isScheduleActiveNow(scheduledAt: string, durationMinutes = DEFAULT_SESSION_MINUTES) {
  const start = new Date(scheduledAt)
  const windowStart = new Date(start.getTime() - SCHEDULE_EARLY_MINUTES * 60_000)
  const windowEnd = new Date(start.getTime() + durationMinutes * 60_000)
  const now = new Date()
  return now >= windowStart && now <= windowEnd
}

/** Teacher class hour: exact scheduled start through +1 hour (no early conduct). */
export function isTeacherClassHour(scheduledAt: string, durationMinutes = DEFAULT_SESSION_MINUTES) {
  const start = new Date(scheduledAt).getTime()
  const end = start + durationMinutes * 60_000
  const now = Date.now()
  return now >= start && now <= end
}

export function isClassStartTimeReached(scheduledAt: string) {
  return Date.now() >= new Date(scheduledAt).getTime()
}

/** Teacher start alert: only the first ~90s after scheduled start (matches 10s poll). */
export const CLASS_START_ALERT_WINDOW_MS = 90_000

export function isWithinClassStartAlertWindow(
  scheduledAt: string,
  windowMs = CLASS_START_ALERT_WINDOW_MS,
) {
  const startMs = new Date(scheduledAt).getTime()
  if (Number.isNaN(startMs)) return false
  const now = Date.now()
  return now >= startMs && now < startMs + windowMs
}

export type TeacherNextSessionInfo = PaidCoachingStudent & {
  sessionPhase: 'upcoming' | 'active' | 'past'
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
    .gte(
      'scheduled_at',
      new Date(Date.now() - CLASS_SESSION_DURATION_MINUTES * 60_000).toISOString(),
    )
    .order('scheduled_at', { ascending: true })

  if (scheduleError) throw scheduleError

  const schedulesByStudent = new Map<string, Array<{ at: string; scheduleId: string; duration: number }>>()
  for (const row of schedules ?? []) {
    const sid = row.student_id as string
    const list = schedulesByStudent.get(sid) ?? []
    list.push({
      at: row.scheduled_at as string,
      scheduleId: row.id as string,
      duration: Number(row.duration_minutes ?? DEFAULT_SESSION_MINUTES),
    })
    schedulesByStudent.set(sid, list)
  }

  const nextByStudent = new Map<string, { at: string; scheduleId: string; isNow: boolean }>()
  for (const [sid, rows] of schedulesByStudent) {
    const inHour = rows.find((r) => isTeacherClassHour(r.at, r.duration))
    const upcoming = rows.find((r) => new Date(r.at) > new Date())
    const chosen = inHour ?? upcoming ?? rows[0]
    if (!chosen) continue
    nextByStudent.set(sid, {
      at: chosen.at,
      scheduleId: chosen.scheduleId,
      isNow: isTeacherClassHour(chosen.at, chosen.duration),
    })
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

export async function fetchTeacherNextSession(
  teacherId: string,
): Promise<TeacherNextSessionInfo | null> {
  const students = await fetchTeacherPaidStudents(teacherId)
  const withSessions = students
    .filter((s) => s.nextSessionAt && s.scheduleId)
    .map((s) => {
      const at = s.nextSessionAt!
      let sessionPhase: TeacherNextSessionInfo['sessionPhase'] = 'upcoming'
      if (isClassStartTimeReached(at)) {
        sessionPhase = isTeacherClassHour(at) ? 'active' : 'past'
      }
      return { ...s, sessionPhase }
    })
    .filter((s) => s.sessionPhase !== 'past')
    .sort((a, b) => new Date(a.nextSessionAt!).getTime() - new Date(b.nextSessionAt!).getTime())

  return withSessions[0] ?? null
}

export async function fetchTeacherDueSession(
  teacherId: string,
): Promise<TeacherNextSessionInfo | null> {
  const next = await fetchTeacherNextSession(teacherId)
  if (!next || next.sessionPhase !== 'active') return null
  if (!isWithinClassStartAlertWindow(next.nextSessionAt!)) return null
  return next
}

export async function studentHasPaidCoaching(studentId: string): Promise<boolean> {
  const teachers = await fetchStudentCoachingTeachers(studentId)
  return teachers.length > 0
}

async function collectStudentCoachIds(studentId: string): Promise<{
  teacherIds: string[]
  teacherMeta: Map<string, { name: string; photo: string }>
}> {
  const teacherIds = new Set<string>()
  const teacherMeta = new Map<string, { name: string; photo: string }>()

  const { data: bookings, error: bookingError } = await supabase
    .from('bookings')
    .select(
      'teacher_id, payment_status, teacher:profiles!teacher_id(id, full_name, avatar_url)',
    )
    .eq('student_id', studentId)
    .eq('status', 'active')

  if (bookingError) throw bookingError

  for (const row of bookings ?? []) {
    const paymentStatus = row.payment_status as string | null
    if (paymentStatus && paymentStatus !== 'paid') continue

    const tid = row.teacher_id as string
    teacherIds.add(tid)
    const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher
    if (teacher) {
      teacherMeta.set(tid, {
        name: teacher.full_name ?? 'Teacher',
        photo: teacher.avatar_url ?? '',
      })
    }
  }

  const { data: orders, error: orderError } = await supabase
    .from('class_orders')
    .select(
      'teacher_id, scheduled_at, duration, payment_status, teacher:profiles!teacher_id(id, full_name, avatar_url)',
    )
    .eq('student_id', studentId)
    .eq('payment_status', 'paid')

  if (orderError) {
    if (orderError.code !== 'PGRST205' && orderError.code !== '42P01') {
      throw orderError
    }
  } else {
    for (const row of orders ?? []) {
      const duration = (row.duration as ClassDuration | null) ?? 'month'
      if (
        !isClassOrderActive({
          scheduled_at: row.scheduled_at as string,
          duration,
          payment_status: row.payment_status as string,
        })
      ) {
        continue
      }

      const tid = row.teacher_id as string
      teacherIds.add(tid)
      const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher
      if (teacher && !teacherMeta.has(tid)) {
        teacherMeta.set(tid, {
          name: teacher.full_name ?? 'Teacher',
          photo: teacher.avatar_url ?? '',
        })
      }
    }
  }

  return { teacherIds: [...teacherIds], teacherMeta }
}

export async function fetchStudentCoachingTeachers(
  studentId: string,
): Promise<StudentCoachingTeacher[]> {
  const { teacherIds, teacherMeta } = await collectStudentCoachIds(studentId)
  if (teacherIds.length === 0) return []

  const { data: schedules } = await supabase
    .from('schedules')
    .select('teacher_id, scheduled_at, duration_minutes')
    .eq('student_id', studentId)
    .in('teacher_id', teacherIds)
    .gte(
      'scheduled_at',
      new Date(Date.now() - CLASS_SESSION_DURATION_MINUTES * 60_000).toISOString(),
    )
    .order('scheduled_at', { ascending: true })

  const scheduleByTeacher = new Map<
    string,
    { current: string | null; isNow: boolean; next: string | null }
  >()

  for (const row of schedules ?? []) {
    const tid = row.teacher_id as string
    const scheduledAt = row.scheduled_at as string
    const duration = Number(row.duration_minutes ?? DEFAULT_SESSION_MINUTES)
    const isNow = isScheduleActiveNow(scheduledAt, duration)
    const existing = scheduleByTeacher.get(tid) ?? { current: null, isNow: false, next: null }

    if (isNow) {
      existing.current = scheduledAt
      existing.isNow = true
    } else if (new Date(scheduledAt) > new Date() && !existing.next) {
      existing.next = scheduledAt
    }

    scheduleByTeacher.set(tid, existing)
  }

  return teacherIds
    .map((tid) => {
      const meta = teacherMeta.get(tid)
      const schedule = scheduleByTeacher.get(tid)
      return {
        id: tid,
        name: meta?.name ?? 'Teacher',
        photo: meta?.photo ?? '',
        currentSessionAt: schedule?.current ?? null,
        isScheduledNow: schedule?.isNow ?? false,
        nextSessionAt: schedule?.next ?? null,
      }
    })
    .sort((a, b) => {
      if (a.isScheduledNow !== b.isScheduledNow) return a.isScheduledNow ? -1 : 1
      return a.name.localeCompare(b.name)
    })
}
