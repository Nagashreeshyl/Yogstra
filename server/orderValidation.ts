import { assertAuthenticatedUser, getSupabaseAdmin, getSupabaseUserClient } from './supabaseAdmin.js'
import type { PendingClassOrderInput } from './fulfillPayment.js'

type ClassType = '1:1' | 'group'
type ClassDuration = 'week' | 'month'

function teacherFeeFromRow(
  row: Record<string, unknown>,
  classType: ClassType,
  duration: ClassDuration,
) {
  if (classType === 'group') {
    const fee =
      duration === 'week'
        ? row.fee_group_week
        : row.fee_group_month ?? row.fee_group ?? row.monthly_fee
    return Number(fee ?? 0)
  }

  const fee =
    duration === 'week' ? row.fee_1v1_week : row.fee_1v1_month ?? row.monthly_fee
  return Number(fee ?? 0)
}

async function expectedPayableAmount(params: {
  studentId: string
  teacherId: string
  classType: ClassType
  duration: ClassDuration
  couponDeliveryId?: string
}) {
  const supabase = getSupabaseAdmin()

  const { data: teacher, error: teacherError } = await supabase
    .from('teacher_profiles')
    .select(
      'status, monthly_fee, fee_group, fee_1v1_week, fee_1v1_month, fee_group_week, fee_group_month',
    )
    .eq('id', params.teacherId)
    .maybeSingle()

  if (teacherError) throw teacherError
  if (!teacher || teacher.status !== 'verified') {
    throw new Error('Teacher is not available for bookings.')
  }

  const baseFee = teacherFeeFromRow(teacher as Record<string, unknown>, params.classType, params.duration)
  if (!Number.isFinite(baseFee) || baseFee <= 0) {
    throw new Error('Teacher pricing is not configured for this class.')
  }

  if (!params.couponDeliveryId) {
    return Math.round(baseFee)
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('coupon_deliveries')
    .select('id, student_id, used_at, coupon:teacher_coupons!inner(id, teacher_id, class_type, duration, discount_percent, is_active, valid_until)')
    .eq('id', params.couponDeliveryId)
    .maybeSingle()

  if (deliveryError) throw deliveryError
  if (!delivery || delivery.student_id !== params.studentId) {
    throw new Error('Invalid coupon for this booking.')
  }
  if (delivery.used_at) {
    throw new Error('This coupon has already been used.')
  }

  const couponRow = delivery.coupon
  const coupon = (Array.isArray(couponRow) ? couponRow[0] : couponRow) as {
    teacher_id: string
    class_type: ClassType
    duration: ClassDuration
    discount_percent: number
    is_active: boolean
    valid_until: string | null
  }

  if (!coupon) {
    throw new Error('Invalid coupon for this booking.')
  }

  if (coupon.teacher_id !== params.teacherId) {
    throw new Error('This coupon does not apply to this teacher.')
  }
  if (!coupon.is_active) {
    throw new Error('This coupon is no longer active.')
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < new Date()) {
    throw new Error('This coupon has expired.')
  }
  if (coupon.class_type !== params.classType || coupon.duration !== params.duration) {
    throw new Error('This coupon does not apply to the selected class.')
  }

  const discount = Number(coupon.discount_percent ?? 0)
  if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
    throw new Error('Invalid coupon discount.')
  }

  return Math.max(1, Math.round(baseFee * (1 - discount / 100)))
}

