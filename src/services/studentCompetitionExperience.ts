import type { Competition, CompetitionCategory, CompetitionRegistration, CompetitionResult } from '../domain/competition/models'
import {
  fetchPublishedCompetitions,
  fetchCompetitionById,
  fetchCompetitionSummary,
  fetchCompetitionAnnouncements,
  fetchCompetitionCategories,
} from './competitionService'
import { fetchUserRegistrations, fetchCompetitionParticipants } from './registrationService'
import { fetchPublishedResults, fetchCompetitionJudges, fetchCompetitionScores } from './judgeService'
import { fetchUserCertificates } from './certificateService'
import { fetchSubjectRankingHistory, fetchStudentRankings, fetchAcademyRankings } from './rankingService'

export type StudentCompetitionListItem = Competition & {
  daysUntil: number | null
  registrationOpen: boolean
  isRegistered: boolean
  registrationStatus: CompetitionRegistration['status'] | null
  ageGroups: string[]
}

export type CompetitionListFilters = {
  search: string
  ageGroup?: string
  state?: string
  country?: string
  organizer?: string
  registrationOpen?: boolean
  format?: 'online' | 'offline' | ''
  priceMax?: number
  sort: 'nearest' | 'newest' | 'popular' | 'closing_soon'
}

export const DEFAULT_COMPETITION_FILTERS: CompetitionListFilters = {
  search: '',
  sort: 'nearest',
}

export type StudentCompetitionNotification = {
  id: string
  title: string
  body: string
  type:
    | 'registration'
    | 'documents'
    | 'payment'
    | 'schedule'
    | 'checkin'
    | 'starting'
    | 'results'
    | 'certificate'
    | 'ranking'
  href: string
  createdAt: string
}

export type CompetitionTimelineStage = {
  id: string
  label: string
  description: string
  status: 'completed' | 'current' | 'upcoming'
  dateLabel?: string
}

function daysUntilDate(dateStr: string | null): number | null {
  if (!dateStr) return null
  const target = new Date(dateStr)
  if (Number.isNaN(target.getTime())) return null
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  target.setHours(0, 0, 0, 0)
  return Math.ceil((target.getTime() - now.getTime()) / 86_400_000)
}

function enrichCompetition(
  competition: Competition,
  registrations: CompetitionRegistration[],
  ageGroups: string[] = [],
): StudentCompetitionListItem {
  const reg = registrations.find((r) => r.competitionId === competition.id)
  return {
    ...competition,
    daysUntil: daysUntilDate(competition.startDate),
    registrationOpen: competition.status === 'registration_open',
    isRegistered: Boolean(reg && ['pending', 'confirmed', 'waitlisted'].includes(reg.status)),
    registrationStatus: reg?.status ?? null,
    ageGroups,
  }
}

function applyFilters(items: StudentCompetitionListItem[], filters: CompetitionListFilters) {
  let result = items

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false) ||
        (c.state?.toLowerCase().includes(q) ?? false) ||
        (c.organizerName?.toLowerCase().includes(q) ?? false),
    )
  }

  if (filters.state) result = result.filter((c) => c.state === filters.state)
  if (filters.country) result = result.filter((c) => c.country === filters.country)
  if (filters.organizer) result = result.filter((c) => c.organizerName === filters.organizer)
  if (filters.registrationOpen) result = result.filter((c) => c.registrationOpen)
  if (filters.priceMax !== undefined) result = result.filter((c) => c.entryFee <= filters.priceMax!)
  if (filters.ageGroup) {
    result = result.filter((c) => c.ageGroups.includes(filters.ageGroup!))
  }
  if (filters.format === 'online') {
    result = result.filter((c) => c.format === 'online')
  } else if (filters.format === 'offline') {
    result = result.filter((c) => c.format !== 'online')
  }

  switch (filters.sort) {
    case 'newest':
      result = [...result].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      )
      break
    case 'closing_soon':
      result = [...result].sort((a, b) => {
        const da = daysUntilDate(a.registrationDeadline) ?? 999
        const db = daysUntilDate(b.registrationDeadline) ?? 999
        return da - db
      })
      break
    case 'popular':
      result = [...result].sort(
        (a, b) => (b.maxParticipants ?? 0) - (a.maxParticipants ?? 0),
      )
      break
    default:
      result = [...result].sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
  }

  return result
}

