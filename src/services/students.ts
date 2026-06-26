import { supabase } from '../lib/supabase'
import type { Student } from '../types'
import { mapStudent } from '../utils/mappers'

export async function fetchStudents(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'student')
    .order('created_at', { ascending: false })

  if (error) throw error

  const students = await Promise.all(
    (data ?? []).map(async (row) => {
      const { data: booking } = await supabase
        .from('bookings')
        .select('teacher_id')
        .eq('student_id', row.id)
        .eq('status', 'active')
        .limit(1)
        .maybeSingle()

      const { count } = await supabase
        .from('schedules')
        .select('*', { count: 'exact', head: true })
        .eq('student_id', row.id)

      return mapStudent(row, '', count ?? 0, booking?.teacher_id ?? undefined)
    }),
  )

  return students
}

export async function fetchStudentCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'student')

  if (error) throw error
  return count ?? 0
}

export async function fetchTeacherStudents(teacherId: string): Promise<Student[]> {
  const { data: bookingRows, error } = await supabase
    .from('bookings')
    .select('student_id, student:profiles!student_id(*)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if (error) throw error

  return (bookingRows ?? []).map((b) => {
    const student = Array.isArray(b.student) ? b.student[0] : b.student
    return mapStudent(student, '', 0)
  })
}
