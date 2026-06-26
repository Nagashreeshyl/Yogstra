import { supabase } from '../lib/supabase'
import type { Booking } from '../types'
import { mapBooking } from '../utils/mappers'

const bookingSelect = `
  *,
  student:profiles!student_id (*),
  teacher:profiles!teacher_id (*)
`

export async function fetchBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapBooking(row))
}

export async function fetchActiveBookingCount(): Promise<number> {
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active')

  if (error) throw error
  return count ?? 0
}

export async function fetchStudentActiveBooking(studentId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('student_id', studentId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (error) throw error
  return data ? mapBooking(data) : null
}

export async function fetchMonthlyRevenue(): Promise<number> {
  const { data, error } = await supabase
    .from('bookings')
    .select('monthly_fee')
    .eq('status', 'active')
    .eq('payment_status', 'paid')

  if (error) throw error
  return (data ?? []).reduce((sum, b) => sum + Number(b.monthly_fee ?? 0), 0)
}

export async function fetchTeacherActiveStudentCount(teacherId: string): Promise<number> {
  const { count, error } = await supabase
    .from('bookings')
    .select('*', { count: 'exact', head: true })
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if (error) throw error
  return count ?? 0
}

export async function fetchTeacherPendingBookings(teacherId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('teacher_id', teacherId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapBooking(row))
}

export async function fetchTeacherMonthlyEarnings(teacherId: string): Promise<number> {
  const { data, error } = await supabase
    .from('bookings')
    .select('monthly_fee')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if (error) throw error
  return (data ?? []).reduce((sum, b) => sum + Number(b.monthly_fee ?? 0), 0)
}

export async function updateBookingStatus(
  bookingId: string,
  status: 'active' | 'cancelled' | 'pending',
) {
  const { error } = await supabase.from('bookings').update({ status }).eq('id', bookingId)
  if (error) throw error
}
