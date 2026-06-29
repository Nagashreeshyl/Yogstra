import { supabase } from '../lib/supabase'
import { competitions } from '../lib/constants'
import { fetchStudentActiveBooking } from './bookings'
import { fetchStudentCoachingTeachers, type StudentCoachingTeacher } from './liveClasses'
import { fetchStudentSessionCount } from './schedules'
import { fetchStudentScheduleChangeRequests } from './scheduleChangeRequests'
import { fetchMessagingUsers, fetchDirectMessages } from './directChat'

export type StudentDashboardCoach = {
  id: string
  name: string
  photo: string
}

export type StudentDashboardNextClass = {
  teacherId: string
  teacherName: string
  teacherPhoto: string
  scheduledAt: string
  scheduleId: string
  isLive: boolean
  batchLabel: string
}

export type StudentDashboardPractice = {
  name: string
  durationMinutes: number
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  coachNotes: string
}

export type StudentDashboardCompetition = {
  id: string
  name: string
  city: string
  date: string
  daysUntil: number
  registrationStatus: 'not_registered' | 'registered' | 'pending'
}

export type StudentDashboardProgress = {
  streakWeeks: number
  weeklyHours: number
  sessionsCompleted: number
  weeklySessionCounts: number[]
}

export type StudentDashboardAttendance = {
  percentage: number | null
  monthlyCounts: number[]
  monthLabel: string
}

export type StudentDashboardCoachFeedback = {
  coachId: string
  coachName: string
  message: string
  createdAt: string
}

export type StudentDashboardNotification = {
  id: string
  title: string
  body: string
  createdAt: string
  href?: string
}

export type StudentDashboardData = {
  coach: StudentDashboardCoach | null
  academyName: string | null
  todaysPractice: StudentDashboardPractice | null
  nextClass: StudentDashboardNextClass | null
  competition: StudentDashboardCompetition | null
  attendance: StudentDashboardAttendance
  progress: StudentDashboardProgress
  coachFeedback: StudentDashboardCoachFeedback | null
  notifications: StudentDashboardNotification[]
}

const WEEKDAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

function getGreetingHour(): string {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 17) return 'Good afternoon'
  return 'Good evening'
}

export function getStudentGreeting(name: string): string {
  return `${getGreetingHour()}, ${name.split(' ')[0] || name}`
}

function daysUntilDate(dateStr: string): number {
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return 0
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 86_400_000))
}

function pickNextCompetition(): StudentDashboardCompetition | null {
  const parsed = competitions
    .map((comp) => ({
      ...comp,
      parsedDate: new Date(comp.date),
    }))
    .filter((comp) => !Number.isNaN(comp.parsedDate.getTime()))
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime())

  const next = parsed[0]
  if (!next) return null

  return {
    id: next.id,
    name: next.name,
    city: next.city,
    date: next.date,
    daysUntil: daysUntilDate(next.date),
    registrationStatus: 'not_registered',
  }
}

function derivePractice(
  coach: StudentDashboardCoach | null,
  nextClass: StudentDashboardNextClass | null,
): StudentDashboardPractice | null {
  if (nextClass?.isLive) {
    return {
      name: 'Live class preparation',
      durationMinutes: 15,
      difficulty: 'Intermediate',
      coachNotes: `Join your session with ${nextClass.teacherName} — warm up with sun salutations.`,
    }
  }

  if (nextClass) {
    return {
      name: 'Pre-class mobility flow',
      durationMinutes: 30,
      difficulty: 'Intermediate',
      coachNotes: `Prepare for your class with ${nextClass.teacherName}. Focus on hip openers and breath.`,
    }
  }

  if (coach) {
    return {
      name: 'Daily foundation practice',
      durationMinutes: 20,
      difficulty: 'Beginner',
      coachNotes: `Maintain consistency between sessions with ${coach.name}.`,
    }
  }

  return null
}

