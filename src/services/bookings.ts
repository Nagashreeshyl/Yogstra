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

export async function fetchBookingsByStudent(studentId: string): Promise<Booking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select(bookingSelect)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map((row) => mapBooking(row))
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

export async function fetchTeacherMonthlyEarnings(teacherId: string): Promise<number> {
  const { data, error } = await supabase
    .from('bookings')
    .select('monthly_fee')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  if (error) throw error
  return (data ?? []).reduce((sum, b) => sum + Number(b.monthly_fee ?? 0), 0)
}

export async function ensureActiveBookingAfterPayment(
  studentId: string,
  teacherId: string,
  amount: number,
  startDate: string,
) {
  const { data: existing, error: fetchError } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .in('status', ['pending', 'active'])
    .limit(1)
    .maybeSingle()

  if (fetchError) throw fetchError

  if (existing?.status === 'active') return existing.id as string

  if (existing?.status === 'pending') {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'active',
        payment_status: 'paid',
        monthly_fee: amount,
        start_date: startDate,
      })
      .eq('id', existing.id)

    if (error) throw error
    return existing.id as string
  }

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      student_id: studentId,
      teacher_id: teacherId,
      status: 'active',
      payment_status: 'paid',
      monthly_fee: amount,
      start_date: startDate,
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}
