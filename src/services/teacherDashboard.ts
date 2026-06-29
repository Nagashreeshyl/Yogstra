import { supabase } from '../lib/supabase'
import { fetchPublishedCompetitions } from './competitionService'
import { fetchTeacherActiveStudentCount } from './bookings'
import { fetchTodaySchedules } from './schedules'
import { fetchTeacherById } from './teachers'
import { fetchTeacherEarningsSnapshot } from './teacherEarnings'
import { fetchUnreadNotificationCount } from './teacherNotifications'
import { fetchMessagingUsers } from './directChat'
import { fetchAcademiesForUser } from './academyService'
import { fetchTeacherPaidStudents, isTeacherClassHour } from './liveClasses'
import { formatTime } from '../utils/format'
import { isTeacherProfileComplete } from '../utils/teacherProfileCompletion'

export type TeacherDashboardTodayClass = {
  id: string
  scheduledAt: string
  timeLabel: string
  batchLabel: string
  studentCount: number
  studentNames: string[]
  classType: '1:1' | 'group'
  isLive: boolean
}

export type TeacherDashboardAttendance = {
  todayScheduled: number
  weeklyPercentage: number | null
  absentToday: string[]
}

export type TeacherDashboardAlert = {
  id: string
  type: 'payment' | 'attendance' | 'competition' | 'assignment'
  title: string
  description: string
  href: string
}

export type TeacherDashboardCompetition = {
  id: string
  name: string
  daysUntil: number
  studentsRegistered: number
  pendingRegistrations: number
  missingDocuments: number
}

export type TeacherDashboardRevenue = {
  monthlyEarnings: number
  pendingFees: number
  pendingPayout: number
}

export type TeacherDashboardMessage = {
  userId: string
  name: string
  avatar: string
  preview: string
  unreadCount: number
  lastMessageAt: string | null
}

export type TeacherDashboardTask = {
  id: string
  title: string
  description: string
  href: string
}

export type TeacherDashboardData = {
  academyName: string | null
  rating: number | null
  studentCount: number
  profileIncomplete: boolean
  todayClasses: TeacherDashboardTodayClass[]
  attendance: TeacherDashboardAttendance
  alerts: TeacherDashboardAlert[]
  competition: TeacherDashboardCompetition | null
  revenue: TeacherDashboardRevenue
  messages: TeacherDashboardMessage[]
  tasks: TeacherDashboardTask[]
  unreadMessages: number
  unreadNotifications: number
}

function getGreetingHour(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getTeacherGreeting(name: string): string {
  return `${getGreetingHour()}, ${name.split(' ')[0] || name}`
}

export function getTeacherTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}

function daysUntilDate(dateStr: string): number {
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000))
}

async function fetchTodayClassesDetailed(teacherId: string): Promise<TeacherDashboardTodayClass[]> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const { data, error } = await supabase
    .from('schedules')
    .select('id, scheduled_at, class_type, duration_minutes, student:profiles!student_id(full_name)')
    .eq('teacher_id', teacherId)
    .gte('scheduled_at', today.toISOString())
    .lt('scheduled_at', tomorrow.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  const grouped = new Map<string, TeacherDashboardTodayClass>()

  for (const row of data ?? []) {
    const scheduledAt = row.scheduled_at as string
    const student = Array.isArray(row.student) ? row.student[0] : row.student
    const studentName = (student as { full_name?: string } | null)?.full_name ?? 'Student'
    const key = scheduledAt

    const existing = grouped.get(key)
    if (existing) {
      existing.studentNames.push(studentName)
      existing.studentCount += 1
      continue
    }

    grouped.set(key, {
      id: row.id as string,
      scheduledAt,
      timeLabel: formatTime(scheduledAt),
      batchLabel: row.class_type === 'group' ? 'Group session' : 'Coaching session',
      studentCount: 1,
      studentNames: [studentName],
      classType: (row.class_type as '1:1' | 'group') ?? '1:1',
      isLive: isTeacherClassHour(scheduledAt, Number(row.duration_minutes ?? 60)),
    })
  }

  return [...grouped.values()]
}

async function fetchWeeklyAttendanceStats(teacherId: string): Promise<{
  weeklyPercentage: number | null
  absentToday: string[]
}> {
  const now = new Date()
  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  weekStart.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('schedules')
    .select('scheduled_at, student:profiles!student_id(full_name)')
    .eq('teacher_id', teacherId)
    .gte('scheduled_at', weekStart.toISOString())
    .lte('scheduled_at', now.toISOString())

  if (error) throw error

  const rows = data ?? []
  const weeklyPercentage =
    rows.length === 0 ? null : Math.min(100, Math.round((rows.length / Math.max(rows.length, 1)) * 100))

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const absentToday: string[] = []

  return { weeklyPercentage, absentToday }
}

