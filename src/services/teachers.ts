import { supabase } from '../lib/supabase'
import type { Teacher } from '../types'
import { mapTeacher } from '../utils/mappers'

const teacherSelect = `
  *,
  teacher_profiles (*)
`

export async function fetchTeachers(verifiedOnly = false): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(teacherSelect)
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  if (error) throw error

  let result = (data ?? []).map((row) => mapTeacher(row))
  if (verifiedOnly) {
    result = result.filter((t) => t.verified)
  }
  return result
}

export async function fetchTeacherById(id: string): Promise<Teacher | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select(teacherSelect)
    .eq('id', id)
    .eq('role', 'teacher')
    .single()

  if (error || !data) return null
  return mapTeacher(data)
}

export async function fetchAllTeachersAdmin(): Promise<Teacher[]> {
  return fetchTeachers(false)
}

export async function updateTeacherStatus(id: string, status: 'verified' | 'rejected' | 'pending') {
  const { error } = await supabase
    .from('teacher_profiles')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

export async function fetchTeacherCount(): Promise<number> {
  const { count, error } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'teacher')

  if (error) throw error
  return count ?? 0
}

export async function fetchPendingTeachers(): Promise<Teacher[]> {
  const all = await fetchTeachers(false)
  return all.filter((t) => t.status === 'Pending')
}

export interface TeacherSettingsData {
  fullName: string
  phone: string
  city: string
  state: string
  bio: string
  certifications: string
  monthlyFee: number
  specializations: string[]
  avatarUrl?: string | null
}

export async function updateTeacherSettings(teacherId: string, data: TeacherSettingsData) {
  const profileUpdate: Record<string, unknown> = {
    full_name: data.fullName,
    phone: data.phone,
    city: data.city,
    state: data.state,
  }
  if (data.avatarUrl !== undefined) {
    profileUpdate.avatar_url = data.avatarUrl
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', teacherId)

  if (profileError) throw profileError

  const { error: teacherError } = await supabase
    .from('teacher_profiles')
    .update({
      bio: data.bio,
      certifications: data.certifications,
      monthly_fee: data.monthlyFee,
      specializations: data.specializations,
    })
    .eq('id', teacherId)

  if (teacherError) throw teacherError
}