function resolveNextClass(
  coaches: StudentCoachingTeacher[],
  nextSchedule: {
    id: string
    teacherId: string
    teacherName: string
    scheduledAt: string
    classType: string
  } | null,
): StudentDashboardNextClass | null {
  const liveCoach = coaches.find((c) => c.isScheduledNow && c.currentSessionAt)
  if (liveCoach?.currentSessionAt) {
    return {
      teacherId: liveCoach.id,
      teacherName: liveCoach.name,
      teacherPhoto: liveCoach.photo,
      scheduledAt: liveCoach.currentSessionAt,
      scheduleId: '',
      isLive: true,
      batchLabel: 'Coaching session',
    }
  }

  const nextCoach = coaches.find((c) => c.nextSessionAt)
  if (nextCoach?.nextSessionAt) {
    return {
      teacherId: nextCoach.id,
      teacherName: nextCoach.name,
      teacherPhoto: nextCoach.photo,
      scheduledAt: nextCoach.nextSessionAt,
      scheduleId: '',
      isLive: false,
      batchLabel: 'Coaching session',
    }
  }

  if (!nextSchedule) return null

  return {
    teacherId: nextSchedule.teacherId,
    teacherName: nextSchedule.teacherName,
    teacherPhoto: '',
    scheduledAt: nextSchedule.scheduledAt,
    scheduleId: nextSchedule.id,
    isLive: false,
    batchLabel: nextSchedule.classType,
  }
}

async function fetchNextStudentSchedule(studentId: string) {
  const { data, error } = await supabase
    .from('schedules')
    .select('id, teacher_id, scheduled_at, class_type, teacher:profiles!teacher_id(full_name)')
    .eq('student_id', studentId)
    .gte('scheduled_at', new Date().toISOString())
    .order('scheduled_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (error) throw error
  if (!data) return null

  const teacher = Array.isArray(data.teacher) ? data.teacher[0] : data.teacher
  return {
    id: data.id as string,
    teacherId: data.teacher_id as string,
    teacherName: (teacher as { full_name?: string } | null)?.full_name ?? 'Your coach',
    scheduledAt: data.scheduled_at as string,
    classType: (data.class_type as string) ?? 'Class session',
  }
}

async function fetchMonthlyAttendance(studentId: string): Promise<StudentDashboardAttendance> {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)

  const { data, error } = await supabase
    .from('schedules')
    .select('scheduled_at')
    .eq('student_id', studentId)
    .gte('scheduled_at', monthStart.toISOString())
    .lte('scheduled_at', monthEnd.toISOString())
    .order('scheduled_at', { ascending: true })

  if (error) throw error

  const rows = data ?? []
  const past = rows.filter((row) => new Date(row.scheduled_at as string) <= now).length
  const total = rows.length
  const percentage = total === 0 ? null : Math.round((past / total) * 100)

  const weeklyBuckets = [0, 0, 0, 0]
  for (const row of rows) {
    const date = new Date(row.scheduled_at as string)
    if (date > now) continue
    const weekIndex = Math.min(3, Math.floor((date.getDate() - 1) / 7))
    weeklyBuckets[weekIndex] += 1
  }

  return {
    percentage,
    monthlyCounts: weeklyBuckets,
    monthLabel: now.toLocaleDateString('en-IN', { month: 'long' }),
  }
}

async function fetchWeeklySessionCounts(studentId: string): Promise<number[]> {
  const end = new Date()
  const start = new Date()
  start.setDate(start.getDate() - 6)
  start.setHours(0, 0, 0, 0)

  const { data, error } = await supabase
    .from('schedules')
    .select('scheduled_at')
    .eq('student_id', studentId)
    .gte('scheduled_at', start.toISOString())
    .lte('scheduled_at', end.toISOString())

  if (error) throw error

  const counts = Array.from({ length: 7 }, () => 0)
  for (const row of data ?? []) {
    const date = new Date(row.scheduled_at as string)
    const dayIndex = (date.getDay() + 6) % 7
    counts[dayIndex] += 1
  }
  return counts
}