export async function validatePendingOrderRequest(params: {
  studentId: string
  amountInr: number
  teacherId: string
  threadId: string
  orderInput: PendingClassOrderInput
}) {
  if (params.orderInput.studentId !== params.studentId) {
    throw new Error('Booking student does not match your account.')
  }
  if (params.orderInput.teacherId !== params.teacherId) {
    throw new Error('Booking teacher mismatch.')
  }

  const supabase = getSupabaseAdmin()

  const { data: thread, error: threadError } = await supabase
    .from('chat_threads')
    .select('participant_a, participant_b, status')
    .eq('id', params.threadId)
    .maybeSingle()

  if (threadError) throw threadError
  if (!thread || thread.status !== 'accepted') {
    throw new Error('Chat thread is not accepted for this booking.')
  }

  const participants = [thread.participant_a, thread.participant_b]
  if (!participants.includes(params.studentId) || !participants.includes(params.teacherId)) {
    throw new Error('Booking participants do not match the chat thread.')
  }

  const expectedAmount = await expectedPayableAmount({
    studentId: params.studentId,
    teacherId: params.teacherId,
    classType: params.orderInput.classType,
    duration: params.orderInput.duration,
    couponDeliveryId: params.orderInput.couponDeliveryId,
  })

  if (Math.round(params.amountInr) !== expectedAmount) {
    throw new Error('Payment amount does not match the quoted class fee.')
  }
  if (Math.round(params.orderInput.amount) !== expectedAmount) {
    throw new Error('Order amount does not match the quoted class fee.')
  }

  const { data: paidOrders, error: paidOrdersError } = await supabase
    .from('class_orders')
    .select('id, scheduled_at, duration, payment_status')
    .eq('student_id', params.studentId)
    .eq('teacher_id', params.teacherId)
    .eq('payment_status', 'paid')

  if (paidOrdersError) throw paidOrdersError

  const now = Date.now()
  for (const paidOrder of paidOrders ?? []) {
    const duration = (paidOrder.duration as ClassDuration | null) ?? 'month'
    const scheduledAt = paidOrder.scheduled_at as string
    const expiry = new Date(scheduledAt)
    if (duration === 'week') {
      expiry.setDate(expiry.getDate() + 7)
    } else {
      expiry.setMonth(expiry.getMonth() + 1)
    }
    if (now < expiry.getTime()) {
      throw new Error('You are already enrolled with this coach for the current period.')
    }
  }

  return expectedAmount
}

export async function assertLiveKitRoomAccess(
  roomName: string,
  accessToken: string,
  verifiedUser?: Awaited<ReturnType<typeof assertAuthenticatedUser>>,
) {
  const user = verifiedUser ?? (await assertAuthenticatedUser(accessToken))
  const trimmedRoom = roomName.trim()

  let session:
    | { id: string; teacher_id: string; student_id: string }
    | null
    | undefined
  let call:
    | { id: string; caller_id: string; callee_id: string }
    | null
    | undefined

  try {
    const admin = getSupabaseAdmin()
    const [{ data: classSession }, { data: directCall }] = await Promise.all([
      admin.from('class_sessions').select('id, teacher_id, student_id').eq('room_name', trimmedRoom).maybeSingle(),
      admin.from('direct_video_calls').select('id, caller_id, callee_id').eq('room_name', trimmedRoom).maybeSingle(),
    ])
    session = classSession
    call = directCall
  } catch {
    const supabase = getSupabaseUserClient(accessToken)
    const [{ data: classSession }, { data: directCall }] = await Promise.all([
      supabase.from('class_sessions').select('id, teacher_id, student_id').eq('room_name', trimmedRoom).maybeSingle(),
      supabase.from('direct_video_calls').select('id, caller_id, callee_id').eq('room_name', trimmedRoom).maybeSingle(),
    ])
    session = classSession
    call = directCall
  }

  if (session) {
    const allowed =
      user.role === 'admin' ||
      session.teacher_id === user.userId ||
      session.student_id === user.userId
    if (!allowed) {
      throw new Error('You do not have access to this video room.')
    }
    return
  }

  if (call) {
    const allowed =
      user.role === 'admin' ||
      call.caller_id === user.userId ||
      call.callee_id === user.userId
    if (!allowed) {
      throw new Error('You do not have access to this video room.')
    }
    return
  }

  throw new Error('You do not have access to this video room.')
}

export async function assertOrderFulfillAccess(
  accessToken: string,
  razorpayOrderId: string,
) {
  const { getSupabaseAnon, getSupabaseUserClient } = await import('./supabaseAdmin.js')
  const anon = getSupabaseAnon()
  const { data, error } = await anon.auth.getUser(accessToken)
  if (error || !data.user) {
    throw new Error('Authentication required.')
  }

  const supabase = getSupabaseUserClient(accessToken)
  const { data: order, error: orderError } = await supabase
    .from('class_orders')
    .select('student_id')
    .eq('razorpay_order_id', razorpayOrderId)
    .maybeSingle()

  if (orderError) throw orderError
  if (!order) {
    throw new Error('Booking order not found for this payment.')
  }
  if (order.student_id !== data.user.id) {
    throw new Error('You can only complete your own payment.')
  }

  return data.user.id
}
