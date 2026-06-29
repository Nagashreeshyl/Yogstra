import type { Competition, CompetitionCategory, CompetitionRegistration } from '../domain/competition/models'
import { fetchPublishedCompetitions, fetchCompetitionById, fetchCompetitionSummary } from './competitionService'
import { fetchUserRegistrations, fetchCompetitionParticipants } from './registrationService'
import { fetchPublishedResults } from './judgeService'
import { fetchUserCertificates } from './certificateService'
import { fetchSubjectRankingHistory, fetchStudentRankings } from './rankingService'
import { supabase } from '../lib/supabase'
import { mapCompetitionAnnouncement, mapCompetitionJudge } from '../utils/competitionMappers'

export type StudentCompetitionListItem = Competition & {
  daysUntil: number | null
  registrationOpen: boolean
  isRegistered: boolean
  registrationStatus: CompetitionRegistration['status'] | null
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
): StudentCompetitionListItem {
  const reg = registrations.find((r) => r.competitionId === competition.id)
  return {
    ...competition,
    daysUntil: daysUntilDate(competition.startDate),
    registrationOpen: competition.status === 'registration_open',
    isRegistered: Boolean(reg && ['pending', 'confirmed', 'waitlisted'].includes(reg.status)),
    registrationStatus: reg?.status ?? null,
  }
}

export async function fetchStudentCompetitionHome(userId: string, search = '', scopeFilter = '') {
  const [published, registrations] = await Promise.all([
    fetchPublishedCompetitions(100),
    fetchUserRegistrations(userId),
  ])

  let items = published.map((c) => enrichCompetition(c, registrations))

  if (search.trim()) {
    const q = search.toLowerCase()
    items = items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.city?.toLowerCase().includes(q) ?? false) ||
        (c.state?.toLowerCase().includes(q) ?? false),
    )
  }

  if (scopeFilter) {
    items = items.filter((c) => c.scope === scopeFilter)
  }

  const registered = items.filter((c) => c.isRegistered)
  const featured = items.filter(
    (c) => c.scope === 'national' || c.scope === 'international' || c.registrationOpen,
  ).slice(0, 4)
  const upcoming = items
    .filter((c) => c.daysUntil !== null && c.daysUntil >= 0)
    .sort((a, b) => (a.daysUntil ?? 999) - (b.daysUntil ?? 999))
    .slice(0, 6)
  const recommended = items
    .filter((c) => !c.isRegistered && c.registrationOpen)
    .slice(0, 4)
  const recent = [...items]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 4)

  return { featured, upcoming, recommended, recent, registered, all: items, registrations }
}

export async function fetchStudentCompetitionDetail(competitionId: string, userId: string) {
  const summary = await fetchCompetitionSummary(competitionId)
  if (!summary) return null

  const registrations = await fetchUserRegistrations(userId)
  const registration = registrations.find((r) => r.competitionId === competitionId) ?? null

  const { data: judgeRows } = await supabase
    .from('competition_judges')
    .select(`
      id, competition_id, user_id, role, category_id, event_id, status,
      user:profiles!user_id(full_name)
    `)
    .eq('competition_id', competitionId)
    .eq('status', 'active')
    .limit(12)

  const judges = (judgeRows ?? []).map(mapCompetitionJudge)

  return {
    ...summary,
    registration,
    judges,
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
    { id: 'documents', label: 'Submit documents', done: documentsComplete },
    { id: 'verify', label: 'Organizer verification', done: documentsComplete && registrationConfirmed },
  ]

  const readiness = Math.round(
    (checklist.filter((c) => c.done).length / checklist.length) * 100,
  )

  return {
    detail,
    myParticipant,
    checklist,
    readiness,
    countdownDays: detail.daysUntil,
  }
}

export function buildCompetitionTimeline(
  competition: Competition,
  registration: CompetitionRegistration | null,
  participantVerified: boolean,
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
      status: participantVerified
        ? 'completed'
        : registration
          ? 'current'
          : 'upcoming',
    },
    {
      id: 'schedule',
      label: 'Schedule published',
      description: 'Performance times announced',
      status:
        competition.status === 'registration_closed' ||
        competition.status === 'in_progress' ||
        competition.status === 'scoring'
          ? 'completed'
          : registration?.status === 'confirmed'
            ? 'current'
            : 'upcoming',
    },
    {
      id: 'checkin',
      label: 'Check-in opens',
      description: 'Arrive and confirm attendance',
      status:
        competition.status === 'in_progress' || competition.status === 'scoring'
          ? 'current'
          : 'upcoming',
    },
    {
      id: 'competition',
      label: 'Competition day',
      description: 'Perform and compete',
      status:
        competition.status === 'in_progress'
          ? 'current'
          : competition.status === 'scoring' || competition.status === 'completed'
            ? 'completed'
            : 'upcoming',
      dateLabel: competition.startDate ?? undefined,
    },
    {
      id: 'results',
      label: 'Results',
      description: 'Scores and placements published',
      status:
        competition.status === 'completed' || competition.status === 'results_pending'
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

  let foundCurrent = false
  for (const stage of stages) {
    if (stage.status === 'current') {
      foundCurrent = true
      break
    }
  }
  if (!foundCurrent) {
    const firstUpcoming = stages.find((s) => s.status === 'upcoming')
    if (firstUpcoming) firstUpcoming.status = 'current'
  }

  return stages
}

