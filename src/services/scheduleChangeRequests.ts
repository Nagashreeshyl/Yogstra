import { supabase } from '../lib/supabase'
import {
  fetchActiveClassPurchase,
  classOrderExpiresAt,
  type ClassDuration,
} from './classOrders'
import { formatTime } from '../utils/format'

export type ScheduleChangeScope = '1_day' | '2_days' | '3_days' | 'permanent'
export type ScheduleChangeStatus = 'pending' | 'approved' | 'rejected' | 'cancelled'

export type ScheduleChangeRequest = {
  id: string
  studentId: string
  teacherId: string
  classOrderId: string | null
  scheduleId: string | null
  scope: ScheduleChangeScope
  currentScheduledAt: string
  requestedDate: string
  requestedTime: string
  studentNote: string | null
  status: ScheduleChangeStatus
  teacherNote: string | null
  createdAt: string
  resolvedAt: string | null
  studentName?: string
  teacherName?: string
}

const requestSelect = `
  *,
  student:profiles!student_id(full_name),
  teacher:profiles!teacher_id(full_name)
`

function mapRequest(row: Record<string, unknown>): ScheduleChangeRequest {
  const student = row.student as { full_name?: string } | null
  const teacher = row.teacher as { full_name?: string } | null
  return {
    id: row.id as string,
    studentId: row.student_id as string,
    teacherId: row.teacher_id as string,
    classOrderId: (row.class_order_id as string) ?? null,
    scheduleId: (row.schedule_id as string) ?? null,
    scope: row.scope as ScheduleChangeScope,
    currentScheduledAt: row.current_scheduled_at as string,
    requestedDate: row.requested_date as string,
    requestedTime: row.requested_time as string,
    studentNote: (row.student_note as string) ?? null,
    status: row.status as ScheduleChangeStatus,
    teacherNote: (row.teacher_note as string) ?? null,
    createdAt: row.created_at as string,
    resolvedAt: (row.resolved_at as string) ?? null,
    studentName: student?.full_name,
    teacherName: teacher?.full_name,
  }
}

export const SCHEDULE_CHANGE_SCOPE_LABELS: Record<ScheduleChangeScope, string> = {
  '1_day': '1 day only',
  '2_days': '2 days',
  '3_days': '3 days',
  permanent: 'Permanent (until plan ends)',
}

function scopeDayCount(scope: ScheduleChangeScope): number | null {
  if (scope === '1_day') return 1
  if (scope === '2_days') return 2
  if (scope === '3_days') return 3
  return null
}

export function combineDateAndTime(dateStr: string, timeStr: string): string {
  const iso = new Date(`${dateStr}T${timeStr}`).toISOString()
  if (Number.isNaN(new Date(iso).getTime())) {
    throw new Error('Invalid date or time.')
  }
  return iso
}

function addDaysToDate(dateStr: string, days: number): string {
  const date = new Date(`${dateStr}T12:00:00`)
  date.setDate(date.getDate() + days)
  return date.toISOString().slice(0, 10)
}

