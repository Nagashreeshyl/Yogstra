import { supabase } from '../lib/supabase'
import { fetchTeacherMonthlyEarnings } from './bookings'
import { mapPayout } from '../utils/mappers'

export type TeacherEarningsRow = {
  id: string
  kind: 'payment' | 'payout'
  label: string
  detail: string
  grossAmount: number
  commissionAmount: number
  netAmount: number
  amount: number
  status: string
  date: string
}

export type TeacherEarningsSnapshot = {
  totalIncome: number
  totalCommission: number
  totalPaidOut: number
  totalPendingPayout: number
  activeMonthlyRecurring: number
  commissionPercent: number | null
  latestPaymentLabel: string | null
  history: TeacherEarningsRow[]
}

function studentName(student: { full_name?: string | null } | { full_name?: string | null }[] | null) {
  if (!student) return 'Student'
  const row = Array.isArray(student) ? student[0] : student
  return row?.full_name ?? 'Student'
}

function formatClassDetail(classType: string | null, duration: string | null) {
  const typeLabel = classType === 'group' ? 'Group coaching' : '1-on-1 coaching'
  const durationLabel = duration === 'week' ? '1 week' : '1 month'
  return `${typeLabel} · ${durationLabel}`
}

export async function fetchTeacherEarningsSnapshot(
  teacherId: string,
): Promise<TeacherEarningsSnapshot> {
  const [ordersResult, payoutsResult, activeMonthlyRecurring, settingsResult] = await Promise.all([
    supabase
      .from('class_orders')
      .select(
        'id, amount, gross_amount, platform_fee, teacher_amount, commission_percent, payment_status, class_type, duration, created_at, student:profiles!student_id(full_name)',
      )
      .eq('teacher_id', teacherId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false }),
    supabase
      .from('payouts')
      .select('*, teacher:profiles!teacher_id (*), student:profiles!student_id (*)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false }),
    fetchTeacherMonthlyEarnings(teacherId),
    supabase.from('platform_settings').select('commission_percent').eq('id', 'default').maybeSingle(),
  ])

  if (ordersResult.error && ordersResult.error.code !== 'PGRST205' && ordersResult.error.code !== '42P01') {
    throw ordersResult.error
  }
  if (payoutsResult.error) throw payoutsResult.error

  const orders = ordersResult.error ? [] : (ordersResult.data ?? [])
  const payouts = payoutsResult.data ?? []

  let totalIncome = 0
  let totalCommission = 0

  const paymentRows: TeacherEarningsRow[] = orders.map((order) => {
    const gross = Number(order.gross_amount ?? order.amount ?? 0)
    const commission = Number(order.platform_fee ?? 0)
    const net = Number(order.teacher_amount ?? gross - commission)
    totalIncome += gross
    totalCommission += commission

    return {
      id: `order-${order.id}`,
      kind: 'payment',
      label: studentName(order.student),
      detail: formatClassDetail(order.class_type as string, order.duration as string | null),
      grossAmount: gross,
      commissionAmount: commission,
      netAmount: net,
      amount: net,
      status: 'Received',
      date: order.created_at as string,
    }
  })

  let totalPaidOut = 0
  let totalPendingPayout = 0

  const payoutRows: TeacherEarningsRow[] = payouts.map((row) => {
    const payout = mapPayout(row)
    const gross = payout.grossAmount ?? payout.amount
    const commission = payout.commissionAmount ?? 0
    const net = payout.teacherAmount ?? payout.amount

    if (payout.status === 'Paid') totalPaidOut += net
    else totalPendingPayout += net

    return {
      id: `payout-${payout.id}`,
      kind: 'payout',
      label: payout.studentName ?? payout.period,
      detail: payout.status === 'Paid' ? 'Paid to your account' : 'Payout pending',
      grossAmount: gross,
      commissionAmount: commission,
      netAmount: net,
      amount: net,
      status: payout.status,
      date: row.created_at as string,
    }
  })

  const history = [...paymentRows, ...payoutRows].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  const latestPayment = history[0]
  const latestPaymentLabel = latestPayment
    ? new Date(latestPayment.date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : null

  return {
    totalIncome,
    totalCommission,
    totalPaidOut,
    totalPendingPayout,
    activeMonthlyRecurring,
    commissionPercent: settingsResult.data?.commission_percent != null
      ? Number(settingsResult.data.commission_percent)
      : null,
    latestPaymentLabel,
    history,
  }
}
