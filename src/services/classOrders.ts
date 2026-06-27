import { supabase } from '../lib/supabase'
import { markCouponUsed } from './coupons'
import { sendDirectMessage } from './directChat'
import { createTeacherBookingNotification } from './teacherNotifications'
import { ensureActiveBookingAfterPayment } from './bookings'
import { profileLinkToken } from '../utils/messageContent'
import { formatTime } from '../utils/format'

export type ClassType = '1:1' | 'group'
export type ClassDuration = 'week' | 'month'

export interface ClassOrderInput {
  studentId: string
  studentName: string
  teacherId: string
  teacherName: string
  threadId: string
  classType: ClassType
  duration: ClassDuration
  startDate: string
  scheduledAt: string
  notes: string
  amount: number
  couponId?: string
  couponDeliveryId?: string
  discountPercent?: number
  originalAmount?: number
}

export function buildYogstraBookingMessage(input: ClassOrderInput, paymentId: string) {
  const start = new Date(input.startDate)
  const startStr = start.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const sessionTime = formatTime(input.scheduledAt)
  const durationLabel = input.duration === 'week' ? '1 week' : '1 month'
  const studentLine = `Student: ${profileLinkToken(input.studentId, input.studentName)}`

  return [
    '━━ Yogstra Class Booking ━━',
    studentLine,
    `Class type: ${input.classType === '1:1' ? '1-on-1 coaching' : 'Group coaching'}`,
    `Duration: ${durationLabel}`,
    `Start date: ${startStr}`,
    `First session: ${sessionTime}`,
    input.notes ? `Notes: ${input.notes}` : null,
    input.discountPercent
      ? `Original fee: ₹${(input.originalAmount ?? input.amount).toLocaleString('en-IN')}`
      : null,
    input.discountPercent ? `Discount: ${input.discountPercent}% off` : null,
    `Fee: ₹${input.amount.toLocaleString('en-IN')}`,
    `Payment: Paid ✓ (Ref ${paymentId.slice(0, 14)})`,
  ]
    .filter(Boolean)
    .join('\n')
}

async function notifyTeacherOfBooking(input: ClassOrderInput, paymentId: string) {
  const content = buildYogstraBookingMessage(input, paymentId)
  await sendDirectMessage(input.threadId, input.studentId, content)
}

export async function fulfillClassOrderAfterPayment(
  paymentId: string,
  input: ClassOrderInput,
) {
  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert({
      teacher_id: input.teacherId,
      student_id: input.studentId,
      class_type: input.classType,
      scheduled_at: input.scheduledAt,
      duration_minutes: 60,
    })
    .select('id')
    .single()

  if (scheduleError) throw scheduleError

  const { data: order, error: orderError } = await supabase
    .from('class_orders')
    .insert({
      student_id: input.studentId,
      teacher_id: input.teacherId,
      thread_id: input.threadId,
      class_type: input.classType,
      duration: input.duration,
      scheduled_at: input.scheduledAt,
      notes: input.notes || null,
      amount: input.amount,
      coupon_id: input.couponId ?? null,
      discount_percent: input.discountPercent ?? null,
      payment_status: 'paid',
      razorpay_payment_id: paymentId,
      schedule_id: schedule.id,
    })
    .select('id')
    .single()

  if (orderError) {
    if (orderError.code === 'PGRST205' || orderError.code === '42P01') {
      throw new Error('Class booking is not set up. Run supabase/chat-enhancements.sql.')
    }
    throw orderError
  }

  const orderId = order.id as string

  if (input.couponDeliveryId) {
    await markCouponUsed(input.couponDeliveryId, orderId)
  }

  await ensureActiveBookingAfterPayment(
    input.studentId,
    input.teacherId,
    input.amount,
    input.startDate,
  )

  await notifyTeacherOfBooking(input, paymentId)
  await createTeacherBookingNotification(orderId, input, paymentId)

  return orderId
}

export async function fetchTeacherFee(
  teacherId: string,
  classType: ClassType,
  duration: ClassDuration = 'month',
): Promise<number> {
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select(
      'monthly_fee, fee_group, fee_1v1_week, fee_1v1_month, fee_group_week, fee_group_month',
    )
    .eq('id', teacherId)
    .single()

  if (error) throw error

  if (classType === 'group') {
    const fee =
      duration === 'week'
        ? data.fee_group_week
        : data.fee_group_month ?? data.fee_group ?? data.monthly_fee
    return Number(fee ?? 0)
  }

  const fee =
    duration === 'week' ? data.fee_1v1_week : data.fee_1v1_month ?? data.monthly_fee
  return Number(fee ?? 0)
}

export async function fetchTeacherSchedulesForMonth(
  teacherId: string,
  year: number,
  month: number,
) {
  const start = new Date(year, month, 1)
  const end = new Date(year, month + 1, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('schedules')
    .select('*, student:profiles!student_id(full_name)')
    .eq('teacher_id', teacherId)
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error
  return data ?? []
}
