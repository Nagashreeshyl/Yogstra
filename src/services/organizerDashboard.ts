import type {
  Competition,
  CompetitionAnnouncement,
  CompetitionCategory,
  CompetitionCertificate,
  CompetitionEvent,
  CompetitionJudge,
  CompetitionRegistration,
  CompetitionResult,
} from '../domain/competition/models'
import { fetchOrganizerCompetitions } from './competitionService'
import { fetchCompetitionRegistrations, fetchRegistrationStats } from './registrationService'
import {
  fetchCompetitionJudges,
  fetchCompetitionResults,
  fetchCompetitionScores,
} from './judgeService'
import { fetchCompetitionCertificates } from './certificateService'
import { fetchCompetitionEvents, fetchCompetitionCategories } from './competitionService'
import { supabase } from '../lib/supabase'
import { mapCompetitionAnnouncement } from '../utils/competitionMappers'

export type OrganizerCompetitionBucket = 'active' | 'upcoming' | 'completed'

export type OrganizerDashboardCompetitionGroup = {
  active: Competition[]
  upcoming: Competition[]
  completed: Competition[]
}

export type OrganizerRegistrationSummary = {
  total: number
  pendingApprovals: number
  paymentsPending: number
  confirmed: number
  registrations: CompetitionRegistration[]
}

export type OrganizerJudgeSummary = {
  assigned: number
  unassignedCategories: number
  conflicts: number
  judges: CompetitionJudge[]
  categories: CompetitionCategory[]
}

export type OrganizerScheduleSummary = {
  todayEvents: CompetitionEvent[]
  upcomingEvents: CompetitionEvent[]
  conflicts: { eventA: string; eventB: string; reason: string }[]
  lateStarts: CompetitionEvent[]
}

export type OrganizerResultsSummary = {
  pendingApprovals: number
  completedCategories: number
  published: number
  results: CompetitionResult[]
}

export type OrganizerCertificateSummary = {
  pendingGeneration: number
  generated: number
  issued: number
  certificates: CompetitionCertificate[]
}

export type OrganizerAnalytics = {
  registrationsByCategory: { category: string; count: number }[]
  revenue: number
  attendanceRate: number
  academyCount: number
  judgeCompletionRate: number
}

export type OrganizerDashboardData = {
  competitions: OrganizerDashboardCompetitionGroup
  allCompetitions: Competition[]
  selectedCompetition: Competition | null
  registrations: OrganizerRegistrationSummary
  judges: OrganizerJudgeSummary
  schedule: OrganizerScheduleSummary
  results: OrganizerResultsSummary
  certificates: OrganizerCertificateSummary
  announcements: CompetitionAnnouncement[]
  analytics: OrganizerAnalytics
}

const ACTIVE_STATUSES = new Set([
  'registration_open',
  'registration_closed',
  'in_progress',
  'scoring',
  'results_pending',
])

const UPCOMING_STATUSES = new Set(['draft', 'published'])

const COMPLETED_STATUSES = new Set(['completed', 'archived'])

export function bucketCompetitions(competitions: Competition[]): OrganizerDashboardCompetitionGroup {
  const active: Competition[] = []
  const upcoming: Competition[] = []
  const completed: Competition[] = []

  for (const competition of competitions) {
    if (COMPLETED_STATUSES.has(competition.status)) {
      completed.push(competition)
    } else if (ACTIVE_STATUSES.has(competition.status)) {
      active.push(competition)
    } else if (UPCOMING_STATUSES.has(competition.status)) {
      upcoming.push(competition)
    } else {
      upcoming.push(competition)
    }
  }

  return { active, upcoming, completed }
}

function pickDefaultCompetition(competitions: Competition[]): Competition | null {
  if (competitions.length === 0) return null
  const buckets = bucketCompetitions(competitions)
  return buckets.active[0] ?? buckets.upcoming[0] ?? buckets.completed[0] ?? competitions[0]
}

