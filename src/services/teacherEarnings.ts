import { supabase } from '../lib/supabase'
import { fetchTeacherMonthlyEarnings } from './bookings'
import { mapPayout } from '../utils/mappers'

export type TeacherEarningsRow = {
  id: string
  kind: 'payment' | 'payout'
  label: string
  detail: string
  amount: number
  status: string
  date: string
}

export type TeacherEarningsSnapshot = {
  thisMonthReceived: number
  activeMonthlyRecurring: number
  totalRecords: number
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
  const monthStart = new Date()
  monthStart.setDate(1)
  monthStart.setHours(0, 0, 0, 0)

  const [ordersResult, payoutsResult, activeMonthlyRecurring] = await Promise.all([
    supabase
      .from('class_orders')
      .select(
        'id, amount, payment_status, class_type, duration, created_at, student:profiles!student_id(full_name)',
      )
      .eq('teacher_id', teacherId)
      .eq('payment_status', 'paid')
      .order('created_at', { ascending: false }),
    supabase
      .from('payouts')
      .select('*, teacher:profiles!teacher_id (*)')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false }),
    fetchTeacherMonthlyEarnings(teacherId),
  ])

  if (ordersResult.error && ordersResult.error.code !== 'PGRST205' && ordersResult.error.code !== '42P01') {
    throw ordersResult.error
  }
  if (payoutsResult.error) throw payoutsResult.error

  const orders = ordersResult.error ? [] : (ordersResult.data ?? [])

  let thisMonthReceived = 0
  for (const order of orders) {
    const created = new Date(order.created_at as string)
    if (created >= monthStart) {
      thisMonthReceived += Number(order.amount ?? 0)
    }
  }

  const paymentRows: TeacherEarningsRow[] = orders.map((order) => ({
    id: `order-${order.id}`,
    kind: 'payment',
    label: studentName(order.student),
    detail: formatClassDetail(order.class_type as string, order.duration as string | null),
    amount: Number(order.amount ?? 0),
    status: 'Paid',
    date: order.created_at as string,
  }))

  const payoutRows: TeacherEarningsRow[] = (payoutsResult.data ?? []).map((row) => {
    const payout = mapPayout(row)
    return {
      id: `payout-${payout.id}`,
      kind: 'payout',
      label: payout.period,
      detail: 'Platform payout',
      amount: payout.amount,
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
    thisMonthReceived,
    activeMonthlyRecurring,
    totalRecords: history.length,
    latestPaymentLabel,
    history,
  }
}
