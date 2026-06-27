import { supabase } from '../lib/supabase'
import type { Student, StudentDetail } from '../types'
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

/** Lightweight list for sidebars and pickers */
export async function fetchStudentList(): Promise<Student[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, avatar_url, created_at')
    .eq('role', 'student')
    .order('full_name', { ascending: true })

  if (error) throw error

  return (data ?? []).map((row) =>
    mapStudent(
      {
        id: row.id,
        role: 'student',
        full_name: row.full_name,
        phone: row.phone,
        city: null,
        state: null,
        avatar_url: row.avatar_url,
        created_at: row.created_at,
      },
      '',
      0,
    ),
  )
}

export async function fetchStudentById(studentId: string): Promise<StudentDetail | null> {
  const { data: row, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', studentId)
    .eq('role', 'student')
    .maybeSingle()

  if (error) throw error
  if (!row) return null

  const { count } = await supabase
    .from('schedules')
    .select('*', { count: 'exact', head: true })
    .eq('student_id', studentId)

  const { data: booking } = await supabase
    .from('bookings')
    .select('teacher_id, teacher:profiles!teacher_id(full_name)')
    .eq('student_id', studentId)
    .eq('status', 'active')
    .maybeSingle()

  const teacherProfile = booking?.teacher
    ? Array.isArray(booking.teacher)
      ? booking.teacher[0]
      : booking.teacher
    : null

  const base = mapStudent(row, '', count ?? 0, booking?.teacher_id ?? undefined)

  return {
    ...base,
    city: row.city ?? '',
    state: row.state ?? '',
    activeTeacherName: teacherProfile?.full_name ?? undefined,
  }
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

export interface StudentSettingsData {
  fullName: string
  phone: string
  city: string
  state: string
}

export async function updateStudentSettings(studentId: string, data: StudentSettingsData) {
  const { error } = await supabase
    .from('profiles')
    .update({
      full_name: data.fullName,
      phone: data.phone,
      city: data.city,
      state: data.state,
    })
    .eq('id', studentId)

  if (error) throw error
}

export async function fetchStudentProfile(studentId: string): Promise<StudentDetail | null> {
  return fetchStudentById(studentId)
}
