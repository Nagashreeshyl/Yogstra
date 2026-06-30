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

type ClassOrderRow = Record<string, unknown>

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

function orderToInput(order: ClassOrderRow, studentName: string): PendingClassOrderInput {
  const scheduledAt = order.scheduled_at as string
  return {
    studentId: order.student_id as string,
    studentName,
    teacherId: order.teacher_id as string,
    teacherName: '',
    threadId: (order.thread_id as string) ?? '',
    classType: order.class_type as '1:1' | 'group',
    duration: ((order.duration as 'week' | 'month') ?? 'month') as 'week' | 'month',
    startDate: new Date(scheduledAt).toISOString().slice(0, 10),
    scheduledAt,
    notes: (order.notes as string) ?? '',
    amount: Number(order.gross_amount ?? order.amount ?? 0),
    couponId: (order.coupon_id as string | null) ?? undefined,
    discountPercent: order.discount_percent ? Number(order.discount_percent) : undefined,
  }
}

async function redeemCouponForOrder(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
) {
  const couponId = order.coupon_id as string | null
  if (!couponId) return

  const { data: delivery } = await supabase
    .from('coupon_deliveries')
    .select('id, used_at')
    .eq('coupon_id', couponId)
    .eq('student_id', order.student_id as string)
    .maybeSingle()

  if (!delivery || delivery.used_at) return

  const { data: coupon } = await supabase
    .from('teacher_coupons')
    .select('max_uses, use_count')
    .eq('id', couponId)
    .maybeSingle()

  if (!coupon) return
  if (coupon.max_uses != null && Number(coupon.use_count) >= Number(coupon.max_uses)) return

  const { error: deliveryError } = await supabase
    .from('coupon_deliveries')
    .update({ used_at: new Date().toISOString(), order_id: order.id as string })
    .eq('id', delivery.id)
    .is('used_at', null)

  if (deliveryError) throw deliveryError

  const { error: couponError } = await supabase
    .from('teacher_coupons')
    .update({ use_count: Number(coupon.use_count) + 1 })
    .eq('id', couponId)

  if (couponError) throw couponError
}

async function upsertBookingForOrder(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
  gross: number,
) {
  const startDate = new Date(order.scheduled_at as string).toISOString().slice(0, 10)
  const { data: existingBooking } = await supabase
    .from('bookings')
    .select('id, status')
    .eq('student_id', order.student_id as string)
    .eq('teacher_id', order.teacher_id as string)
    .in('status', ['pending', 'active'])
    .limit(1)
    .maybeSingle()

  if (existingBooking) {
    const { error } = await supabase
      .from('bookings')
      .update({
        status: 'active',
        payment_status: 'paid',
        monthly_fee: gross,
        start_date: startDate,
      })
      .eq('id', existingBooking.id)
    if (error) throw new Error(`Failed to activate booking: ${error.message}`)
    return
  }

  const { error } = await supabase.from('bookings').insert({
    student_id: order.student_id,
    teacher_id: order.teacher_id,
    status: 'active',
    payment_status: 'paid',
    monthly_fee: gross,
    start_date: startDate,
  })
  if (error) throw new Error(`Failed to create booking: ${error.message}`)
}

async function enrollInAcademyBatchIfApplicable(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
) {
  if (order.class_type !== 'group') return null

  const teacherId = order.teacher_id as string
  const studentId = order.student_id as string

  const { data: affiliation } = await supabase
    .from('teacher_academies')
    .select('academy_id')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  if (!affiliation?.academy_id) return null

  let batchId: string | null = null

  const { data: teacherBatch } = await supabase
    .from('batches')
    .select('id')
    .eq('academy_id', affiliation.academy_id)
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle()

  batchId = (teacherBatch?.id as string | undefined) ?? null

  if (!batchId) {
    const { data: academyBatch } = await supabase
      .from('batches')
      .select('id')
      .eq('academy_id', affiliation.academy_id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle()
    batchId = (academyBatch?.id as string | undefined) ?? null
  }

  if (!batchId) return { academyId: affiliation.academy_id as string, batchId: null }

  const { data: existing } = await supabase
    .from('batch_students')
    .select('id, status')
    .eq('batch_id', batchId)
    .eq('student_id', studentId)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'removed') {
      const { error } = await supabase
        .from('batch_students')
        .update({ status: 'active', enrollment_type: 'academy' })
        .eq('id', existing.id)
      if (error) throw new Error(`Failed to re-enroll batch student: ${error.message}`)
    }
  } else {
    const { error } = await supabase.from('batch_students').insert({
      batch_id: batchId,
      student_id: studentId,
      enrollment_type: 'academy',
      status: 'active',
    })
    if (error && error.code !== '23505') {
      throw new Error(`Failed to enroll batch student: ${error.message}`)
    }
  }

  return { academyId: affiliation.academy_id as string, batchId }
}