function detectEventConflicts(events: CompetitionEvent[]) {
  const conflicts: OrganizerScheduleSummary['conflicts'] = []

  for (let i = 0; i < events.length; i++) {
    for (let j = i + 1; j < events.length; j++) {
      const a = events[i]
      const b = events[j]
      const aStart = new Date(a.startsAt).getTime()
      const aEnd = a.endsAt ? new Date(a.endsAt).getTime() : aStart + 3_600_000
      const bStart = new Date(b.startsAt).getTime()
      const bEnd = b.endsAt ? new Date(b.endsAt).getTime() : bStart + 3_600_000

      const overlaps = aStart < bEnd && bStart < aEnd
      const sameVenue =
        (a.venue && b.venue && a.venue === b.venue) ||
        (a.stage && b.stage && a.stage === b.stage)

      if (overlaps && sameVenue) {
        conflicts.push({
          eventA: a.name,
          eventB: b.name,
          reason: 'Overlapping session at the same venue or stage',
        })
      }
    }
  }

  return conflicts
}

function detectJudgeConflicts(judges: CompetitionJudge[], events: CompetitionEvent[]) {
  let conflicts = 0
  const byUser = new Map<string, CompetitionJudge[]>()

  for (const judge of judges) {
    const list = byUser.get(judge.userId) ?? []
    list.push(judge)
    byUser.set(judge.userId, list)
  }

  for (const [, assignments] of byUser) {
    if (assignments.length > 1) {
      const eventIds = assignments.map((j) => j.eventId).filter(Boolean)
      if (new Set(eventIds).size > 1 && eventIds.length > 1) conflicts += 1
    }
  }

  for (const judge of judges) {
    if (!judge.eventId) continue
    const event = events.find((e) => e.id === judge.eventId)
    if (!event) continue
    const overlapping = events.filter((other) => {
      if (other.id === event.id) return false
      const aStart = new Date(event.startsAt).getTime()
      const aEnd = event.endsAt ? new Date(event.endsAt).getTime() : aStart + 3_600_000
      const bStart = new Date(other.startsAt).getTime()
      const bEnd = other.endsAt ? new Date(other.endsAt).getTime() : bStart + 3_600_000
      return aStart < bEnd && bStart < aEnd
    })
    const sameUserOther = judges.filter(
      (j) => j.userId === judge.userId && j.eventId && overlapping.some((o) => o.id === j.eventId),
    )
    if (sameUserOther.length > 0) conflicts += 1
  }

  return conflicts
}