export async function fetchStudentLiveStatus(competitionId: string, userId: string) {
  const detail = await fetchStudentCompetitionDetail(competitionId, userId)
  if (!detail) return null

  const categoryId = detail.registration?.categoryId
  if (!categoryId) {
    return { detail, participants: [], myParticipant: null, announcements: [], currentStage: 'Awaiting category' }
  }

  const participants = (await fetchCompetitionParticipants(competitionId)).filter(
    (p) => p.categoryId === categoryId,
  )
  const myParticipant = participants.find((p) => p.studentId === userId) ?? null

  const { data: announcementRows } = await supabase
    .from('competition_announcements')
    .select('*')
    .eq('competition_id', competitionId)
    .eq('status', 'published')
    .in('audience', ['all', 'participants', 'public'])
    .order('published_at', { ascending: false })
    .limit(5)

  const announcements = (announcementRows ?? []).map(mapCompetitionAnnouncement)

  const currentStage =
    detail.competition.status === 'in_progress'
      ? 'Live — performances in progress'
      : detail.competition.status === 'scoring'
        ? 'Scoring in progress'
        : 'Waiting for competition to start'

  return {
    detail,
    participants,
    myParticipant,
    announcements,
    currentStage,
  }
}

export async function fetchStudentCompetitionResults(competitionId: string, userId: string) {
  const results = await fetchPublishedResults(competitionId)
  const participants = await fetchCompetitionParticipants(competitionId)
  const myParticipant = participants.find((p) => p.studentId === userId)

  const myResult = myParticipant
    ? results.find((r) => r.participantId === myParticipant.id)
    : null

  const categoryResults = myParticipant
    ? results.filter((r) => r.categoryId === myParticipant.categoryId)
    : []

  const { data: scoreRows } = myParticipant
    ? await supabase
        .from('competition_scores')
        .select('comments, total_score, criteria, status')
        .eq('participant_id', myParticipant.id)
        .eq('status', 'submitted')
    : { data: [] }

  const judgeComments = (scoreRows ?? [])
    .map((row) => row.comments as string | null)
    .filter(Boolean) as string[]

  return {
    myResult,
    categoryResults,
    overallResults: results,
    judgeComments,
    myParticipant,
  }
}

export async function fetchStudentCertificatesPage(userId: string) {
  return fetchUserCertificates(userId)
}

export async function fetchStudentRankingsPage(userId: string) {
  const [studentRankings, history] = await Promise.all([
    fetchStudentRankings(),
    fetchSubjectRankingHistory('student', userId),
  ])

  const myNational = studentRankings.find((r) => r.subjectId === userId && r.scope === 'national')
  const myState = studentRankings.find((r) => r.subjectId === userId && r.scope === 'state')
  const myStudent = studentRankings.find((r) => r.subjectId === userId && r.scope === 'student')

  return {
    studentRank: myStudent?.rank ?? null,
    stateRank: myState?.rank ?? null,
    nationalRank: myNational?.rank ?? null,
    history,
    leaderboard: studentRankings.slice(0, 20),
  }
}

export function buildStudentCompetitionNotifications(
  items: StudentCompetitionListItem[],
  registrations: CompetitionRegistration[],
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
        href: `/dashboard/student/competitions/${competition.id}/prepare`,
        createdAt: reg.confirmedAt ?? reg.submittedAt,
      })
    }

    if (reg.status === 'pending') {
      notifications.push({
        id: `reg-pending-${reg.id}`,
        title: 'Registration pending',
        body: `${competition.name} — awaiting organizer approval.`,
        type: 'registration',
        href: `/dashboard/student/competitions/${competition.id}`,
        createdAt: reg.submittedAt,
      })
    }

    if (reg.paymentStatus === 'unpaid') {
      notifications.push({
        id: `payment-${reg.id}`,
        title: 'Payment required',
        body: `Complete payment for ${competition.name}.`,
        type: 'payment',
        href: `/dashboard/student/competitions/${competition.id}/register`,
        createdAt: reg.submittedAt,
      })
    }

    if (competition.status === 'in_progress') {
      notifications.push({
        id: `live-${competition.id}`,
        title: 'Competition starting',
        body: `${competition.name} is live now.`,
        type: 'starting',
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
        href: `/dashboard/student/competitions/${competition.id}/results`,
        createdAt: new Date().toISOString(),
      })
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
