import { supabase } from '../lib/supabase'
import type { ClassDuration, ClassType } from './classOrders'
import { ensureDirectChat, sendDirectMessage } from './directChat'

export type CouponAvailability = 'active' | 'expired' | 'depleted' | 'inactive'

export type TeacherCoupon = {
  id: string
  teacherId: string
  code: string
  classType: ClassType
  duration: ClassDuration
  discountPercent: number
  isActive: boolean
  validUntil: string | null
  maxUses: number | null
  useCount: number
  createdAt: string
  sentCount?: number
}

export type CouponDelivery = {
  id: string
  couponId: string
  studentId: string
  sentAt: string
  usedAt: string | null
}

function mapCoupon(row: Record<string, unknown>): TeacherCoupon {
  return {
    id: row.id as string,
    teacherId: row.teacher_id as string,
    code: row.code as string,
    classType: row.class_type as ClassType,
    duration: row.duration as ClassDuration,
    discountPercent: Number(row.discount_percent),
    isActive: Boolean(row.is_active),
    validUntil: (row.valid_until as string) ?? null,
    maxUses: row.max_uses != null ? Number(row.max_uses) : null,
    useCount: Number(row.use_count ?? 0),
    createdAt: row.created_at as string,
  }
}

function buildCouponCode(teacherName: string) {
  const prefix = teacherName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'YOGA'
  const suffix = Math.random().toString(36).slice(2, 8).toUpperCase()
  return `${prefix}-${suffix}`
}

function classTypeLabel(classType: ClassType) {
  return classType === '1:1' ? '1-on-1' : 'Group (1-to-many)'
}

function durationLabel(duration: ClassDuration) {
  return duration === 'week' ? '1 week' : '1 month'
}

export function getCouponAvailability(
  coupon: Pick<TeacherCoupon, 'isActive' | 'validUntil' | 'maxUses' | 'useCount'>,
): CouponAvailability {
  if (!coupon.isActive) return 'inactive'
  if (coupon.validUntil && new Date(coupon.validUntil) <= new Date()) return 'expired'
  if (coupon.maxUses != null && coupon.useCount >= coupon.maxUses) return 'depleted'
  return 'active'
}

export function formatCouponSummary(
  coupon: Pick<TeacherCoupon, 'classType' | 'duration' | 'discountPercent'>,
) {
  return `${coupon.discountPercent}% off ${classTypeLabel(coupon.classType)} · ${durationLabel(coupon.duration)}`
}

export function formatCouponLimits(
  coupon: Pick<TeacherCoupon, 'validUntil' | 'maxUses' | 'useCount'>,
) {
  const parts: string[] = []

  if (coupon.validUntil) {
    const expiry = new Date(coupon.validUntil)
    if (expiry <= new Date()) {
      parts.push('Expired')
    } else {
      parts.push(
        `Valid until ${expiry.toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        })}`,
      )
    }
  }

  if (coupon.maxUses != null) {
    const remaining = Math.max(0, coupon.maxUses - coupon.useCount)
    parts.push(`${remaining} of ${coupon.maxUses} redemptions left`)
  }

  return parts.length ? parts.join(' · ') : 'No expiry · unlimited redemptions'
}

export function buildCouponChatMessage(
  coupon: Pick<
    TeacherCoupon,
    'code' | 'classType' | 'duration' | 'discountPercent' | 'validUntil' | 'maxUses' | 'useCount'
  >,
  teacherName: string,
) {
  const lines = [
    '🎟️ Yogstra Coupon',
    `Code: ${coupon.code}`,
    formatCouponSummary(coupon),
    formatCouponLimits(coupon),
    `From ${teacherName}`,
    '',
    'Use this code when you book your next online class in chat (Buy Online Class).',
  ]
  return lines.join('\n')
}

async function deactivateCoupon(couponId: string) {
  await supabase.from('teacher_coupons').update({ is_active: false }).eq('id', couponId)
}

function assertCouponUsable(coupon: TeacherCoupon) {
  const availability = getCouponAvailability(coupon)
  if (availability === 'expired') {
    void deactivateCoupon(coupon.id)
    throw new Error('This coupon has expired.')
  }
  if (availability === 'depleted') {
    void deactivateCoupon(coupon.id)
    throw new Error('This coupon has reached its redemption limit.')
  }
  if (availability !== 'active') {
    throw new Error('This coupon is no longer active.')
  }
}

export async function fetchTeacherCoupons(teacherId: string): Promise<TeacherCoupon[]> {
  const { data, error } = await supabase
    .from('teacher_coupons')
    .select('*')
    .eq('teacher_id', teacherId)
    .order('created_at', { ascending: false })

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    if (error.code === '42703' || error.message?.includes('valid_until')) return []
    throw error
  }

  const coupons = (data ?? []).map((row) => mapCoupon(row as Record<string, unknown>))
  if (coupons.length === 0) return []

  const { data: deliveries } = await supabase
    .from('coupon_deliveries')
    .select('coupon_id')
    .in(
      'coupon_id',
      coupons.map((c) => c.id),
    )

  const counts = new Map<string, number>()
  for (const row of deliveries ?? []) {
    const id = row.coupon_id as string
    counts.set(id, (counts.get(id) ?? 0) + 1)
  }

  return coupons.map((c) => ({ ...c, sentCount: counts.get(c.id) ?? 0 }))
}