export async function fetchStudentCompetitionHome(userId: string, filters: CompetitionListFilters) {
  const [published, registrations] = await Promise.all([
    fetchPublishedCompetitions(100),
    fetchUserRegistrations(userId),
  ])

  const categoryGroups = await Promise.all(
    published.map(async (c) => {
      const categories = await fetchCompetitionCategories(c.id)
      const ageGroups = [
        ...new Set(categories.map((cat) => cat.ageGroup).filter(Boolean)),
      ] as string[]
      return { id: c.id, ageGroups }
    }),
  )

  const ageMap = Object.fromEntries(categoryGroups.map((g) => [g.id, g.ageGroups]))
  let items = published.map((c) =>
    enrichCompetition(c, registrations, ageMap[c.id] ?? []),
  )

  items = applyFilters(items, filters)

  const registered = items.filter((c) => c.isRegistered)
  const featured = items
    .filter((c) => c.scope === 'national' || c.scope === 'international' || c.registrationOpen)
    .slice(0, 4)
  const upcoming = items
    .filter((c) => c.daysUntil !== null && c.daysUntil >= 0)
    .slice(0, 12)
  const recommended = items.filter((c) => !c.isRegistered && c.registrationOpen).slice(0, 6)
  const recent = [...items].slice(0, 6)

  const filterOptions = {
    states: [...new Set(published.map((c) => c.state).filter(Boolean))] as string[],
    countries: [...new Set(published.map((c) => c.country).filter(Boolean))] as string[],
    organizers: [
      ...new Set(published.map((c) => c.organizerName).filter(Boolean)),
    ] as string[],
  }

  return {
    featured,
    upcoming,
    recommended,
    recent,
    registered,
    all: items,
    registrations,
    filterOptions,
  }
}

export async function fetchStudentCompetitionDetail(competitionId: string, userId: string) {
  const summary = await fetchCompetitionSummary(competitionId)
  if (!summary) return null

  const [registrations, judges, participants] = await Promise.all([
    fetchUserRegistrations(userId),
    fetchCompetitionJudges(competitionId),
    fetchCompetitionParticipants(competitionId),
  ])

  const registration = registrations.find(
    (r) =>
      r.competitionId === competitionId &&
      r.status !== 'rejected' &&
      r.status !== 'cancelled',
  ) ?? null
  const activeJudges = judges.filter((j) => j.status === 'active')

  const faqs = (summary.competition.settings?.faqs as { q: string; a: string }[] | undefined) ?? []
  const gallery = (summary.competition.settings?.gallery as string[] | undefined) ?? []

  return {
    ...summary,
    registration,
    judges: activeJudges,
    participantCount: participants.length,
    faqs,
    gallery,
    daysUntil: daysUntilDate(summary.competition.startDate),
    registrationOpen: summary.competition.status === 'registration_open',
  }
}

export async function fetchStudentMyCompetitions(userId: string) {
  const registrations = await fetchUserRegistrations(userId)
  const competitions = await Promise.all(
    registrations.map(async (reg) => {
      const competition = await fetchCompetitionById(reg.competitionId)
      if (!competition) return null
      return {
        competition: enrichCompetition(competition, registrations),
        registration: reg,
      }
    }),
  )
  return competitions.filter(Boolean) as {
    competition: StudentCompetitionListItem
    registration: CompetitionRegistration
  }[]
}

