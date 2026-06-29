import { supabase } from '../lib/supabase'
import {
  fetchTeacherNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToTeacherNotifications,
} from './teacherNotifications'
import { fetchUserCertificates } from './certificateService'
import {
  buildStudentCompetitionNotifications,
  fetchStudentCompetitionHome,
  DEFAULT_COMPETITION_FILTERS,
} from './studentCompetitionExperience'

export type AppNotification = {
  id: string
  title: string
  body: string
  href?: string
  createdAt: string
  read: boolean
  source: 'teacher' | 'competition' | 'system'
}

export type NotificationPreferences = {
  inApp: boolean
  email: boolean
  push: boolean
  categories: {
    bookings: boolean
    competitions: boolean
    messages: boolean
    payouts: boolean
  }
}

const PREFS_KEY = 'yogstra-notification-preferences'

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  inApp: true,
  email: true,
  push: false,
  categories: {
    bookings: true,
    competitions: true,
    messages: true,
    payouts: true,
  },
}

export function loadNotificationPreferences(): NotificationPreferences {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES
    return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(raw) }
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES
  }
}

export function saveNotificationPreferences(prefs: NotificationPreferences) {
  localStorage.setItem(PREFS_KEY, JSON.stringify(prefs))
}

async function fetchJudgeAssignmentNotifications(userId: string): Promise<AppNotification[]> {
  const { data, error } = await supabase
    .from('competition_judges')
    .select('id, competition_id, status, created_at, competition:competitions!competition_id(name)')
    .eq('user_id', userId)
    .in('status', ['invited', 'active'])
    .order('created_at', { ascending: false })
    .limit(10)

  if (error) return []

  const readIds = loadJudgeNotificationReadIds(userId)

  return (data ?? []).map((row) => {
    const competition = Array.isArray(row.competition) ? row.competition[0] : row.competition
    const competitionName = (competition as { name?: string })?.name ?? 'Competition'
    const id = `judge-${row.id}`
    return {
      id,
      title: 'Judge assignment',
      body: `You were assigned to judge ${competitionName}.`,
      href: '/dashboard/judge',
      createdAt: row.created_at as string,
      read: readIds.has(id),
      source: 'competition' as const,
    }
  })
}

function loadJudgeNotificationReadIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`yogstra-judge-notif-read:${userId}`)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveJudgeNotificationReadIds(userId: string, ids: Set<string>) {
  localStorage.setItem(`yogstra-judge-notif-read:${userId}`, JSON.stringify([...ids]))
}

export async function fetchNotificationsForUser(
  userId: string,
  role: 'student' | 'teacher' | 'admin',
): Promise<AppNotification[]> {
  if (role === 'teacher' || role === 'admin') {
    const [rows, judgeNotes] = await Promise.all([
      fetchTeacherNotifications(userId),
      fetchJudgeAssignmentNotifications(userId),
    ])
    const teacherNotes = rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.orderId ? '/dashboard/teacher/earnings' : '/dashboard/teacher/notifications',
      createdAt: n.createdAt,
      read: n.readAt !== null,
      source: 'teacher' as const,
    }))
    return [...judgeNotes, ...teacherNotes].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    )
  }

  const [home, certificates] = await Promise.all([
    fetchStudentCompetitionHome(userId, DEFAULT_COMPETITION_FILTERS),
    fetchUserCertificates(userId),
  ])
  const issuedCertificateCompetitionIds = new Set(
    certificates.filter((c) => c.status === 'issued' && !c.revokedAt).map((c) => c.competitionId),
  )
  const competitionNotes = buildStudentCompetitionNotifications(
    home.all,
    home.registrations,
    issuedCertificateCompetitionIds,
  )
  const readIds = loadStudentReadNotificationIds(userId)

  return competitionNotes.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body,
    href: n.href,
    createdAt: n.createdAt,
    read: readIds.has(n.id),
    source: 'competition' as const,
  }))
}

function loadStudentReadNotificationIds(userId: string): Set<string> {
  try {
    const raw = localStorage.getItem(`yogstra-student-notif-read:${userId}`)
    return new Set(raw ? (JSON.parse(raw) as string[]) : [])
  } catch {
    return new Set()
  }
}

function saveStudentReadNotificationIds(userId: string, ids: Set<string>) {
  localStorage.setItem(`yogstra-student-notif-read:${userId}`, JSON.stringify([...ids]))
}

export async function markNotificationReadForUser(
  userId: string,
  role: 'student' | 'teacher' | 'admin',
  notificationId: string,
) {
  if (role === 'teacher' || role === 'admin') {
    if (notificationId.startsWith('judge-')) {
      const ids = loadJudgeNotificationReadIds(userId)
      ids.add(notificationId)
      saveJudgeNotificationReadIds(userId, ids)
      return
    }
    await markNotificationRead(notificationId)
    return
  }

  const ids = loadStudentReadNotificationIds(userId)
  ids.add(notificationId)
  saveStudentReadNotificationIds(userId, ids)
}

export async function markAllNotificationsReadForUser(
  userId: string,
  role: 'student' | 'teacher' | 'admin',
) {
  if (role === 'teacher' || role === 'admin') {
    await markAllNotificationsRead(userId)
    const notes = await fetchNotificationsForUser(userId, role)
    saveJudgeNotificationReadIds(userId, new Set(notes.filter((n) => n.id.startsWith('judge-')).map((n) => n.id)))
    return
  }

  const notes = await fetchNotificationsForUser(userId, role)
  saveStudentReadNotificationIds(userId, new Set(notes.map((n) => n.id)))
}

export async function fetchUnreadNotificationCountForUser(
  userId: string,
  role: 'student' | 'teacher' | 'admin',
): Promise<number> {
  const notes = await fetchNotificationsForUser(userId, role)
  return notes.filter((n) => !n.read).length
}

export function subscribeToNotifications(
  userId: string,
  role: 'student' | 'teacher' | 'admin',
  onUpdate: () => void,
) {
  if (role === 'teacher' || role === 'admin') {
    return subscribeToTeacherNotifications(userId, onUpdate)
  }

  const channel = supabase
    .channel(`student-notifications-${userId}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'competition_registrations', filter: `registrant_id=eq.${userId}` },
      () => onUpdate(),
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'competition_announcements' },
      () => onUpdate(),
    )
    .subscribe()

  return () => {
    void supabase.removeChannel(channel)
  }
}
