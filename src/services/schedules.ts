import { supabase } from '../lib/supabase'
import type { ScheduleClass } from '../types'
import { mapSchedule } from '../utils/mappers'

const scheduleSelect = `
  *,
  student:profiles!student_id (*)
`

export async function fetchSchedulesByTeacher(teacherId: string): Promise<ScheduleClass[]> {
  const { data, error } = await supabase
    .from('schedules')
    .select(scheduleSelect)
    .eq('teacher_id', teacherId)
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapSchedule(row))
}

export async function fetchStudentUpcomingSchedules(studentId: string): Promise<ScheduleClass[]> {
  const now = new Date()

  const { data, error } = await supabase
    .from('schedules')
    .select(scheduleSelect)
    .eq('student_id', studentId)
    .gte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(5)

  if (error) throw error
  return (data ?? []).map((row) => mapSchedule(row))
}

export async function fetchStudentSessionCount(studentId: string): Promise<number> {
  const { count, error } = await supabase
    .from('schedules')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)
    .lt('scheduled_at', new Date().toISOString())

  if (error) throw error
  return count ?? 0
}

export async function fetchTeacherUpcomingSchedules(teacherId: string): Promise<ScheduleClass[]> {
  const now = new Date()

  const { data, error } = await supabase
    .from('schedules')
    .select(scheduleSelect)
    .eq('teacher_id', teacherId)
    .gte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapSchedule(row))
}

export async function fetchTodaySchedules(teacherId: string): Promise<ScheduleClass[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('schedules')
    .select(scheduleSelect)
    .eq('teacher_id', teacherId)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  return (data ?? []).map((row) => mapSchedule(row))
}