async function insertEnrollmentNotification(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  params: {
    userId: string
    orderId: string
    role: 'student' | 'teacher' | 'academy' | 'admin'
    title: string
    body: string
    href?: string
  },
) {
  const { error } = await supabase.from('enrollment_notifications').insert({
    user_id: params.userId,
    order_id: params.orderId,
    role: params.role,
    title: params.title,
    body: params.body,
    href: params.href ?? null,
  })

  if (error?.code === '23505') return
  if (error?.code === 'PGRST205' || error?.code === '42P01') return
  if (error) throw error
}

async function notifyEnrollmentParties(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
  studentName: string,
  teacherName: string,
  gross: number,
  teacherAmount: number,
  academyLink: { academyId: string; batchId: string | null } | null,
) {
  const orderId = order.id as string
  const studentId = order.student_id as string
  const teacherId = order.teacher_id as string

  const { data: existingTeacherNotif } = await supabase
    .from('teacher_notifications')
    .select('id')
    .eq('order_id', orderId)
    .maybeSingle()

  if (!existingTeacherNotif) {
    const { error } = await supabase.from('teacher_notifications').insert({
      teacher_id: teacherId,
      student_id: studentId,
      order_id: orderId,
      type: 'class_booking',
      title: 'New student enrolled',
      body: `${studentName} enrolled · ₹${gross.toLocaleString('en-IN')} (your share ₹${teacherAmount.toLocaleString('en-IN')})`,
    })
    if (error) throw error
  }

  await insertEnrollmentNotification(supabase, {
    userId: studentId,
    orderId,
    role: 'student',
    title: 'Enrollment successful',
    body: `You're enrolled with ${teacherName}. Your first session is scheduled.`,
    href: '/dashboard/student',
  })

  await insertEnrollmentNotification(supabase, {
    userId: teacherId,
    orderId,
    role: 'teacher',
    title: 'New student enrolled',
    body: `${studentName} completed enrollment and payment.`,
    href: '/dashboard/teacher/students',
  })

  if (academyLink?.academyId) {
    const { data: owners } = await supabase
      .from('academy_members')
      .select('user_id')
      .eq('academy_id', academyLink.academyId)
      .in('role', ['owner', 'manager'])
      .eq('status', 'active')

    for (const owner of owners ?? []) {
      await insertEnrollmentNotification(supabase, {
        userId: owner.user_id as string,
        orderId,
        role: 'academy',
        title: 'Student joined academy',
        body: `${studentName} enrolled in a program with ${teacherName}.`,
        href: '/dashboard/academy/students',
      })
    }
  }

  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  for (const admin of admins ?? []) {
    await insertEnrollmentNotification(supabase, {
      userId: admin.id as string,
      orderId,
      role: 'admin',
      title: 'New paid enrollment',
      body: `${studentName} paid ₹${gross.toLocaleString('en-IN')} for ${teacherName}.`,
      href: '/admin/bookings',
    })
  }
}

async function ensureScheduleForOrder(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
) {
  let scheduleId = order.schedule_id as string | null

  if (scheduleId) return scheduleId

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
  scheduleId = schedule.id as string

  const { error: linkError } = await supabase
    .from('class_orders')
    .update({ schedule_id: scheduleId })
    .eq('id', order.id)
    .is('schedule_id', null)

  if (linkError) throw linkError
  return scheduleId
}

