import { supabase } from '../lib/supabase'
import type {
  Competition,
  CompetitionAnnouncement,
  CompetitionCategory,
  CompetitionEvent,
  CompetitionJudge,
  CompetitionParticipant,
  CompetitionScore,
} from '../domain/competition/models'
import {
  mapCompetition,
  mapCompetitionAnnouncement,
  mapCompetitionCategory,
  mapCompetitionEvent,
  mapCompetitionJudge,
  mapCompetitionParticipant,
  mapCompetitionScore,
} from '../utils/competitionMappers'
import { isCategoryLocked } from '../utils/judgeScoringCriteria'

export type JudgeAssignmentView = {
  assignment: CompetitionJudge
  competition: Competition
  category: CompetitionCategory | null
  event: CompetitionEvent | null
  participantCount: number
  scoredCount: number
  isLocked: boolean
  statusLabel: string
}

export type JudgeDashboardData = {
  todayAssignments: JudgeAssignmentView[]
  upcomingCategories: JudgeAssignmentView[]
  timeline: CompetitionEvent[]
  announcements: CompetitionAnnouncement[]
  recentScores: CompetitionScore[]
  assignments: JudgeAssignmentView[]
}

const competitionSelect = `
  id, slug, name, description, organizer_id, academy_id, venue, city, state, country,
  start_date, end_date, registration_deadline, entry_fee, format, scope, status,
  max_participants, rules, settings, created_by, created_at, updated_at
`

async function fetchAssignmentsForUser(userId: string) {
  const { data, error } = await supabase
    .from('competition_judges')
    .select(`
      id, competition_id, user_id, role, category_id, event_id, status, invited_by, created_at, updated_at,
      competition:competitions (${competitionSelect}),
      category:competition_categories (id, competition_id, name, age_group, style_type, difficulty, max_participants, entry_fee_override, sort_order, status, created_at, updated_at),
      event:competition_events (id, competition_id, name, venue, stage, starts_at, ends_at, sort_order, status, created_at, updated_at)
    `)
    .eq('user_id', userId)
    .neq('status', 'removed')

  if (error) throw error
  return data ?? []
}

function getStatusLabel(competition: Competition, isLocked: boolean): string {
  if (isLocked) return 'Locked'
  if (competition.status === 'in_progress') return 'Live'
  if (competition.status === 'scoring') return 'Scoring open'
  if (competition.status === 'registration_open') return 'Registration open'
  return competition.status.replace(/_/g, ' ')
}

function isToday(dateStr: string): boolean {
  const date = new Date(dateStr)
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

export async function fetchJudgeDashboard(userId: string): Promise<JudgeDashboardData> {
  const rows = await fetchAssignmentsForUser(userId)
  const assignments: JudgeAssignmentView[] = []

  for (const row of rows) {
    const competitionRaw = Array.isArray(row.competition) ? row.competition[0] : row.competition
    if (!competitionRaw) continue

    const competition = mapCompetition(competitionRaw as Record<string, unknown>)
    const categoryRaw = Array.isArray(row.category) ? row.category[0] : row.category
    const eventRaw = Array.isArray(row.event) ? row.event[0] : row.event
    const assignment = mapCompetitionJudge(row as Record<string, unknown>)

    const category = categoryRaw
      ? mapCompetitionCategory(categoryRaw as Record<string, unknown>)
      : null

    const event = eventRaw ? mapCompetitionEvent(eventRaw as Record<string, unknown>) : null

    let participantCount = 0
    let scoredCount = 0

    if (category) {
      const { count: pCount } = await supabase
        .from('competition_participants')
        .select('id', { count: 'exact', head: true })
        .eq('competition_id', competition.id)
        .eq('category_id', category.id)
        .neq('status', 'withdrawn')

      participantCount = pCount ?? 0

      const { count: sCount } = await supabase
        .from('competition_scores')
        .select('id', { count: 'exact', head: true })
        .eq('judge_id', assignment.id)
        .eq('category_id', category.id)
        .in('status', ['submitted', 'locked'])

      scoredCount = sCount ?? 0
    }

    const isLocked = category ? isCategoryLocked(competition.settings, category.id) : false

    assignments.push({
      assignment,
      competition,
      category,
      event,
      participantCount,
      scoredCount,
      isLocked,
      statusLabel: getStatusLabel(competition, isLocked),
    })
  }

  const todayAssignments = assignments.filter((item) => {
    if (item.event) return isToday(item.event.startsAt)
    if (item.competition.startDate) return isToday(item.competition.startDate)
    return item.competition.status === 'in_progress' || item.competition.status === 'scoring'
  })

  const upcomingCategories = assignments.filter(
    (item) =>
      !todayAssignments.includes(item) &&
      item.competition.status !== 'completed' &&
      item.competition.status !== 'archived',
  )

  const competitionIds = [...new Set(assignments.map((a) => a.competition.id))]

  const timeline: CompetitionEvent[] = []
  const announcements: CompetitionAnnouncement[] = []
  const recentScores: CompetitionScore[] = []

  if (competitionIds.length > 0) {
    const { data: events } = await supabase
      .from('competition_events')
      .select('*')
      .in('competition_id', competitionIds)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(8)

    timeline.push(...(events ?? []).map(mapCompetitionEvent))

    const { data: announcementRows } = await supabase
      .from('competition_announcements')
      .select('*')
      .in('competition_id', competitionIds)
      .eq('status', 'published')
      .in('audience', ['all', 'judges'])
      .order('published_at', { ascending: false })
      .limit(6)

    announcements.push(...(announcementRows ?? []).map(mapCompetitionAnnouncement))

    const judgeIds = assignments.map((a) => a.assignment.id)
    if (judgeIds.length > 0) {
      const { data: scoreRows } = await supabase
        .from('competition_scores')
        .select('*')
        .in('judge_id', judgeIds)
        .order('submitted_at', { ascending: false })
        .limit(10)

      recentScores.push(...(scoreRows ?? []).map(mapCompetitionScore))
    }
  }

  return {
    todayAssignments,
    upcomingCategories,
    timeline,
    announcements,
    recentScores,
    assignments,
  }
}

export async function fetchJudgeSession(
  userId: string,
  competitionId: string,
  categoryId: string,
) {
  const dashboard = await fetchJudgeDashboard(userId)
  const session = dashboard.assignments.find(
    (item) =>
      item.competition.id === competitionId &&
      item.category?.id === categoryId &&
      item.assignment.userId === userId,
  )

  if (!session) {
    throw new Error('You are not assigned to this category.')
  }

  const { data: participants, error } = await supabase
    .from('competition_participants')
    .select(`
      id, registration_id, competition_id, student_id, category_id, division_id,
      display_name, date_of_birth, gender, academy_id, teacher_id, status,
      check_in_at, documents_verified, metadata, created_at, updated_at
    `)
    .eq('competition_id', competitionId)
    .eq('category_id', categoryId)
    .neq('status', 'withdrawn')
    .order('display_name', { ascending: true })

  if (error) throw error

  const { data: scoreRows } = await supabase
    .from('competition_scores')
    .select('*')
    .eq('judge_id', session.assignment.id)
    .eq('category_id', categoryId)

  const scores = (scoreRows ?? []).map(mapCompetitionScore)
  const scoreByParticipant = new Map(scores.map((s) => [s.participantId, s]))

  return {
    session,
    participants: (participants ?? []).map(mapCompetitionParticipant) as CompetitionParticipant[],
    scores,
    scoreByParticipant,
  }
}

export function getJudgeGreeting(name: string): string {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'
  return `${greeting}, ${name.split(' ')[0] || name}`
}