async function fetchTeacherPendingScheduleChanges(teacherId: string) {
  const { data, error } = await supabase
    .from('schedule_change_requests')
    .select(`
      id,
      student_id,
      scope,
      current_scheduled_at,
      requested_date,
      requested_time,
      student_note,
      status,
      created_at,
      student:profiles!student_id(full_name)
    `)
    .eq('teacher_id', teacherId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) {
    if (error.code === 'PGRST205' || error.code === '42P01') return []
    throw error
  }

  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student
    return {
      id: row.id as string,
      studentId: row.student_id as string,
      studentName: (student as { full_name?: string } | null)?.full_name ?? 'Student',
      scope: row.scope as string,
      currentScheduledAt: row.current_scheduled_at as string,
      requestedDate: row.requested_date as string,
      requestedTime: row.requested_time as string,
      studentNote: (row.student_note as string | null) ?? null,
      createdAt: row.created_at as string,
    }
  })
}

async function fetchPendingFeeBookings(teacherId: string) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, student_id, payment_status, monthly_fee, student:profiles!student_id(full_name)')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')
    .neq('payment_status', 'paid')

  if (error) throw error
  return (data ?? []).map((row) => {
    const student = Array.isArray(row.student) ? row.student[0] : row.student
    return {
      id: row.id as string,
      studentName: (student as { full_name?: string } | null)?.full_name ?? 'Student',
      paymentStatus: (row.payment_status as string) ?? 'pending',
      monthlyFee: Number(row.monthly_fee ?? 0),
    }
  })
}

async function fetchTeacherCompetitionWidget(
  teacherId: string,
): Promise<TeacherDashboardCompetition | null> {
  const published = await fetchPublishedCompetitions(10)
  const next = published
    .filter((c) => c.startDate)
    .sort((a, b) => new Date(a.startDate!).getTime() - new Date(b.startDate!).getTime())[0]

  if (!next) return null

  const { data: students } = await supabase
    .from('bookings')
    .select('student_id')
    .eq('teacher_id', teacherId)
    .eq('status', 'active')

  const studentIds = (students ?? []).map((s) => s.student_id as string).filter(Boolean)

  let studentsRegistered = 0
  let pendingRegistrations = 0

  if (studentIds.length) {
    const { data: regs } = await supabase
      .from('competition_registrations')
      .select('registrant_id, status, payment_status')
      .eq('competition_id', next.id)
      .in('registrant_id', studentIds)

    for (const reg of regs ?? []) {
      if (reg.status === 'confirmed') studentsRegistered += 1
      else if (reg.status === 'pending') pendingRegistrations += 1
    }
  }

  return {
    id: next.id,
    name: next.name,
    daysUntil: daysUntilDate(next.startDate ?? ''),
    studentsRegistered,
    pendingRegistrations,
    missingDocuments: 0,
  }
}

function buildAlerts(
  pendingBookings: Awaited<ReturnType<typeof fetchPendingFeeBookings>>,
  paidStudents: Awaited<ReturnType<typeof fetchTeacherPaidStudents>>,
  competition: TeacherDashboardCompetition | null,
): TeacherDashboardAlert[] {
  const alerts: TeacherDashboardAlert[] = []

  for (const booking of pendingBookings) {
    alerts.push({
      id: `payment-${booking.id}`,
      type: 'payment',
      title: `${booking.studentName} — payment pending`,
      description: `Coaching fee status: ${booking.paymentStatus}`,
      href: '/dashboard/teacher/students',
    })
  }

  const inactiveStudents = paidStudents.filter((s) => !s.nextSessionAt && !s.isScheduledNow)
  if (inactiveStudents.length > 0 && inactiveStudents.length <= 3) {
    for (const student of inactiveStudents.slice(0, 2)) {
      alerts.push({
        id: `attendance-${student.id}`,
        type: 'attendance',
        title: `${student.name} — no upcoming class`,
        description: 'Schedule a session or check in on their progress.',
        href: `/dashboard/teacher/students`,
      })
    }
  }

  if (competition && competition.daysUntil <= 30) {
    alerts.push({
      id: `competition-${competition.id}`,
      type: 'competition',
      title: `${competition.name} in ${competition.daysUntil} days`,
      description: 'Prepare students and confirm registrations.',
      href: '/dashboard/teacher/students',
    })
  }

  return alerts.slice(0, 6)
}

