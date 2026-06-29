import { supabase } from '../lib/supabase'

export async function fetchAcademyTimetable(academyId: string) {
  const { data: teachers, error: teachersError } = await supabase
    .from('teacher_academies')
    .select('teacher_id')
    .eq('academy_id', academyId)
    .eq('status', 'active')

  if (teachersError) throw teachersError

  const teacherIds = (teachers ?? []).map((row) => row.teacher_id as string)
  if (teacherIds.length === 0) {
    return { sessions: [] as AcademyTimetableSession[] }
  }

  const now = new Date()
  const { data, error } = await supabase
    .from('schedules')
    .select(
      `
      id,
      scheduled_at,
      class_type,
      teacher:profiles!teacher_id(full_name),
      student:profiles!student_id(full_name)
    `,
    )
    .in('teacher_id', teacherIds)
    .gte('scheduled_at', now.toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(100)

  if (error) throw error

  const sessions: AcademyTimetableSession[] = (data ?? []).map((row) => {
    const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher
    const student = Array.isArray(row.student) ? row.student[0] : row.student
    return {
      id: row.id as string,
      scheduledAt: row.scheduled_at as string,
      classType: (row.class_type as string) ?? 'Class',
      teacherName: (teacher as { full_name?: string })?.full_name ?? 'Teacher',
      studentName: (student as { full_name?: string })?.full_name ?? 'Student',
    }
  })

  return { sessions }
}

type AcademyTimetableSession = {
  id: string
  scheduledAt: string
  classType: string
  teacherName: string
  studentName: string
}