export async function generateTeacherCoupon(params: {
  teacherId: string
  teacherName: string
  classType: ClassType
  duration: ClassDuration
  discountPercent: number
  validForDays?: number | null
  maxUses?: number | null
}): Promise<TeacherCoupon> {
  const { teacherId, teacherName, classType, duration, discountPercent, validForDays, maxUses } =
    params

  if (discountPercent <= 0 || discountPercent > 100) {
    throw new Error('Discount must be between 1 and 100 percent.')
  }

  if (validForDays != null && (!Number.isInteger(validForDays) || validForDays <= 0)) {
    throw new Error('Validity must be at least 1 day.')
  }

  if (maxUses != null && (!Number.isInteger(maxUses) || maxUses <= 0)) {
    throw new Error('Max redemptions must be at least 1.')
  }

  const validUntil =
    validForDays != null
      ? new Date(Date.now() + validForDays * 24 * 60 * 60 * 1000).toISOString()
      : null

  let lastError: unknown = null
  for (let attempt = 0; attempt < 5; attempt++) {
    const code = buildCouponCode(teacherName)
    const row: Record<string, unknown> = {
      teacher_id: teacherId,
      code,
      class_type: classType,
      duration,
      discount_percent: discountPercent,
    }
    if (validUntil) row.valid_until = validUntil
    if (maxUses != null) row.max_uses = maxUses

    const { data, error } = await supabase.from('teacher_coupons').insert(row).select('*').single()

    if (!error && data) return mapCoupon(data as Record<string, unknown>)
    if (error?.code !== '23505') {
      lastError = error
      break
    }
    lastError = error
  }

  if (lastError && typeof lastError === 'object' && lastError !== null) {
    const e = lastError as { code?: string; message?: string }
    if (e.code === 'PGRST205' || e.code === '42P01') {
      throw new Error('Coupons are not set up. Run supabase/teacher-coupons.sql in Supabase.')
    }
    if (e.code === '42703' || e.message?.includes('valid_until')) {
      throw new Error(
        'Coupon limits are not set up. Run supabase/teacher-coupons-limits.sql in Supabase.',
      )
    }
    throw new Error(e.message ?? 'Could not generate coupon.')
  }

  throw new Error('Could not generate a unique coupon code. Please try again.')
}

export async function sendCouponToStudents(params: {
  coupon: TeacherCoupon
  teacherId: string
  teacherName: string
  studentIds: string[]
}): Promise<{ sent: number; skipped: number }> {
  const { coupon, teacherId, teacherName, studentIds } = params

  if (getCouponAvailability(coupon) !== 'active') {
    throw new Error('This coupon is expired or deactivated and cannot be sent.')
  }

  const uniqueIds = [...new Set(studentIds)]
  if (uniqueIds.length === 0) return { sent: 0, skipped: 0 }

  const message = buildCouponChatMessage(coupon, teacherName)
  let sent = 0
  let skipped = 0

  for (const studentId of uniqueIds) {
    const { data: existing } = await supabase
      .from('coupon_deliveries')
      .select('id')
      .eq('coupon_id', coupon.id)
      .eq('student_id', studentId)
      .maybeSingle()

    if (existing) {
      skipped++
      continue
    }

    const { error: deliveryError } = await supabase.from('coupon_deliveries').insert({
      coupon_id: coupon.id,
      student_id: studentId,
    })

    if (deliveryError) {
      if (deliveryError.code === '23505') {
        skipped++
        continue
      }
      throw deliveryError
    }

    try {
      const { threadId } = await ensureDirectChat(teacherId, studentId)
      await sendDirectMessage(threadId, teacherId, message)
      sent++
    } catch {
      sent++
    }
  }

  return { sent, skipped }
}

export async function validateStudentCoupon(params: {
  code: string
  studentId: string
  teacherId: string
  classType: ClassType
  duration: ClassDuration
}): Promise<{ coupon: TeacherCoupon; deliveryId: string; discountedAmount: (base: number) => number }> {
  const normalized = params.code.trim().toUpperCase()
  if (!normalized) throw new Error('Enter a coupon code.')

  const { data: couponRow, error } = await supabase
    .from('teacher_coupons')
    .select('*')
    .eq('code', normalized)
    .eq('teacher_id', params.teacherId)
    .eq('is_active', true)
    .maybeSingle()

  if (error) {
    if (error.code === '42703' || error.message?.includes('valid_until')) {
      throw new Error('Coupon limits are not set up. Ask your teacher to contact support.')
    }
    throw error
  }
  if (!couponRow) throw new Error('Invalid or expired coupon code.')

  const coupon = mapCoupon(couponRow as Record<string, unknown>)
  assertCouponUsable(coupon)

  if (coupon.classType !== params.classType) {
    throw new Error(`This coupon is for ${classTypeLabel(coupon.classType)} classes only.`)
  }
  if (coupon.duration !== params.duration) {
    throw new Error(`This coupon is for ${durationLabel(coupon.duration)} bookings only.`)
  }

  const { data: delivery, error: deliveryError } = await supabase
    .from('coupon_deliveries')
    .select('id, used_at')
    .eq('coupon_id', coupon.id)
    .eq('student_id', params.studentId)
    .maybeSingle()

  if (deliveryError) throw deliveryError
  if (!delivery) throw new Error('This coupon was not sent to your account.')
  if (delivery.used_at) throw new Error('This coupon has already been used.')

  return {
    coupon,
    deliveryId: delivery.id as string,
    discountedAmount: (base: number) =>
      Math.max(0, Math.round(base * (1 - coupon.discountPercent / 100))),
  }
}

export async function markCouponUsed(deliveryId: string, orderId: string) {
  const { error: rpcError } = await supabase.rpc('redeem_coupon', {
    p_delivery_id: deliveryId,
    p_order_id: orderId,
  })

  if (!rpcError) return

  if (rpcError.code !== 'PGRST202' && !rpcError.message?.includes('redeem_coupon')) {
    throw rpcError
  }

  const { error } = await supabase
    .from('coupon_deliveries')
    .update({ used_at: new Date().toISOString(), order_id: orderId })
    .eq('id', deliveryId)
    .is('used_at', null)

  if (error) throw error
}
