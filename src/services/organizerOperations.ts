import { supabase } from '../lib/supabase'
import type {
  CompetitionAnnouncementAudience,
  CompetitionRegistrationStatus,
  CompetitionResultStatus,
  CompetitionStatus,
  CreateCompetitionCategoryInput,
  CreateCompetitionInput,
} from '../domain/competition/models'
import { competitionRepository } from '../repositories/competitionRepository'
import { createCompetition } from './competitionService'
import { assignJudge } from './judgeService'
import { createCertificateDraft, issueCertificate } from './certificateService'
import { recordRankingEntry } from './rankingService'
import { aggregateResultsFromScores } from './resultsAggregationService'
import { mapCompetitionAnnouncement } from '../utils/competitionMappers'
import { formatUserFacingError } from '../utils/format'

export async function updateCompetitionStatus(competitionId: string, status: CompetitionStatus) {
  const { error } = await supabase
    .from('competitions')
    .update({ status })
    .eq('id', competitionId)

  if (error) throw error
}

export async function archiveCompetition(competitionId: string) {
  return updateCompetitionStatus(competitionId, 'archived')
}

export async function updateCompetitionDetails(
  competitionId: string,
  patch: Partial<{
    name: string
    description: string
    venue: string
    city: string
    state: string
    startDate: string
    endDate: string
    registrationDeadline: string
    entryFee: number
    maxParticipants: number
    rules: string
  }>,
) {
  const { error } = await supabase
    .from('competitions')
    .update({
      name: patch.name,
      description: patch.description,
      venue: patch.venue,
      city: patch.city,
      state: patch.state,
      start_date: patch.startDate,
      end_date: patch.endDate,
      registration_deadline: patch.registrationDeadline,
      entry_fee: patch.entryFee,
      max_participants: patch.maxParticipants,
      rules: patch.rules,
    })
    .eq('id', competitionId)

  if (error) throw error
}

export async function updateRegistrationStatus(
  registrationId: string,
  status: CompetitionRegistrationStatus,
) {
  const updates: Record<string, unknown> = { status }
  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('competition_registrations')
    .update(updates)
    .eq('id', registrationId)

  if (error) throw error
}

export async function bulkUpdateRegistrationStatus(
  registrationIds: string[],
  status: CompetitionRegistrationStatus,
) {
  if (registrationIds.length === 0) return

  const updates: Record<string, unknown> = { status }
  if (status === 'confirmed') {
    updates.confirmed_at = new Date().toISOString()
  }

  const { error } = await supabase
    .from('competition_registrations')
    .update(updates)
    .in('id', registrationIds)

  if (error) throw error
}

export async function verifyParticipantDocuments(participantId: string, verified: boolean) {
  const { error } = await supabase
    .from('competition_participants')
    .update({ documents_verified: verified })
    .eq('id', participantId)

  if (error) throw error
}

export async function createCompetitionCategory(input: CreateCompetitionCategoryInput) {
  return competitionRepository.createCategory(input)
}