async function ensurePayoutForOrder(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
  params: { razorpayPaymentId: string; transferId?: string | null },
) {
  const gross = Number(order.gross_amount ?? order.amount ?? 0)
  const platformFee = Number(order.platform_fee ?? 0)
  const teacherAmount = Number(order.teacher_amount ?? gross - platformFee)
  const payoutStatus = params.transferId ? 'paid' : 'pending'

  const { data: existingPayout } = await supabase
    .from('payouts')
    .select('id')
    .eq('class_order_id', order.id)
    .maybeSingle()

  if (existingPayout) return

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

/** Idempotent side effects after order is marked paid — safe to re-run on webhook retry. */
async function completePaidOrderSideEffects(
  supabase: ReturnType<typeof getSupabaseAdmin>,
  order: ClassOrderRow,
  params: { razorpayPaymentId: string; transferId?: string | null },
) {
  await ensureScheduleForOrder(supabase, order)
  await ensurePayoutForOrder(supabase, order, params)

  const gross = Number(order.gross_amount ?? order.amount ?? 0)
  const platformFee = Number(order.platform_fee ?? 0)
  const teacherAmount = Number(order.teacher_amount ?? gross - platformFee)

  const [{ data: studentProfile }, { data: teacherProfile }] = await Promise.all([
    supabase.from('profiles').select('full_name').eq('id', order.student_id).maybeSingle(),
    supabase.from('profiles').select('full_name').eq('id', order.teacher_id).maybeSingle(),
  ])

  const studentName = studentProfile?.full_name ?? 'Student'
  const teacherName = teacherProfile?.full_name ?? 'Coach'

  await redeemCouponForOrder(supabase, order)
  await upsertBookingForOrder(supabase, order, gross)

  const academyLink = await enrollInAcademyBatchIfApplicable(supabase, order)

  if (order.thread_id) {
    const { data: existingMessage } = await supabase
      .from('direct_messages')
      .select('id')
      .eq('thread_id', order.thread_id)
      .ilike('content', `%${params.razorpayPaymentId.slice(0, 14)}%`)
      .maybeSingle()

    if (!existingMessage) {
      const input = orderToInput(order, studentName)
      const { error: messageError } = await supabase.from('direct_messages').insert({
        thread_id: order.thread_id,
        sender_id: order.student_id,
        content: buildBookingMessage(input, params.razorpayPaymentId),
      })
      if (messageError) throw new Error(`Failed to post booking message: ${messageError.message}`)
    }
  }

  await notifyEnrollmentParties(
    supabase,
    order,
    studentName,
    teacherName,
    gross,
    teacherAmount,
    academyLink,
  )

  await supabase.from('platform_activity_log').insert({
    user_id: order.student_id,
    role: 'student',
    action: 'enrollment',
    entity_type: 'class_order',
    entity_id: order.id as string,
    status: 'success',
    metadata: { teacher_id: order.teacher_id, gross },
  }).then(({ error }) => {
    if (error?.code !== 'PGRST205' && error?.code !== '42P01' && error) throw error
  })
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

  const wasAlreadyPaid = order.payment_status === 'paid'
  let paidOrder = order

  if (!wasAlreadyPaid) {
    const transferStatus = params.transferId ? 'transferred' : 'not_applicable'

    const { data: claimed, error: claimError } = await supabase
      .from('class_orders')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: params.razorpayPaymentId,
        transfer_status: transferStatus,
      })
      .eq('id', order.id)
      .eq('payment_status', 'pending')
      .select('*')
      .maybeSingle()

    if (claimError) throw claimError

    if (claimed) {
      paidOrder = claimed
    } else {
      const { data: refreshed, error: refreshError } = await supabase
        .from('class_orders')
        .select('*')
        .eq('id', order.id)
        .maybeSingle()

      if (refreshError) throw refreshError
      if (refreshed?.payment_status !== 'paid') {
        throw new Error('Could not complete enrollment for this payment.')
      }
      paidOrder = refreshed
    }
  }

  await completePaidOrderSideEffects(supabase, paidOrder, params)

  return {
    orderId: paidOrder.id as string,
    alreadyFulfilled: wasAlreadyPaid || paidOrder.payment_status === 'paid',
  }
}

export async function getTeacherLinkedAccountId(teacherId: string) {
  const supabase = getSupabaseAdmin()

  const readLinkedAccount = async (table: 'teacher_payout_private' | 'teacher_profiles') => {
    const idCol = table === 'teacher_payout_private' ? 'teacher_id' : 'id'
    const { data, error } = await supabase
      .from(table)
      .select('razorpay_linked_account_id, payout_onboarding_status')
      .eq(idCol, teacherId)
      .maybeSingle()
    return { data, error }
  }

  let { data, error } = await readLinkedAccount('teacher_payout_private')

  if (error && (error.code === 'PGRST205' || error.code === '42P01')) {
    ;({ data, error } = await readLinkedAccount('teacher_profiles'))
  }

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