async function estimateStreakWeeks(studentId: string): Promise<number> {
  const since = new Date()
  since.setDate(since.getDate() - 56)

  const { data, error } = await supabase
    .from('schedules')
    .select('scheduled_at')
    .eq('student_id', studentId)
    .gte('scheduled_at', since.toISOString())
    .lt('scheduled_at', new Date().toISOString())

  if (error) throw error

  const weekSet = new Set<number>()
  for (const row of data ?? []) {
    const date = new Date(row.scheduled_at as string)
    weekSet.add(Math.floor(date.getTime() / (7 * 86_400_000)))
  }

  let streak = 0
  const currentWeek = Math.floor(Date.now() / (7 * 86_400_000))
  for (let week = currentWeek; week >= currentWeek - 7; week -= 1) {
    if (weekSet.has(week)) streak += 1
    else break
  }
  return streak
}

async function fetchLatestCoachMessage(
  studentId: string,
  coachId: string | undefined,
): Promise<StudentDashboardCoachFeedback | null> {
  if (!coachId) return null

  try {
    const users = await fetchMessagingUsers(studentId, 'student')
    const coach = users.find((u) => u.id === coachId && u.role === 'teacher')
    if (!coach?.threadId) return null

    const messages = await fetchDirectMessages(coach.threadId, studentId)
    const fromCoach = [...messages].reverse().find((msg) => msg.senderId === coachId)
    if (!fromCoach?.content.trim()) return null

    return {
      coachId,
      coachName: coach.name,
      message: fromCoach.content.trim(),
      createdAt: fromCoach.createdAt,
    }
  } catch {
    return null
  }
}

function buildNotifications(
  changeRequests: Awaited<ReturnType<typeof fetchStudentScheduleChangeRequests>>,
): StudentDashboardNotification[] {
  return changeRequests.slice(0, 5).map((req) => ({
    id: req.id,
    title:
      req.status === 'pending'
        ? 'Schedule change pending'
        : req.status === 'approved'
          ? 'Schedule change approved'
          : 'Schedule change update',
    body: req.teacherNote?.trim() || req.studentNote?.trim() || 'Your coach updated a class schedule request.',
    createdAt: req.createdAt,
    href: '/dashboard/student/classes',
  }))
}

export async function fetchStudentDashboard(studentId: string): Promise<StudentDashboardData> {
  const [
    booking,
    coaches,
    nextSchedule,
    sessionsCompleted,
    changeRequests,
    attendance,
    weeklySessionCounts,
    streakWeeks,
  ] = await Promise.all([
    fetchStudentActiveBooking(studentId),
    fetchStudentCoachingTeachers(studentId),
    fetchNextStudentSchedule(studentId),
    fetchStudentSessionCount(studentId),
    fetchStudentScheduleChangeRequests(studentId),
    fetchMonthlyAttendance(studentId),
    fetchWeeklySessionCounts(studentId),
    estimateStreakWeeks(studentId),
  ])

  const primaryCoach = coaches[0]
    ? { id: coaches[0].id, name: coaches[0].name, photo: coaches[0].photo }
    : booking
      ? {
          id: booking.teacherId,
          name: booking.teacherName,
          photo: '',
        }
      : null

  const nextClass = resolveNextClass(coaches, nextSchedule)
  const feedback = primaryCoach
    ? await fetchLatestCoachMessage(studentId, primaryCoach.id)
    : null

  const weeklyHours = weeklySessionCounts.reduce((sum, count) => sum + count, 0)

  return {
    coach: primaryCoach,
    academyName: null,
    todaysPractice: derivePractice(primaryCoach, nextClass),
    nextClass,
    competition: pickNextCompetition(),
    attendance,
    progress: {
      streakWeeks,
      weeklyHours,
      sessionsCompleted,
      weeklySessionCounts,
    },
    coachFeedback: feedback,
    notifications: buildNotifications(changeRequests),
  }
}

export { WEEKDAY_LABELS }