export async function createCompetitionDivision(input: {
  categoryId: string
  name: string
  code?: string
  maxParticipants?: number
  sortOrder?: number
}) {
  const { data, error } = await supabase
    .from('competition_divisions')
    .insert({
      category_id: input.categoryId,
      name: input.name,
      code: input.code ?? null,
      max_participants: input.maxParticipants ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function createCompetitionEvent(input: {
  competitionId: string
  name: string
  venue?: string
  stage?: string
  startsAt: string
  endsAt?: string
  sortOrder?: number
}) {
  const { data, error } = await supabase
    .from('competition_events')
    .insert({
      competition_id: input.competitionId,
      name: input.name,
      venue: input.venue ?? null,
      stage: input.stage ?? null,
      starts_at: input.startsAt,
      ends_at: input.endsAt ?? null,
      sort_order: input.sortOrder ?? 0,
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

export async function updateJudgeCategory(judgeId: string, categoryId: string | null) {
  const { error } = await supabase
    .from('competition_judges')
    .update({ category_id: categoryId, status: 'active' })
    .eq('id', judgeId)

  if (error) throw error
}

export async function saveAnnouncement(input: {
  competitionId: string
  title: string
  body: string
  audience: CompetitionAnnouncementAudience
  createdBy: string
  publish?: boolean
}) {
  const { data, error } = await supabase
    .from('competition_announcements')
    .insert({
      competition_id: input.competitionId,
      title: input.title,
      body: input.body,
      audience: input.audience,
      created_by: input.createdBy,
      status: input.publish ? 'published' : 'draft',
      published_at: input.publish ? new Date().toISOString() : null,
    })
    .select('*')
    .single()

  if (error) throw error
  return mapCompetitionAnnouncement(data)
}

export async function publishAnnouncement(announcementId: string) {
  const { error } = await supabase
    .from('competition_announcements')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
    })
    .eq('id', announcementId)

  if (error) throw error
}

export async function updateResultStatus(resultId: string, status: CompetitionResultStatus) {
  const updates: Record<string, unknown> = { status }
  if (status === 'approved' || status === 'published') {
    updates.approved_at = new Date().toISOString()
  }

  const { data: result, error } = await supabase
    .from('competition_results')
    .update(updates)
    .eq('id', resultId)
    .select('competition_id, status')
    .single()

  if (error) throw error

  if (status === 'published' && result) {
    await syncRankingsAndCertificates(result.competition_id as string)
  }
}

export async function computeResultsFromScores(competitionId: string, categoryId?: string) {
  return aggregateResultsFromScores(competitionId, categoryId)
}

export async function confirmRegistrationPayment(registrationId: string, amountInr?: number) {
  const { error } = await supabase
    .from('competition_registrations')
    .update({
      payment_status: 'paid',
      payment_amount: amountInr ?? null,
    })
    .eq('id', registrationId)

  if (error) throw error
}

export async function lockCompetitionCategory(competitionId: string, categoryId: string) {
  const { data: competition, error: fetchError } = await supabase
    .from('competitions')
    .select('settings')
    .eq('id', competitionId)
    .single()

  if (fetchError) throw fetchError

  const settings = (competition.settings as Record<string, unknown>) ?? {}
  const locked = new Set(
    Array.isArray(settings.lockedCategories) ? (settings.lockedCategories as string[]) : [],
  )
  locked.add(categoryId)

  const { error } = await supabase
    .from('competitions')
    .update({ settings: { ...settings, lockedCategories: [...locked] } })
    .eq('id', competitionId)

  if (error) throw error

  const { error: scoreLockError } = await supabase
    .from('competition_scores')
    .update({ status: 'locked' })
    .eq('competition_id', competitionId)
    .eq('category_id', categoryId)
    .eq('status', 'submitted')

  if (scoreLockError) throw scoreLockError
}

export async function publishEventSchedule(competitionId: string) {
  const { error: eventError } = await supabase
    .from('competition_events')
    .update({ status: 'in_progress' })
    .eq('competition_id', competitionId)
    .eq('status', 'scheduled')

  if (eventError) throw eventError

  await updateCompetitionStatus(competitionId, 'in_progress')
}

async function syncRankingsAndCertificates(competitionId: string) {
  const { data: results, error } = await supabase
    .from('competition_results')
    .select(
      `
      id,
      rank,
      total_score,
      medal,
      category_id,
      participant:competition_participants!participant_id(
        id,
        student_id,
        display_name
      )
    `,
    )
    .eq('competition_id', competitionId)
    .eq('status', 'published')

  if (error) throw error

  const season = new Date().getFullYear().toString()

  for (const result of results ?? []) {
    const participant = Array.isArray(result.participant) ? result.participant[0] : result.participant
    const studentId = (participant as { student_id?: string })?.student_id
    if (!studentId || !result.rank) continue

    await recordRankingEntry({
      competitionId,
      scope: 'student',
      subjectType: 'student',
      subjectId: studentId,
      categoryId: result.category_id as string,
      rank: result.rank as number,
      points: Number(result.total_score ?? 0),
      season,
      metadata: { medal: result.medal },
    })
  }

  const recipientPayload = (results ?? [])
    .map((result) => {
      const participant = Array.isArray(result.participant) ? result.participant[0] : result.participant
      const studentId = (participant as { student_id?: string })?.student_id
      const displayName = (participant as { display_name?: string })?.display_name ?? 'Participant'
      if (!studentId) return null
      return {
        recipientId: studentId,
        title: `${displayName} — Competition Certificate`,
        participantId: (participant as { id?: string })?.id,
        resultId: result.id as string,
      }
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)

  if (recipientPayload.length > 0) {
    await generateCertificatesForResults(competitionId, recipientPayload)
  }
}

export async function publishAllApprovedResults(competitionId: string) {
  const { error } = await supabase
    .from('competition_results')
    .update({ status: 'published', approved_at: new Date().toISOString() })
    .eq('competition_id', competitionId)
    .eq('status', 'approved')

  if (error) throw error

  await syncRankingsAndCertificates(competitionId)
}

export async function recalculateRankings(competitionId: string) {
  await syncRankingsAndCertificates(competitionId)
}

export async function publishCompetition(competitionId: string, openRegistration: boolean) {
  await updateCompetitionStatus(
    competitionId,
    openRegistration ? 'registration_open' : 'published',
  )
}

export async function createAndPublishCompetition(
  input: CreateCompetitionInput,
  createdBy: string,
  extras: {
    categories: CreateCompetitionCategoryInput[]
    divisions: { categoryIndex: number; name: string; code?: string }[]
    events: { name: string; startsAt: string; endsAt?: string; venue?: string; stage?: string }[]
    openRegistration: boolean
  },
) {
  if (
    input.startDate &&
    input.endDate &&
    new Date(input.endDate) < new Date(input.startDate)
  ) {
    throw new Error('End date must be on or after the start date.')
  }

  let competition
  try {
    competition = await createCompetition(input, createdBy)
  } catch (err) {
    throw new Error(formatUserFacingError(err, 'Could not create competition.'))
  }

  const categoryIds: string[] = []

  try {
    for (const [index, category] of extras.categories.entries()) {
      const created = await createCompetitionCategory({
        ...category,
        competitionId: competition.id,
        sortOrder: index,
      })
      categoryIds.push(created.id)
    }
  } catch (err) {
    throw new Error(formatUserFacingError(err, 'Could not save competition categories.'))
  }

  try {
    for (const division of extras.divisions) {
      const categoryId = categoryIds[division.categoryIndex]
      if (!categoryId) continue
      await createCompetitionDivision({
        categoryId,
        name: division.name,
        code: division.code,
      })
    }
  } catch (err) {
    throw new Error(formatUserFacingError(err, 'Could not save competition divisions.'))
  }

  try {
    for (const [index, event] of extras.events.entries()) {
      if (!event.name.trim() || !event.startsAt.trim()) continue
      await createCompetitionEvent({
        competitionId: competition.id,
        name: event.name.trim(),
        startsAt: event.startsAt,
        endsAt: event.endsAt,
        venue: event.venue ?? input.venue,
        stage: event.stage,
        sortOrder: index,
      })
    }
  } catch (err) {
    throw new Error(formatUserFacingError(err, 'Could not save competition schedule.'))
  }

  try {
    await publishCompetition(competition.id, extras.openRegistration)
  } catch (err) {
    throw new Error(formatUserFacingError(err, 'Competition was created but could not be published.'))
  }

  return competition
}

export async function assignJudgeToCompetition(
  competitionId: string,
  userId: string,
  invitedBy: string,
  categoryId?: string | null,
) {
  return assignJudge({
    competitionId,
    userId,
    categoryId,
    invitedBy,
  })
}

export async function generateCertificatesForResults(
  competitionId: string,
  recipientIds: { recipientId: string; title: string; participantId?: string; resultId?: string }[],
) {
  const { data: existingCerts } = await supabase
    .from('competition_certificates')
    .select('result_id')
    .eq('competition_id', competitionId)

  const existingResultIds = new Set(
    (existingCerts ?? []).map((row) => row.result_id as string).filter(Boolean),
  )

  const issued = []
  for (const item of recipientIds) {
    if (item.resultId && existingResultIds.has(item.resultId)) continue

    const draft = await createCertificateDraft({
      competitionId,
      recipientId: item.recipientId,
      title: item.title,
      participantId: item.participantId,
      resultId: item.resultId,
      certificateType: 'winner',
    })
    const certificate = await issueCertificate(draft.id, {
      signedBy: 'Yogstra Platform',
      signedAt: new Date().toISOString(),
      algorithm: 'sha256-content-digest',
    })
    issued.push(certificate)
  }
  return issued
}

export function exportRegistrationsCsv(
  rows: {
    id: string
    registrantName?: string
    registrantType: string
    status: string
    paymentStatus: string
    submittedAt: string
  }[],
): string {
  const header = 'ID,Registrant,Type,Status,Payment,Submitted'
  const lines = rows.map(
    (row) =>
      `${row.id},"${row.registrantName ?? ''}",${row.registrantType},${row.status},${row.paymentStatus},${row.submittedAt}`,
  )
  return [header, ...lines].join('\n')
}
