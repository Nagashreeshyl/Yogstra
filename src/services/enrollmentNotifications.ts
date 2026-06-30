import { supabase } from '../lib/supabase'
import { isMissingTableError } from '../utils/supabaseErrors'

export type EnrollmentNotification = {
  id: string
  title: string
  body: string
  href?: string
  createdAt: string
  read: boolean
}

export async function fetchEnrollmentNotifications(
  userId: string,
  limit = 10,
): Promise<EnrollmentNotification[]> {
  const { data, error } = await supabase
    .from('enrollment_notifications')
    .select('id, title, body, href, created_at, read_at')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    if (isMissingTableError(error)) return []
    throw error
  }

  return (data ?? []).map((row) => ({
    id: row.id as string,
    title: row.title as string,
    body: row.body as string,
    href: (row.href as string | null) ?? undefined,
    createdAt: row.created_at as string,
    read: row.read_at != null,
  }))
}

export async function markEnrollmentNotificationRead(notificationId: string) {
  const { error } = await supabase
    .from('enrollment_notifications')
    .update({ read_at: new Date().toISOString() })
    .eq('id', notificationId)

  if (error) {
    if (isMissingTableError(error)) return
    throw error
  }
}