async function fetchAllAnnouncements(competitionId: string) {
  const { data, error } = await supabase
    .from('competition_announcements')
    .select('*')
    .eq('competition_id', competitionId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return (data ?? []).map(mapCompetitionAnnouncement)
}

function buildEmptyDashboard(competitions: Competition[]): OrganizerDashboardData {
  return {
    competitions: bucketCompetitions(competitions),
    allCompetitions: competitions,
    selectedCompetition: null,
    registrations: {
      total: 0,
      pendingApprovals: 0,
      paymentsPending: 0,
      confirmed: 0,
      registrations: [],
    },
    judges: {
      assigned: 0,
      unassignedCategories: 0,
      conflicts: 0,
      judges: [],
      categories: [],
    },
    schedule: {
      todayEvents: [],
      upcomingEvents: [],
      conflicts: [],
      lateStarts: [],
    },
    results: {
      pendingApprovals: 0,
      completedCategories: 0,
      published: 0,
      results: [],
    },
    certificates: {
      pendingGeneration: 0,
      generated: 0,
      issued: 0,
      certificates: [],
    },
    announcements: [],
    analytics: {
      registrationsByCategory: [],
      revenue: 0,
      attendanceRate: 0,
      academyCount: 0,
      judgeCompletionRate: 0,
    },
  }
}

export async function fetchOrganizerDashboard(
  userId: string,
  selectedCompetitionId?: string | null,
): Promise<OrganizerDashboardData> {
  const allCompetitions = await fetchOrganizerCompetitions(userId)
  const competitions = bucketCompetitions(allCompetitions)

  const selectedCompetition =
    (selectedCompetitionId
      ? allCompetitions.find((c) => c.id === selectedCompetitionId)
      : pickDefaultCompetition(allCompetitions)) ?? null

  if (!selectedCompetition) {
    return buildEmptyDashboard(allCompetitions)
  }

  const competitionId = selectedCompetition.id

  const [
    registrationStats,
    registrations,
    judges,
    categories,
    events,
    results,
    certificates,
    scores,
    announcements,
  ] = await Promise.all([
    fetchRegistrationStats(competitionId),
    fetchCompetitionRegistrations(competitionId),
    fetchCompetitionJudges(competitionId),
    fetchCompetitionCategories(competitionId),
    fetchCompetitionEvents(competitionId),
    fetchCompetitionResults(competitionId),
    fetchCompetitionCertificates(competitionId),
    fetchCompetitionScores(competitionId),
    fetchAllAnnouncements(competitionId),
  ])

  const pendingApprovals = registrations.filter((r) => r.status === 'pending').length
  const paymentsPending = registrations.filter((r) => r.paymentStatus === 'unpaid').length

  const assignedCategories = new Set(
    judges.filter((j) => j.categoryId && j.status !== 'removed').map((j) => j.categoryId),
  )
  const unassignedCategories = categories.filter((c) => !assignedCategories.has(c.id)).length

  const now = new Date()
  const todayStart = new Date(now)
  todayStart.setHours(0, 0, 0, 0)
  const todayEnd = new Date(todayStart)
  todayEnd.setDate(todayEnd.getDate() + 1)

  const todayEvents = events.filter((event) => {
    const start = new Date(event.startsAt)
    return start >= todayStart && start < todayEnd
  })

  const upcomingEvents = events
    .filter((event) => new Date(event.startsAt) > now)
    .slice(0, 6)

  const lateStarts = events.filter(
    (event) =>
      event.status === 'scheduled' && new Date(event.startsAt).getTime() < now.getTime(),
  )

  const scheduleConflicts = detectEventConflicts(events)
  const judgeConflicts = detectJudgeConflicts(judges, events)

  const pendingResultApprovals = results.filter((r) => r.status === 'provisional').length
  const publishedResults = results.filter((r) => r.status === 'published').length
  const completedCategories = new Set(
    results.filter((r) => r.status !== 'provisional').map((r) => r.categoryId),
  ).size

  const draftCerts = certificates.filter((c) => c.status === 'draft').length
  const issuedCerts = certificates.filter((c) => c.status === 'issued').length

  const revenue = registrations.reduce((sum, reg) => {
    if (reg.paymentStatus === 'paid' || reg.paymentStatus === 'partial') {
      return sum + (reg.paymentAmount ?? selectedCompetition.entryFee)
    }
    return sum
  }, 0)

  const academyIds = new Set(
    registrations.map((r) => r.academyId).filter(Boolean) as string[],
  )

  const submittedScores = scores.filter((s) => s.status === 'submitted' || s.status === 'locked')
  const judgeCompletionRate =
    judges.length === 0 ? 0 : Math.round((submittedScores.length / Math.max(judges.length, 1)) * 100)

  const categoryCounts = categories.map((category) => ({
    category: category.name,
    count: registrations.filter((r) => r.categoryId === category.id).length,
  }))

  const checkedIn = registrations.length > 0 ? registrationStats.confirmedRegistrations : 0
  const attendanceRate =
    registrationStats.totalParticipants === 0
      ? 0
      : Math.round((checkedIn / registrationStats.totalParticipants) * 100)

  return {
    competitions,
    allCompetitions,
    selectedCompetition,
    registrations: {
      total: registrationStats.totalRegistrations,
      pendingApprovals,
      paymentsPending,
      confirmed: registrationStats.confirmedRegistrations,
      registrations,
    },
    judges: {
      assigned: judges.filter((j) => j.status === 'active' || j.status === 'invited').length,
      unassignedCategories,
      conflicts: judgeConflicts,
      judges,
      categories,
    },
    schedule: {
      todayEvents,
      upcomingEvents,
      conflicts: scheduleConflicts,
      lateStarts,
    },
    results: {
      pendingApprovals: pendingResultApprovals,
      completedCategories,
      published: publishedResults,
      results,
    },
    certificates: {
      pendingGeneration: draftCerts,
      generated: draftCerts + issuedCerts,
      issued: issuedCerts,
      certificates,
    },
    announcements,
    analytics: {
      registrationsByCategory: categoryCounts,
      revenue,
      attendanceRate,
      academyCount: academyIds.size,
      judgeCompletionRate,
    },
  }
}

export function getOrganizerGreeting(name: string): string {
  const hour = new Date().getHours()
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return `${timeGreeting}, ${name.split(' ')[0] || name}`
}

export function getOrganizerTodayLabel(): string {
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
}