export async function fetchStudentPreparation(competitionId: string, userId: string) {
  const detail = await fetchStudentCompetitionDetail(competitionId, userId)
  if (!detail) return null

  const participants = await fetchCompetitionParticipants(competitionId)
  const myParticipant = participants.find((p) => p.studentId === userId)

  const documentsComplete = myParticipant?.documentsVerified ?? false
  const registrationConfirmed = detail.registration?.status === 'confirmed'
  const paymentComplete =
    detail.registration?.paymentStatus === 'paid' ||
    detail.registration?.paymentStatus === 'waived'

  const checklist = [
    { id: 'register', label: 'Complete registration', done: Boolean(detail.registration) },
    { id: 'payment', label: 'Pay entry fee', done: paymentComplete },
    { id: 'documents', label: 'Submit required documents', done: documentsComplete },
    { id: 'verify', label: 'Organizer verification', done: documentsComplete && registrationConfirmed },
    { id: 'practice', label: 'Attend practice sessions', done: false },
    { id: 'attendance', label: 'Confirm attendance', done: myParticipant?.status === 'checked_in' },
  ]

  const readiness = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100,
  )

  const timeline = buildCompetitionTimeline(
    detail.competition,
    detail.registration,
    myParticipant?.documentsVerified ?? false,
    myParticipant?.status,
  )

  return {
    detail,
    myParticipant,
    checklist,
    readiness,
    countdownDays: detail.daysUntil,
    timeline,
    emergencyContact: myParticipant?.metadata?.emergencyContact as
      | { name: string; phone: string; relation: string }
      | undefined,
  }
}

export function buildCompetitionTimeline(
  competition: Competition,
  registration: CompetitionRegistration | null,
  participantVerified: boolean,
  participantStatus?: string,
): CompetitionTimelineStage[] {
  const stages: CompetitionTimelineStage[] = [
    {
      id: 'registration',
      label: 'Registration',
      description: 'Sign up for your category',
      status: registration ? 'completed' : competition.status === 'registration_open' ? 'current' : 'upcoming',
      dateLabel: competition.registrationDeadline ?? undefined,
    },
    {
      id: 'verification',
      label: 'Verification',
      description: 'Documents reviewed by organizer',
      status: participantVerified ? 'completed' : registration ? 'current' : 'upcoming',
    },
    {
      id: 'schedule',
      label: 'Schedule published',
      description: 'Performance times announced',
      status:
        ['registration_closed', 'in_progress', 'scoring', 'completed'].includes(competition.status)
          ? 'completed'
          : registration?.status === 'confirmed'
            ? 'current'
            : 'upcoming',
    },
    {
      id: 'checkin',
      label: 'Check-in',
      description: 'Arrive and confirm attendance',
      status:
        participantStatus === 'checked_in' || participantStatus === 'performing'
          ? 'completed'
          : competition.status === 'in_progress'
            ? 'current'
            : 'upcoming',
    },
    {
      id: 'performance',
      label: 'Performance',
      description: 'Take the floor and compete',
      status:
        participantStatus === 'completed'
          ? 'completed'
          : competition.status === 'in_progress'
            ? 'current'
            : 'upcoming',
      dateLabel: competition.startDate ?? undefined,
    },
    {
      id: 'judging',
      label: 'Judging',
      description: 'Scores submitted by judges',
      status:
        competition.status === 'scoring'
          ? 'current'
          : ['completed', 'results_pending'].includes(competition.status)
            ? 'completed'
            : 'upcoming',
    },
    {
      id: 'results',
      label: 'Results',
      description: 'Placements published',
      status:
        competition.status === 'completed'
          ? 'completed'
          : competition.status === 'results_pending'
            ? 'current'
            : 'upcoming',
    },
    {
      id: 'certificates',
      label: 'Certificates',
      description: 'Download your certificate',
      status: competition.status === 'completed' ? 'current' : 'upcoming',
    },
  ]

  if (!stages.some((s) => s.status === 'current')) {
    const next = stages.find((s) => s.status === 'upcoming')
    if (next) next.status = 'current'
  }

  return stages
}

