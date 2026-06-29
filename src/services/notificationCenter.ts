import { supabase } from '../lib/supabase'
import {
  fetchTeacherNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeToTeacherNotifications,
} from './teacherNotifications'
import {
  buildStudentCompetitionNotifications,
  fetchStudentCompetitionHome,
} from './studentCompetitionExperience'
import { DEFAULT_COMPETITION_FILTERS } from './studentCompetitionExperience'

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

export async function fetchNotificationsForUser(
  userId: string,
  role: 'student' | 'teacher' | 'admin',
): Promise<AppNotification[]> {
  if (role === 'teacher' || role === 'admin') {
    const rows = await fetchTeacherNotifications(userId)
    return rows.map((n) => ({
      id: n.id,
      title: n.title,
      body: n.body,
      href: n.orderId ? '/dashboard/teacher/earnings' : '/dashboard/teacher/notifications',
      createdAt: n.createdAt,
      read: n.readAt !== null,
      source: 'teacher' as const,
    }))
  }

  const home = await fetchStudentCompetitionHome(userId, DEFAULT_COMPETITION_FILTERS)
  const competitionNotes = buildStudentCompetitionNotifications(home.all, home.registrations)
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
