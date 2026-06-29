import { supabase } from '../lib/supabase'

export type AttendanceSummary = {
  percentage: number | null
  attended: number
  scheduled: number
  absentToday: string[]
}

/** Student attendance from completed live sessions vs scheduled slots in the current month. */
export async function fetchStudentMonthlyAttendance(studentId: string): Promise<{
  percentage: number | null
  monthlyCounts: number[]
  monthLabel: string
}> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const [schedulesResult, sessionsResult] = await Promise.all([
    supabase
      .from('schedules')
      .select('scheduled_at')
      .eq('student_id', studentId)
      .gte('scheduled_at', monthStart.toISOString())
      .lte('scheduled_at', monthEnd.toISOString()),
    supabase
      .from('class_sessions')
      .select('ended_at, started_at')
      .eq('student_id', studentId)
      .eq('status', 'ended')
      .not('started_at', 'is', null)
      .gte('ended_at', monthStart.toISOString())
      .lte('ended_at', monthEnd.toISOString()),
  ])

  if (schedulesResult.error) throw schedulesResult.error
  if (sessionsResult.error) throw sessionsResult.error

  const scheduledPast = (schedulesResult.data ?? []).filter(
    (row) => new Date(row.scheduled_at as string) <= now,
  ).length
  const attended = (sessionsResult.data ?? []).length
  const percentage =
    scheduledPast === 0 ? (attended > 0 ? 100 : null) : Math.min(100, Math.round((attended / scheduledPast) * 100))

  const weeklyBuckets = [0, 0, 0, 0]
  for (const row of sessionsResult.data ?? []) {
    const date = new Date((row.ended_at as string) ?? (row.started_at as string))
    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
    weeklyBuckets[weekIndex] += 1
  }

  return {
    percentage,
    monthlyCounts: weeklyBuckets,
    monthLabel: now.toLocaleDateString('en-IN', { month: 'long' }),
  }
}

/** Teacher weekly attendance from ended live sessions vs past scheduled slots. */
export async function fetchTeacherWeeklyAttendance(teacherId: string): Promise<AttendanceSummary> {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const [schedulesResult, sessionsResult] = await Promise.all([
    supabase
      .from('schedules')
      .select('scheduled_at, student:profiles!student_id(full_name)')
      .eq('teacher_id', teacherId)
      .gte('scheduled_at', weekStart.toISOString())
      .lte('scheduled_at', now.toISOString()),
    supabase
      .from('class_sessions')
      .select('student_id, ended_at')
      .eq('teacher_id', teacherId)
      .eq('status', 'ended')
      .not('started_at', 'is', null)
      .gte('ended_at', weekStart.toISOString())
      .lte('ended_at', now.toISOString()),
  ])

  if (schedulesResult.error) throw schedulesResult.error
  if (sessionsResult.error) throw sessionsResult.error

  const scheduledRows = schedulesResult.data ?? []
  const attendedStudentIds = new Set(
    (sessionsResult.data ?? []).map((row) => row.student_id as string),
  )

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const absentToday: string[] = []
  for (const row of scheduledRows) {
    const scheduledAt = new Date(row.scheduled_at as string)
    if (scheduledAt < todayStart || scheduledAt >= todayEnd) continue
    const student = Array.isArray(row.student) ? row.student[0] : row.student
    const studentId = (row as { student_id?: string }).student_id
    if (studentId && !attendedStudentIds.has(studentId)) {
      absentToday.push((student as { full_name?: string })?.full_name ?? 'Student')
    }
  }

  const scheduled = scheduledRows.length
  const attended = (sessionsResult.data ?? []).length
  const weeklyPercentage =
    scheduled === 0 ? null : Math.min(100, Math.round((attended / scheduled) * 100))

  return {
    percentage: weeklyPercentage,
    attended,
    scheduled,
    absentToday,
  }
}

/** Academy-wide attendance for affiliated teachers' ended sessions this month. */
export async function fetchAcademyMonthlyAttendance(academyId: string): Promise<AttendanceSummary> {
  const { data: teachers, error: teachersError } = await supabase
    .from('teacher_academies')
    .select('teacher_id')
    .eq('academy_id', academyId)
    .eq('status', 'active')

  if (teachersError) throw teachersError
  const teacherIds = (teachers ?? []).map((row) => row.teacher_id as string)
  if (teacherIds.length === 0) {
    return { percentage: null, attended: 0, scheduled: 0, absentToday: [] }
  }

  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

  const [schedulesResult, sessionsResult] = await Promise.all([
    supabase
      .from('schedules')
      .select('scheduled_at')
      .in('teacher_id', teacherIds)
      .gte('scheduled_at', monthStart.toISOString())
      .lte('scheduled_at', now.toISOString()),
    supabase
      .from('class_sessions')
      .select('id')
      .in('teacher_id', teacherIds)
      .eq('status', 'ended')
      .not('started_at', 'is', null)
      .gte('ended_at', monthStart.toISOString())
      .lte('ended_at', now.toISOString()),
  ])

  if (schedulesResult.error) throw schedulesResult.error
  if (sessionsResult.error) throw sessionsResult.error

  const scheduled = (schedulesResult.data ?? []).filter(
    (row) => new Date(row.scheduled_at as string) <= now,
  ).length
  const attended = (sessionsResult.data ?? []).length
  const percentage =
    scheduled === 0 ? null : Math.min(100, Math.round((attended / scheduled) * 100))

  return { percentage, attended, scheduled, absentToday: [] }
}