export async function fetchStudentLiveStatus(competitionId: string, userId: string) {
  const detail = await fetchStudentCompetitionDetail(competitionId, userId)
  if (!detail) return null

  const categoryId = detail.registration?.categoryId
  const allParticipants = await fetchCompetitionParticipants(competitionId)
  const participants = categoryId
    ? allParticipants.filter((p) => p.categoryId === categoryId)
    : []
  const myParticipant = allParticipants.find((p) => p.studentId === userId) ?? null

  const announcements = (await fetchCompetitionAnnouncements(competitionId))
    .filter((a) => a.status === 'published')
    .filter((a) => ['all', 'participants', 'public'].includes(a.audience))
    .slice(0, 8)

  const queuePosition = myParticipant
    ? participants.findIndex((p) => p.id === myParticipant.id) + 1
    : null

  const currentStage =
    detail.competition.status === 'in_progress'
      ? 'Performances in progress'
      : detail.competition.status === 'scoring'
        ? 'Judging'
        : 'Waiting to start'

  const liveResultsEnabled = Boolean(detail.competition.settings?.liveResults)
  const scores =
    liveResultsEnabled && myParticipant
      ? (await fetchCompetitionScores(competitionId)).filter(
          (s) => s.participantId === myParticipant.id && s.status === 'submitted',
        )
      : []

  return {
    detail,
    participants,
    myParticipant,
    announcements,
    currentStage,
    queuePosition,
    scores,
    emergencyContact: myParticipant?.metadata?.emergencyContact as
      | { name: string; phone: string; relation: string }
      | undefined,
  }
}

export async function fetchStudentCompetitionResults(competitionId: string, userId: string) {
  const results = await fetchPublishedResults(competitionId)
  const participants = await fetchCompetitionParticipants(competitionId)
  const myParticipant = participants.find((p) => p.studentId === userId)

  if (!myParticipant) {
    return { myResult: null, categoryResults: [], overallResults: results, judgeComments: [], myParticipant: null }
  }

  const myResult = results.find((r) => r.participantId === myParticipant.id) ?? null
  const categoryResults = results.filter((r) => r.categoryId === myParticipant.categoryId)

  const scores = (await fetchCompetitionScores(competitionId)).filter(
    (s) => s.participantId === myParticipant.id && s.status === 'submitted',
  )
  const judgeComments = scores.map((s) => s.comments).filter(Boolean) as string[]

  return { myResult, categoryResults, overallResults: results, judgeComments, myParticipant }
}

export async function fetchStudentResultsHub(userId: string) {
  const myCompetitions = await fetchStudentMyCompetitions(userId)
  const rows = await Promise.all(
    myCompetitions.map(async ({ competition, registration }) => {
      const { myResult, judgeComments, categoryResults } = await fetchStudentCompetitionResults(
        competition.id,
        userId,
      )
      if (!myResult) return null
      const categoryRank =
        categoryResults.findIndex((r) => r.participantId === myResult.participantId) + 1
      return { competition, registration, result: myResult, judgeComments, categoryRank }
    }),
  )
  return rows.filter(Boolean) as {
    competition: StudentCompetitionListItem
    registration: CompetitionRegistration
    result: CompetitionResult
    judgeComments: string[]
    categoryRank: number
  }[]
}

export async function fetchStudentCertificatesPage(userId: string) {
  return fetchUserCertificates(userId)
}

export async function fetchStudentRankingsPage(userId: string) {
  const [studentRankings, history, academyRankings] = await Promise.all([
    fetchStudentRankings(),
    fetchSubjectRankingHistory('student', userId),
    fetchAcademyRankings(),
  ])

  const mine = (scope: string) =>
    studentRankings.find((r) => r.subjectId === userId && r.scope === scope)?.rank ?? null

  const bestRank =
    history.length > 0 ? Math.min(...history.map((h) => h.rank)) : null
  const currentRank = mine('student')

  return {
    studentRank: currentRank,
    categoryRank: null,
    academyRank: academyRankings.find((r) => r.subjectId === userId)?.rank ?? null,
    stateRank: mine('state'),
    nationalRank: mine('national'),
    bestRank,
    currentRank,
    history,
    leaderboard: studentRankings.slice(0, 20),
  }
}

