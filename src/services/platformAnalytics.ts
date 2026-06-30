import { supabase } from '../lib/supabase'
import { isMissingTableError } from '../utils/supabaseErrors'

export type AnalyticsEventName =
  | 'page_view'
  | 'registration'
  | 'enrollment'
  | 'competition_registration'
  | 'program_purchase'
  | 'teacher_view'
  | 'academy_view'
  | 'competition_view'
  | 'search'
  | 'dashboard_view'

/** Fire-and-forget analytics — never throws. */
export async function trackAnalyticsEvent(
  eventName: AnalyticsEventName,
  metadata?: Record<string, unknown>,
) {
  try {
    const { data: session } = await supabase.auth.getSession()
    const userId = session.session?.user.id ?? null

    let role: string | null = null
    if (userId) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .maybeSingle()
      role = (profile?.role as string | undefined) ?? null
    }

    const { error } = await supabase.from('platform_analytics_events').insert({
      event_name: eventName,
      user_id: userId,
      role,
      page_path: typeof window !== 'undefined' ? window.location.pathname : null,
      metadata: metadata ?? {},
    })
    if (error && !isMissingTableError(error)) return
  } catch {
    // Silent
  }
}

export type AnalyticsSummary = {
  dailyActiveUsers: number
  weeklyActiveUsers: number
  monthlyActiveUsers: number
  newRegistrations: number
  enrollments: number
  competitionRegistrations: number
  topTeachers: { name: string; views: number }[]
  topSearches: { term: string; count: number }[]
  eventCounts: { event: string; count: number }[]
}

export async function fetchAnalyticsSummary(days = 30): Promise<AnalyticsSummary> {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceIso = since.toISOString()

  const { data, error } = await supabase
    .from('platform_analytics_events')
    .select('event_name, user_id, metadata, created_at')
    .gte('created_at', sinceIso)
    .order('created_at', { ascending: false })
    .limit(5000)

  if (error) {
    if (isMissingTableError(error)) return emptySummary()
    throw error
  }

  const rows = data ?? []
  const now = Date.now()
  const day = 86400000

  const uniqueUsers = (withinMs: number) => {
    const cutoff = now - withinMs
    return new Set(
      rows
        .filter((r) => r.user_id && new Date(r.created_at as string).getTime() >= cutoff)
        .map((r) => r.user_id as string),
    ).size
  }

  const countEvent = (name: string) => rows.filter((r) => r.event_name === name).length

  const teacherViews = new Map<string, number>()
  const searches = new Map<string, number>()
  const eventCounts = new Map<string, number>()

  for (const row of rows) {
    const name = row.event_name as string
    eventCounts.set(name, (eventCounts.get(name) ?? 0) + 1)
    const meta = (row.metadata ?? {}) as Record<string, unknown>
    if (name === 'teacher_view' && meta.teacherName) {
      const key = String(meta.teacherName)
      teacherViews.set(key, (teacherViews.get(key) ?? 0) + 1)
    }
    if (name === 'search' && meta.term) {
      const key = String(meta.term).toLowerCase()
      searches.set(key, (searches.get(key) ?? 0) + 1)
    }
  }

  return {
    dailyActiveUsers: uniqueUsers(day),
    weeklyActiveUsers: uniqueUsers(7 * day),
    monthlyActiveUsers: uniqueUsers(30 * day),
    newRegistrations: countEvent('registration'),
    enrollments: countEvent('enrollment'),
    competitionRegistrations: countEvent('competition_registration'),
    topTeachers: [...teacherViews.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, views]) => ({ name, views })),
    topSearches: [...searches.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([term, count]) => ({ term, count })),
    eventCounts: [...eventCounts.entries()]
      .sort((a, b) => b[1] - a[1])
      .map(([event, count]) => ({ event, count })),
  }
}

function emptySummary(): AnalyticsSummary {
  return {
    dailyActiveUsers: 0,
    weeklyActiveUsers: 0,
    monthlyActiveUsers: 0,
    newRegistrations: 0,
    enrollments: 0,
    competitionRegistrations: 0,
    topTeachers: [],
    topSearches: [],
    eventCounts: [],
  }
}

export function analyticsToCsv(summary: AnalyticsSummary): string {
  const lines = [
    'Metric,Value',
    `Daily Active Users,${summary.dailyActiveUsers}`,
    `Weekly Active Users,${summary.weeklyActiveUsers}`,
    `Monthly Active Users,${summary.monthlyActiveUsers}`,
    `New Registrations,${summary.newRegistrations}`,
    `Enrollments,${summary.enrollments}`,
    `Competition Registrations,${summary.competitionRegistrations}`,
    '',
    'Event,Count',
    ...summary.eventCounts.map((e) => `${e.event},${e.count}`),
    '',
    'Teacher,Views',
    ...summary.topTeachers.map((t) => `"${t.name}",${t.views}`),
    '',
    'Search Term,Count',
    ...summary.topSearches.map((s) => `"${s.term}",${s.count}`),
  ]
  return lines.join('\n')
}