function buildTasks(
  pendingChanges: Awaited<ReturnType<typeof fetchTeacherPendingScheduleChanges>>,
  profileIncomplete: boolean,
  unreadNotifications: number,
): TeacherDashboardTask[] {
  const tasks: TeacherDashboardTask[] = []

  for (const request of pendingChanges.slice(0, 3)) {
    tasks.push({
      id: `schedule-${request.id}`,
      title: `Approve schedule change — ${request.studentName}`,
      description: request.studentNote?.trim() || 'Review the requested timing update.',
      href: '/dashboard/teacher/schedule',
    })
  }

  if (unreadNotifications > 0) {
    tasks.push({
      id: 'notifications',
      title: `Review ${unreadNotifications} notification${unreadNotifications === 1 ? '' : 's'}`,
      description: 'New bookings and platform updates may need your attention.',
      href: '/dashboard/teacher/notifications',
    })
  }

  if (profileIncomplete) {
    tasks.push({
      id: 'profile',
      title: 'Complete your teacher profile',
      description: 'Finish your profile to appear in Find Teachers.',
      href: '/dashboard/teacher/settings',
    })
  }

  return tasks.slice(0, 5)
}

export async function fetchTeacherDashboard(teacherId: string): Promise<TeacherDashboardData> {
  const [
    teacherProfile,
    studentCount,
    todaySchedules,
    todayClasses,
    earningsSnapshot,
    unreadNotifications,
    messagingUsers,
    academies,
    paidStudents,
    pendingBookings,
    pendingChanges,
    attendanceStats,
    competition,
  ] = await Promise.all([
    fetchTeacherById(teacherId),
    fetchTeacherActiveStudentCount(teacherId),
    fetchTodaySchedules(teacherId),
    fetchTodayClassesDetailed(teacherId),
    fetchTeacherEarningsSnapshot(teacherId),
    fetchUnreadNotificationCount(teacherId),
    fetchMessagingUsers(teacherId, 'teacher').catch(() => []),
    fetchAcademiesForUser(teacherId).catch(() => []),
    fetchTeacherPaidStudents(teacherId).catch(() => []),
    fetchPendingFeeBookings(teacherId),
    fetchTeacherPendingScheduleChanges(teacherId),
    fetchWeeklyAttendanceStats(teacherId),
    fetchTeacherCompetitionWidget(teacherId),
  ])

  const profileIncomplete = teacherProfile?.verified
    ? !isTeacherProfileComplete(teacherProfile)
    : false

  const primaryAcademy = academies.find((a) => !a.isBranch) ?? academies[0] ?? null

  const messages: TeacherDashboardMessage[] = messagingUsers
    .filter((user) => user.threadId && user.lastMessage)
    .sort((a, b) => {
      const aTime = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0
      const bTime = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0
      return bTime - aTime
    })
    .slice(0, 5)
    .map((user) => ({
      userId: user.id,
      name: user.name,
      avatar: user.avatar,
      preview: user.lastMessage ?? '',
      unreadCount: user.unreadCount ?? 0,
      lastMessageAt: user.lastMessageAt ?? null,
    }))

  const unreadMessages = messagingUsers.reduce((sum, user) => sum + (user.unreadCount ?? 0), 0)

  const pendingFees = pendingBookings.reduce((sum, b) => sum + b.monthlyFee, 0)

  return {
    academyName: primaryAcademy?.name ?? null,
    rating: teacherProfile?.rating ?? null,
    studentCount,
    profileIncomplete,
    todayClasses: todayClasses.length > 0 ? todayClasses : todaySchedules.map((cls) => ({
      id: cls.id,
      scheduledAt: `${cls.date}T00:00:00`,
      timeLabel: cls.time,
      batchLabel: cls.type === 'group' ? 'Group session' : 'Coaching session',
      studentCount: cls.studentNames.length,
      studentNames: cls.studentNames,
      classType: cls.type,
      isLive: false,
    })),
    attendance: {
      todayScheduled: todayClasses.length || todaySchedules.length,
      weeklyPercentage: attendanceStats.weeklyPercentage,
      absentToday: attendanceStats.absentToday,
    },
    alerts: buildAlerts(pendingBookings, paidStudents, competition),
    competition,
    revenue: {
      monthlyEarnings: earningsSnapshot.activeMonthlyRecurring,
      pendingFees,
      pendingPayout: earningsSnapshot.totalPendingPayout,
    },
    messages,
    tasks: buildTasks(pendingChanges, profileIncomplete, unreadNotifications),
    unreadMessages,
    unreadNotifications,
  }
}
