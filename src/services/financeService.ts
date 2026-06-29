import { supabase } from '../lib/supabase'
import { fetchCommissionPercent } from './platformSettings'
import { fetchTeacherEarningsSnapshot } from './teacherEarnings'

export type FinanceTransaction = {
  id: string
  type: 'class_payment' | 'competition_fee' | 'payout' | 'refund'
  amountInr: number
  status: string
  description: string
  createdAt: string
  counterpartyName?: string
}

export type StudentFinanceSummary = {
  totalPaid: number
  pendingPayments: number
  transactions: FinanceTransaction[]
  couponsApplied: number
}

export type TeacherFinanceSummary = {
  monthlyEarnings: number
  pendingPayout: number
  pendingFees: number
  commissionPercent: number
  transactions: FinanceTransaction[]
}

export type AcademyFinanceSummary = {
  totalCollected: number
  pendingCollections: number
  teacherPayouts: number
  transactions: FinanceTransaction[]
}

export async function fetchStudentFinanceSummary(studentId: string): Promise<StudentFinanceSummary> {
  const { data: orders, error } = await supabase
    .from('class_orders')
    .select(`
      id,
      amount,
      gross_amount,
      payment_status,
      created_at,
      teacher:profiles!teacher_id(full_name),
      coupon_id
    `)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(100)

  if (error) throw error

  const rows = orders ?? []
  let totalPaid = 0
  let pendingPayments = 0
  let couponsApplied = 0

  const transactions: FinanceTransaction[] = rows.map((row) => {
    const amount = Number(row.gross_amount ?? row.amount ?? 0)
    const status = String(row.payment_status ?? 'pending')
    if (status === 'paid') totalPaid += amount
    else pendingPayments += amount
    if (row.coupon_id) couponsApplied += 1

    const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher
    return {
      id: row.id as string,
      type: 'class_payment',
      amountInr: amount,
      status,
      description: 'Class purchase',
      createdAt: row.created_at as string,
      counterpartyName: (teacher as { full_name?: string } | null)?.full_name,
    }
  })

  const { data: compRegs } = await supabase
    .from('competition_registrations')
    .select('id, payment_status, payment_amount, created_at, competitions(name)')
    .eq('registrant_id', studentId)
    .order('created_at', { ascending: false })
    .limit(50)

  for (const reg of compRegs ?? []) {
    const amount = Number(reg.payment_amount ?? 0)
    const status = String(reg.payment_status ?? 'pending')
    if (status === 'paid') totalPaid += amount
    else if (amount > 0) pendingPayments += amount

    const comp = Array.isArray(reg.competitions) ? reg.competitions[0] : reg.competitions
    transactions.push({
      id: reg.id as string,
      type: 'competition_fee',
      amountInr: amount,
      status,
      description: `Competition: ${(comp as { name?: string } | null)?.name ?? 'Registration'}`,
      createdAt: reg.created_at as string,
    })
  }

  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return { totalPaid, pendingPayments, transactions, couponsApplied }
}

export async function fetchTeacherFinanceSummary(teacherId: string): Promise<TeacherFinanceSummary> {
  const [snapshot, commissionPercent, payoutRows] = await Promise.all([
    fetchTeacherEarningsSnapshot(teacherId),
    fetchCommissionPercent(),
    supabase
      .from('payouts')
      .select('id, amount, status, created_at, period')
      .eq('teacher_id', teacherId)
      .order('created_at', { ascending: false })
      .limit(50),
  ])

  if (payoutRows.error) throw payoutRows.error

  const transactions: FinanceTransaction[] = (payoutRows.data ?? []).map((p) => ({
    id: p.id as string,
    type: 'payout',
    amountInr: Number(p.amount ?? 0),
    status: String(p.status ?? 'pending'),
    description: `Payout ${p.period ?? ''}`.trim(),
    createdAt: p.created_at as string,
  }))

  const { data: orders } = await supabase
    .from('class_orders')
    .select('id, amount, gross_amount, teacher_amount, payment_status, created_at')
    .eq('teacher_id', teacherId)
    .eq('payment_status', 'paid')
    .order('created_at', { ascending: false })
    .limit(50)

  for (const order of orders ?? []) {
    transactions.push({
      id: order.id as string,
      type: 'class_payment',
      amountInr: Number(order.teacher_amount ?? order.gross_amount ?? order.amount ?? 0),
      status: 'paid',
      description: 'Class earnings',
      createdAt: order.created_at as string,
    })
  }

  transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())

  return {
    monthlyEarnings: snapshot.activeMonthlyRecurring,
    pendingPayout: snapshot.totalPendingPayout,
    pendingFees: snapshot.totalIncome - snapshot.totalPaidOut - snapshot.totalPendingPayout,
    commissionPercent,
    transactions,
  }
}

export async function fetchAcademyFinanceSummary(academyId: string): Promise<AcademyFinanceSummary> {
  const { data: teachers, error: teacherError } = await supabase
    .from('teacher_academies')
    .select('teacher_id')
    .eq('academy_id', academyId)
    .eq('status', 'active')

  if (teacherError) throw teacherError

  const teacherIds = (teachers ?? []).map((t) => t.teacher_id as string)
  if (!teacherIds.length) {
    return { totalCollected: 0, pendingCollections: 0, teacherPayouts: 0, transactions: [] }
  }

  const { data: orders, error: orderError } = await supabase
    .from('class_orders')
    .select('id, amount, gross_amount, payment_status, created_at, teacher_id, teacher:profiles!teacher_id(full_name)')
    .in('teacher_id', teacherIds)
    .order('created_at', { ascending: false })
    .limit(100)

  if (orderError) throw orderError

  let totalCollected = 0
  let pendingCollections = 0

  const transactions: FinanceTransaction[] = (orders ?? []).map((row) => {
    const amount = Number(row.gross_amount ?? row.amount ?? 0)
    const status = String(row.payment_status ?? 'pending')
    if (status === 'paid') totalCollected += amount
    else pendingCollections += amount

    const teacher = Array.isArray(row.teacher) ? row.teacher[0] : row.teacher
    return {
      id: row.id as string,
      type: 'class_payment',
      amountInr: amount,
      status,
      description: 'Academy class payment',
      createdAt: row.created_at as string,
      counterpartyName: (teacher as { full_name?: string } | null)?.full_name,
    }
  })

  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount, status')
    .in('teacher_id', teacherIds)

  const teacherPayouts = (payouts ?? [])
    .filter((p) => p.status === 'paid')
    .reduce((sum, p) => sum + Number(p.amount ?? 0), 0)

  return { totalCollected, pendingCollections, teacherPayouts, transactions }
}
