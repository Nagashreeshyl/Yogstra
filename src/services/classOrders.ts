import { supabase } from '../lib/supabase'
import { markCouponUsed } from './coupons'
import { sendDirectMessage } from './directChat'
import { createTeacherBookingNotification } from './teacherNotifications'
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

export async function createClassOrder(input: ClassOrderInput) {
  const { data, error } = await supabase
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
      payment_status: 'pending',
    })
    .select('id')
    .single()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error('Class booking is not set up. Run supabase/chat-enhancements.sql.')
    }
    throw error
  }

  return data.id as string
}

export async function notifyTeacherOfBooking(input: ClassOrderInput, paymentId: string) {
  const content = buildYogstraBookingMessage(input, paymentId)
  await sendDirectMessage(input.threadId, input.studentId, content)
}

/** After Razorpay success: mark paid, notify teacher in chat + notifications. */
export async function completeClassOrderAfterPayment(
  orderId: string,
  paymentId: string,
  input: ClassOrderInput,
) {
  await markClassOrderPaid(orderId, paymentId)
  if (input.couponDeliveryId) {
    await markCouponUsed(input.couponDeliveryId, orderId)
  }
  await notifyTeacherOfBooking(input, paymentId)
  await createTeacherBookingNotification(orderId, input, paymentId)
}

export async function markClassOrderPaid(orderId: string, razorpayPaymentId: string) {
  const { data: order, error: fetchError } = await supabase
    .from('class_orders')
    .select('*')
    .eq('id', orderId)
    .single()

  if (fetchError) throw fetchError

  const { data: schedule, error: scheduleError } = await supabase
    .from('schedules')
    .insert({
      teacher_id: order.teacher_id,
      student_id: order.student_id,
      class_type: order.class_type,
      scheduled_at: order.scheduled_at,
      duration_minutes: 60,
    })
    .select('id')
    .single()

  if (scheduleError) throw scheduleError

  const { error: updateError } = await supabase
    .from('class_orders')
    .update({
      payment_status: 'paid',
      razorpay_payment_id: razorpayPaymentId,
      schedule_id: schedule.id,
    })
    .eq('id', orderId)

  if (updateError) throw updateError

  return schedule.id as string
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
