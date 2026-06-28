import { getSupabaseAdmin } from './supabaseAdmin.js'
import { calculatePaymentSplit, getCommissionPercent } from './razorpayClient.js'

export type PendingClassOrderInput = {
  studentId: string
  studentName: string
  teacherId: string
  teacherName: string
  threadId: string
  classType: '1:1' | 'group'
  duration: 'week' | 'month'
  startDate: string
  scheduledAt: string
  notes: string
  amount: number
  couponId?: string
  couponDeliveryId?: string
  discountPercent?: number
  originalAmount?: number
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function profileLinkToken(id: string, name: string) {
  return `[${name}](/students/${id})`
}

function buildBookingMessage(input: PendingClassOrderInput, paymentId: string) {
  const start = new Date(input.startDate)
  const startStr = start.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const sessionTime = formatTime(input.scheduledAt)
  const durationLabel = input.duration === 'week' ? '1 week' : '1 month'

  return [
    '━━ Yogstra Class Booking ━━',
    `Student: ${profileLinkToken(input.studentId, input.studentName)}`,
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

export async function createPendingClassOrder(
  input: PendingClassOrderInput,
  razorpayOrderId: string,
  split: ReturnType<typeof calculatePaymentSplit>,
) {
  const supabase = getSupabaseAdmin()

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
      gross_amount: split.grossInr,
      platform_fee: split.platformFeeInr,
      teacher_amount: split.teacherAmountInr,
      commission_percent: split.commissionPercent,
      coupon_id: input.couponId ?? null,
      discount_percent: input.discountPercent ?? null,
      payment_status: 'pending',
      razorpay_order_id: razorpayOrderId,
      transfer_status: 'pending',
    })
    .select('id')
    .single()

  if (error) throw error
  return data.id as string
}

export async function fulfillPaidClassOrder(params: {
  razorpayOrderId: string
  razorpayPaymentId: string
  transferId?: string | null
}) {
  const supabase = getSupabaseAdmin()

  const { data: order, error: orderError } = await supabase
    .from('class_orders')
    .select('*')
    .eq('razorpay_order_id', params.razorpayOrderId)
    .maybeSingle()

  if (orderError) throw orderError
  if (!order) {
    throw new Error('Booking order not found for this payment.')
  }

  if (order.payment_status === 'paid') {
    return { orderId: order.id as string, alreadyFulfilled: true }
  }

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

  const transferStatus = params.transferId ? 'transferred' : 'not_applicable'
  const payoutStatus = params.transferId ? 'paid' : 'pending'

  const { error: updateError } = await supabase
    .from('class_orders')
    .update({
      payment_status: 'paid',
      razorpay_payment_id: params.razorpayPaymentId,
      schedule_id: schedule.id,
      transfer_status: transferStatus,
    })
    .eq('id', order.id)

  if (updateError) throw updateError

  const gross = Number(order.gross_amount ?? order.amount ?? 0)
  const platformFee = Number(order.platform_fee ?? 0)
  const teacherAmount = Number(order.teacher_amount ?? gross - platformFee)

  const { data: studentProfile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', order.student_id)
    .maybeSingle()

  const studentName = studentProfile?.full_name ?? 'Student'
  const periodLabel = new Date(order.created_at as string).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })

  const { data: existingPayout } = await supabase
    .from('payouts')
    .select('id')
    .eq('class_order_id', order.id)
    .maybeSingle()

  if (!existingPayout) {
    const { error: payoutError } = await supabase.from('payouts').insert({
      teacher_id: order.teacher_id,
      class_order_id: order.id,
      student_id: order.student_id,
      gross_amount: gross,
      commission_amount: platformFee,
      teacher_amount: teacherAmount,
      amount: teacherAmount,
      period: `${studentName} · ${periodLabel}`,
      status: payoutStatus,
      razorpay_payment_id: params.razorpayPaymentId,
      razorpay_transfer_id: params.transferId ?? null,
    })
    if (payoutError) throw payoutError
  }

  const startDate = new Date(order.scheduled_at as string).toISOString().slice(0, 10)
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('student_id', order.student_id)
    .eq('teacher_id', order.teacher_id)
    .in('status', ['pending', 'active'])
    .limit(1)
    .maybeSingle()

  if (existingBooking?.status === 'pending') {
    await supabase
      .from('bookings')
      .update({
        status: 'active',
        payment_status: 'paid',
        monthly_fee: gross,
        start_date: startDate,
      })
      .eq('id', existingBooking.id)
  } else if (!existingBooking) {
    await supabase.from('bookings').insert({
      student_id: order.student_id,
      teacher_id: order.teacher_id,
      status: 'active',
      payment_status: 'paid',
      monthly_fee: gross,
      start_date: startDate,
    })
  }

  if (order.thread_id) {
    const input: PendingClassOrderInput = {
      studentId: order.student_id as string,
      studentName,
      teacherId: order.teacher_id as string,
      teacherName: '',
      threadId: order.thread_id as string,
      classType: order.class_type as '1:1' | 'group',
      duration: (order.duration as 'week' | 'month') ?? 'month',
      startDate,
      scheduledAt: order.scheduled_at as string,
      notes: (order.notes as string) ?? '',
      amount: gross,
      discountPercent: order.discount_percent ? Number(order.discount_percent) : undefined,
    }

    await supabase.from('direct_messages').insert({
      thread_id: order.thread_id,
      sender_id: order.student_id,
      content: buildBookingMessage(input, params.razorpayPaymentId),
    })
  }

  await supabase.from('teacher_notifications').insert({
    teacher_id: order.teacher_id,
    student_id: order.student_id,
    order_id: order.id,
    type: 'class_booking',
    title: 'New class booking',
    body: `${studentName} booked a class · ₹${gross.toLocaleString('en-IN')} (your share ₹${teacherAmount.toLocaleString('en-IN')})`,
  })

  return { orderId: order.id as string, alreadyFulfilled: false }
}

export async function getTeacherLinkedAccountId(teacherId: string) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('teacher_profiles')
    .select('razorpay_linked_account_id, payout_onboarding_status')
    .eq('id', teacherId)
    .maybeSingle()

  if (error) throw error
  if (data?.payout_onboarding_status === 'active' && data.razorpay_linked_account_id) {
    return data.razorpay_linked_account_id as string
  }
  return null
}

export async function prepareOrderSplit(amountInr: number) {
  const supabase = getSupabaseAdmin()
  const commissionPercent = await getCommissionPercent(supabase)
  return calculatePaymentSplit(amountInr, commissionPercent)
}
