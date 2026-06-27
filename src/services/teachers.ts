import { supabase } from '../lib/supabase'
import { invalidateProfileCache } from './auth'
import type { Teacher, TeacherPricing } from '../types'
import { mapTeacher } from '../utils/mappers'

const teacherSelect = `
  *,
  teacher_profiles (*)
`

export async function fetchTeachers(verifiedOnly = false, includeRemoved = false): Promise<Teacher[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select(teacherSelect)
    .eq('role', 'teacher')
    .order('created_at', { ascending: false })

  if (error) throw error

  let result = (data ?? []).map((row) => mapTeacher(row))
  if (verifiedOnly) {
    result = result.filter((t) => t.verified)
  } else if (!includeRemoved) {
    result = result.filter((t) => t.status !== 'Removed')
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
  return fetchTeachers(false, true)
}

export async function updateTeacherStatus(
  id: string,
  status: 'verified' | 'rejected' | 'pending' | 'removed',
) {
  const { error } = await supabase
    .from('teacher_profiles')
    .update({ status })
    .eq('id', id)

  if (error) throw error
}

/** Admin removes a teacher — blocks dashboard access and cancels active bookings. */
export async function removeTeacher(id: string) {
  const { error: statusError } = await supabase
    .from('teacher_profiles')
    .update({ status: 'removed' })
    .eq('id', id)

  if (statusError) throw statusError

  const { error: bookingError } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('teacher_id', id)
    .in('status', ['active', 'pending'])

  if (bookingError) throw bookingError
}

/** Removed teachers can request verification again. */
export async function reapplyAsTeacher(id: string) {
  const { error } = await supabase
    .from('teacher_profiles')
    .update({ status: 'pending' })
    .eq('id', id)
    .eq('status', 'removed')

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
  gender?: 'male' | 'female' | null
  pricing?: TeacherPricing
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
  if (data.gender !== undefined) {
    profileUpdate.gender = data.gender
  }

  const { error: profileError } = await supabase
    .from('profiles')
    .update(profileUpdate)
    .eq('id', teacherId)

  if (profileError) throw profileError

  const teacherUpdate: Record<string, unknown> = {
    bio: data.bio,
    certifications: data.certifications,
    monthly_fee: data.monthlyFee,
    specializations: data.specializations,
  }
  if (data.pricing) {
    teacherUpdate.fee_1v1_week = data.pricing.oneOnOneWeek
    teacherUpdate.fee_1v1_month = data.pricing.oneOnOneMonth
    teacherUpdate.fee_group_week = data.pricing.groupWeek
    teacherUpdate.fee_group_month = data.pricing.groupMonth
  }

  const { error: teacherError } = await supabase
    .from('teacher_profiles')
    .update(teacherUpdate)
    .eq('id', teacherId)

  if (teacherError) throw teacherError

  invalidateProfileCache(teacherId)
}
