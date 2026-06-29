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
import { mapCompetitionAnnouncement } from '../utils/competitionMappers'

export async function updateCompetitionStatus(competitionId: string, status: CompetitionStatus) {
  const { error } = await supabase
    .from('competitions')
    .update({ status })
    .eq('id', competitionId)

  if (error) throw error
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

  const { error } = await supabase
    .from('competition_results')
    .update(updates)
    .eq('id', resultId)

  if (error) throw error
}

export async function publishAllApprovedResults(competitionId: string) {
  const { error } = await supabase
    .from('competition_results')
    .update({ status: 'published' })
    .eq('competition_id', competitionId)
    .eq('status', 'approved')

  if (error) throw error
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
  const competition = await createCompetition(input, createdBy)
  const categoryIds: string[] = []

  for (const [index, category] of extras.categories.entries()) {
    const created = await createCompetitionCategory({
      ...category,
      competitionId: competition.id,
      sortOrder: index,
    })
    categoryIds.push(created.id)
  }

  for (const division of extras.divisions) {
    const categoryId = categoryIds[division.categoryIndex]
    if (!categoryId) continue
    await createCompetitionDivision({
      categoryId,
      name: division.name,
      code: division.code,
    })
  }

  for (const [index, event] of extras.events.entries()) {
    await createCompetitionEvent({
      competitionId: competition.id,
      name: event.name,
      startsAt: event.startsAt,
      endsAt: event.endsAt,
      venue: event.venue ?? input.venue,
      stage: event.stage,
      sortOrder: index,
    })
  }

  await publishCompetition(competition.id, extras.openRegistration)
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
  const issued = []
  for (const item of recipientIds) {
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