export function formatScheduleChangeSummary(request: ScheduleChangeRequest): string {
  const newTime = formatTime(combineDateAndTime(request.requestedDate, request.requestedTime))
  const scopeLabel = SCHEDULE_CHANGE_SCOPE_LABELS[request.scope]
  const startDate = new Date(`${request.requestedDate}T12:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  return `${scopeLabel} from ${startDate} at ${newTime}`
}

export async function fetchStudentScheduleChangeRequests(
  studentId: string,
): Promise<ScheduleChangeRequest[]> {
  const { data, error } = await supabase
    .from('schedule_change_requests')
    .select(requestSelect)
    .eq('student_id', studentId)
    .order('created_at', { ascending: false })
    .limit(20)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => mapRequest(row as Record<string, unknown>))
}

export async function fetchPendingRequestForTeacher(
  studentId: string,
  teacherId: string,
): Promise<ScheduleChangeRequest | null> {
  const { data, error } = await supabase
    .from('schedule_change_requests')
    .select(requestSelect)
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return null
    throw error
  }

  return data ? mapRequest(data as Record<string, unknown>) : null
}

export async function fetchScheduleChangeRequest(
  requestId: string,
): Promise<ScheduleChangeRequest | null> {
  const { data, error } = await supabase
    .from('schedule_change_requests')
    .select(requestSelect)
    .eq('id', requestId)
    .maybeSingle()

  if (error) throw error
  return data ? mapRequest(data as Record<string, unknown>) : null
}

export type ScheduleContext = {
  currentScheduledAt: string | null
  scheduleId: string | null
  classOrderId: string | null
  classType: '1:1' | 'group'
  duration: ClassDuration
  planStartDate: string
  planEndDate: string
  pendingRequest: ScheduleChangeRequest | null
}

export function getScheduleChangeDateBounds(context: Pick<ScheduleContext, 'planStartDate' | 'planEndDate'>) {
  const today = new Date().toISOString().slice(0, 10)
  const min = today > context.planStartDate ? today : context.planStartDate
  return { min, max: context.planEndDate }
}

export function validateScheduleChangeDates(
  context: ScheduleContext,
  scope: ScheduleChangeScope,
  requestedDate: string,
) {
  if (requestedDate < context.planStartDate) {
    throw new Error('Choose a date on or after your coaching plan start.')
  }
  if (requestedDate > context.planEndDate) {
    throw new Error('Choose a date on or before your coaching plan ends.')
  }

  const { min, max } = getScheduleChangeDateBounds(context)
  if (requestedDate < min) {
    throw new Error('Choose today or a future date within your plan.')
  }
  if (requestedDate > max) {
    throw new Error('Choose a date within your coaching plan period.')
  }

  const days = scopeDayCount(scope)
  if (days) {
    const lastDay = addDaysToDate(requestedDate, days - 1)
    if (lastDay > context.planEndDate) {
      throw new Error('This change would extend past the end of your coaching plan.')
    }
  }
}

export async function fetchScheduleContext(
  studentId: string,
  teacherId: string,
): Promise<ScheduleContext | null> {
  const purchase = await fetchActiveClassPurchase(studentId, teacherId)
  if (!purchase) return null

  const { data: order, error: orderError } = await supabase
    .from('class_orders')
    .select('id, schedule_id, class_type, duration, scheduled_at')
    .eq('id', purchase.orderId)
    .maybeSingle()

  if (orderError) throw orderError
  if (!order) return null

  const { data: upcomingSchedule } = await supabase
    .from('schedules')
    .select('id, scheduled_at')
    .eq('student_id', studentId)
    .eq('teacher_id', teacherId)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  const pendingRequest = await fetchPendingRequestForTeacher(studentId, teacherId)

  const planStart = order.scheduled_at as string
  const duration = (order.duration as ClassDuration | null) ?? purchase.duration
  const planEnd = classOrderExpiresAt(planStart, duration)

  const currentScheduledAt =
    (upcomingSchedule?.scheduled_at as string) ??
    (order.scheduled_at as string) ??
    null

  return {
    currentScheduledAt,
    scheduleId:
      (upcomingSchedule?.id as string) ??
      (order.schedule_id as string) ??
      null,
    classOrderId: order.id as string,
    classType: (order.class_type as '1:1' | 'group') ?? '1:1',
    duration,
    planStartDate: planStart.slice(0, 10),
    planEndDate: planEnd.toISOString().slice(0, 10),
    pendingRequest,
  }
}

export async function createScheduleChangeRequest(input: {
  studentId: string
  teacherId: string
  scope: ScheduleChangeScope
  requestedDate: string
  requestedTime: string
  studentNote?: string
}) {
  const context = await fetchScheduleContext(input.studentId, input.teacherId)
  if (!context?.currentScheduledAt) {
    throw new Error('No active class schedule found for this coach.')
  }
  if (context.pendingRequest) {
    throw new Error('You already have a pending timing change request for this coach.')
  }

  validateScheduleChangeDates(context, input.scope, input.requestedDate)

  const { data, error } = await supabase
    .from('schedule_change_requests')
    .insert({
      student_id: input.studentId,
      teacher_id: input.teacherId,
      class_order_id: context.classOrderId,
      schedule_id: context.scheduleId,
      scope: input.scope,
      current_scheduled_at: context.currentScheduledAt,
      requested_date: input.requestedDate,
      requested_time: input.requestedTime,
      student_note: input.studentNote?.trim() || null,
      status: 'pending',
    })
    .select(requestSelect)
    .single()

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') {
      throw new Error('Schedule change requests are not set up. Run supabase/schedule-change-requests.sql.')
    }
    throw error
  }

  const request = mapRequest(data as Record<string, unknown>)
  await createScheduleChangeNotification(request)
  return request
}

async function createScheduleChangeNotification(request: ScheduleChangeRequest) {
  const summary = formatScheduleChangeSummary(request)
  const body = [
    `${request.studentName ?? 'A student'} requested a class timing change.`,
    '',
    `Current: ${formatTime(request.currentScheduledAt)}`,
    `Requested: ${summary}`,
    request.studentNote ? `\nNote: ${request.studentNote}` : '',
  ]
    .filter(Boolean)
    .join('\n')

  const { error } = await supabase.from('teacher_notifications').insert({
    teacher_id: request.teacherId,
    student_id: request.studentId,
    request_id: request.id,
    type: 'schedule_change',
    title: 'Schedule change request',
    body,
  })

  if (error && error.code !== 'PGRST205' && error.code !== '42P01') {
    console.error('createScheduleChangeNotification', error)
  }
}

async function applyApprovedScheduleChange(request: ScheduleChangeRequest) {
  const newScheduledAt = combineDateAndTime(request.requestedDate, request.requestedTime)

  if (request.scope === 'permanent') {
    if (request.classOrderId) {
      const { error } = await supabase
        .from('class_orders')
        .update({ scheduled_at: newScheduledAt })
        .eq('id', request.classOrderId)

      if (error) throw error
    }

    if (request.scheduleId) {
      const { error } = await supabase
        .from('schedules')
        .update({ scheduled_at: newScheduledAt })
        .eq('id', request.scheduleId)

      if (error) throw error
    }

    return
  }

  const days = scopeDayCount(request.scope)
  if (!days) return

  let classType: '1:1' | 'group' = '1:1'
  if (request.classOrderId) {
    const { data: order } = await supabase
      .from('class_orders')
      .select('class_type')
      .eq('id', request.classOrderId)
      .maybeSingle()
    if (order?.class_type) {
      classType = order.class_type as '1:1' | 'group'
    }
  }

  const rows = Array.from({ length: days }, (_, index) => {
    const dateStr = addDaysToDate(request.requestedDate, index)
    return {
      teacher_id: request.teacherId,
      student_id: request.studentId,
      class_type: classType,
      scheduled_at: combineDateAndTime(dateStr, request.requestedTime),
      duration_minutes: 60,
    }
  })

  const { error } = await supabase.from('schedules').insert(rows)
  if (error) throw error
}

export async function approveScheduleChangeRequest(
  requestId: string,
  teacherId: string,
  teacherNote?: string,
) {
  const request = await fetchScheduleChangeRequest(requestId)
  if (!request) throw new Error('Request not found.')
  if (request.teacherId !== teacherId) throw new Error('Not allowed.')
  if (request.status !== 'pending') throw new Error('This request was already resolved.')

  await applyApprovedScheduleChange(request)

  const { error } = await supabase
    .from('schedule_change_requests')
    .update({
      status: 'approved',
      teacher_note: teacherNote?.trim() || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw error
}

export async function rejectScheduleChangeRequest(
  requestId: string,
  teacherId: string,
  teacherNote?: string,
) {
  const request = await fetchScheduleChangeRequest(requestId)
  if (!request) throw new Error('Request not found.')
  if (request.teacherId !== teacherId) throw new Error('Not allowed.')
  if (request.status !== 'pending') throw new Error('This request was already resolved.')

  const { error } = await supabase
    .from('schedule_change_requests')
    .update({
      status: 'rejected',
      teacher_note: teacherNote?.trim() || null,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId)

  if (error) throw error
}

export async function cancelScheduleChangeRequest(requestId: string, studentId: string) {
  const { error } = await supabase
    .from('schedule_change_requests')
    .update({
      status: 'cancelled',
      resolved_at: new Date().toISOString(),
    })
    .eq('id', requestId)
    .eq('student_id', studentId)
    .eq('status', 'pending')

  if (error) throw error
}