export function buildStudentCompetitionNotifications(
  items: StudentCompetitionListItem[],
  registrations: CompetitionRegistration[],
  issuedCertificateCompetitionIds?: Set<string>,
): StudentCompetitionNotification[] {
  const notifications: StudentCompetitionNotification[] = []

  for (const reg of registrations) {
    const competition = items.find((c) => c.id === reg.competitionId)
    if (!competition) continue

    if (reg.status === 'confirmed') {
      notifications.push({
        id: `reg-confirmed-${reg.id}`,
        title: 'Registration approved',
        body: `You're confirmed for ${competition.name}.`,
        type: 'registration',
        href: `/dashboard/student/competitions/${competition.id}/preparation`,
        createdAt: reg.confirmedAt ?? reg.submittedAt,
      })
    }

    if (reg.status === 'rejected') {
      notifications.push({
        id: `reg-rejected-${reg.id}`,
        title: 'Registration rejected',
        body: `Your registration for ${competition.name} was not approved.`,
        type: 'registration',
        href: `/dashboard/student/competitions/${competition.id}`,
        createdAt: reg.updatedAt,
      })
    }

    if (reg.status === 'pending') {
      notifications.push({
        id: `docs-${reg.id}`,
        title: 'Documents may be required',
        body: `Complete any pending items for ${competition.name}.`,
        type: 'documents',
        href: `/dashboard/student/competitions/register/${competition.id}`,
        createdAt: reg.submittedAt,
      })
    }

    if (reg.paymentStatus === 'unpaid') {
      notifications.push({
        id: `payment-${reg.id}`,
        title: 'Payment required',
        body: `Complete payment for ${competition.name}.`,
        type: 'payment',
        href: `/dashboard/student/competitions/register/${competition.id}`,
        createdAt: reg.submittedAt,
      })
    }

    if (competition.daysUntil === 1) {
      notifications.push({
        id: `tomorrow-${competition.id}`,
        title: 'Competition tomorrow',
        body: `${competition.name} starts tomorrow — final prep time!`,
        type: 'starting',
        href: `/dashboard/student/competitions/${competition.id}/preparation`,
        createdAt: new Date().toISOString(),
      })
    }

    if (competition.status === 'in_progress') {
      notifications.push({
        id: `checkin-${competition.id}`,
        title: 'Check-in open',
        body: `Check in now for ${competition.name}.`,
        type: 'checkin',
        href: `/dashboard/student/competitions/${competition.id}/live`,
        createdAt: new Date().toISOString(),
      })
    }

    if (competition.status === 'completed') {
      notifications.push({
        id: `results-${competition.id}`,
        title: 'Results published',
        body: `View your results for ${competition.name}.`,
        type: 'results',
        href: `/dashboard/student/results`,
        createdAt: new Date().toISOString(),
      })
      if (issuedCertificateCompetitionIds?.has(competition.id)) {
        notifications.push({
          id: `cert-${competition.id}`,
          title: 'Certificate ready',
          body: `Download your certificate for ${competition.name}.`,
          type: 'certificate',
          href: `/dashboard/student/certificates`,
          createdAt: new Date().toISOString(),
        })
      }
    }
  }

  return notifications.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
}

export function formatCategoryLabel(category: CompetitionCategory): string {
  const parts = [category.name]
  if (category.ageGroup) parts.push(category.ageGroup.replace(/_/g, ' '))
  if (category.styleType) parts.push(category.styleType)
  return parts.join(' · ')
}
