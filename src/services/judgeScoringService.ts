import { supabase } from '../lib/supabase'
import type { CompetitionScore } from '../domain/competition/models'
import type { ScoreCriteriaPayload } from '../types/judgePortal'
import { mapCompetitionScore } from '../utils/competitionMappers'
import {
  computeTotalScore,
  getScoringCriteriaFromSettings,
  isCategoryLocked,
  validateScoreSubmission,
} from '../utils/judgeScoringCriteria'
import {
  enqueueOfflineScore,
  generateOfflineScoreId,
  getOfflineQueue,
  removeOfflineScore,
  updateOfflineScoreError,
} from '../utils/judgeOfflineQueue'
import { fetchJudgeSession } from './judgeDashboard'

export type SubmitJudgeScoreInput = {
  userId: string
  competitionId: string
  categoryId: string
  participantId: string
  values: Record<string, number>
  comments: string
  eventId?: string | null
}

export class JudgeScoringError extends Error {
  fieldErrors: { field?: string; message: string }[]

  constructor(message: string, fieldErrors: { field?: string; message: string }[] = []) {
    super(message)
    this.name = 'JudgeScoringError'
    this.fieldErrors = fieldErrors
  }
}

async function assertJudgeAssignment(
  userId: string,
  competitionId: string,
  categoryId: string,
) {
  const { session } = await fetchJudgeSession(userId, competitionId, categoryId)

  if (session.isLocked) {
    throw new JudgeScoringError('This category is locked. Scores are read-only.')
  }

  if (session.assignment.status !== 'active' && session.assignment.status !== 'invited') {
    throw new JudgeScoringError('Your judge assignment is not active.')
  }

  if (session.assignment.categoryId && session.assignment.categoryId !== categoryId) {
    throw new JudgeScoringError('You cannot score categories you are not assigned to.')
  }

  return session
}

async function findExistingScore(
  judgeId: string,
  participantId: string,
  eventId: string | null,
) {
  let query = supabase
    .from('competition_scores')
    .select('*')
    .eq('judge_id', judgeId)
    .eq('participant_id', participantId)

  if (eventId) {
    query = query.eq('event_id', eventId)
  } else {
    query = query.is('event_id', null)
  }

  const { data, error } = await query.maybeSingle()
  if (error) throw error
  return data ? mapCompetitionScore(data) : null
}

function buildCriteriaPayload(
  input: SubmitJudgeScoreInput,
  judgeId: string,
  values: Record<string, number>,
): ScoreCriteriaPayload {
  return {
    values,
    audit: {
      judgeId,
      userId: input.userId,
      timestamp: new Date().toISOString(),
      competitionId: input.competitionId,
      categoryId: input.categoryId,
      participantId: input.participantId,
      clientSubmittedAt: new Date().toISOString(),
    },
  }
}

export async function submitJudgeScore(input: SubmitJudgeScoreInput): Promise<CompetitionScore> {
  const session = await assertJudgeAssignment(input.userId, input.competitionId, input.categoryId)
  const criteria = getScoringCriteriaFromSettings(session.competition.settings)

  const validationErrors = validateScoreSubmission(criteria, input.values, input.comments)
  if (validationErrors.length > 0) {
    throw new JudgeScoringError('Fix validation errors before submitting.', validationErrors)
  }

  const totalScore = computeTotalScore(criteria, input.values)
  const eventId = input.eventId ?? session.event?.id ?? null
  const criteriaPayload = buildCriteriaPayload(input, session.assignment.id, input.values)

  const existing = await findExistingScore(session.assignment.id, input.participantId, eventId)
  if (existing?.status === 'locked') {
    throw new JudgeScoringError('This score is locked and cannot be changed.')
  }

  if (existing?.status === 'submitted') {
    throw new JudgeScoringError(
      'A score was already submitted for this participant. Use review to edit if not locked.',
    )
  }

  if (!navigator.onLine) {
    const offlineId = generateOfflineScoreId()
    enqueueOfflineScore({
      id: offlineId,
      payload: {
        competitionId: input.competitionId,
        participantId: input.participantId,
        judgeId: session.assignment.id,
        categoryId: input.categoryId,
        eventId,
        criteria: criteriaPayload,
        totalScore,
        comments: input.comments.trim(),
      },
    })
    throw new JudgeScoringError('Offline — score saved locally and will sync when connected.')
  }

  return persistScore({
    competitionId: input.competitionId,
    participantId: input.participantId,
    judgeId: session.assignment.id,
    categoryId: input.categoryId,
    eventId,
    criteria: criteriaPayload,
    totalScore,
    comments: input.comments.trim(),
    existingId: existing?.status === 'draft' ? existing.id : undefined,
  })
}

async function persistScore(params: {
  competitionId: string
  participantId: string
  judgeId: string
  categoryId: string
  eventId: string | null
  criteria: ScoreCriteriaPayload
  totalScore: number
  comments: string
  existingId?: string
}): Promise<CompetitionScore> {
  const row = {
    competition_id: params.competitionId,
    participant_id: params.participantId,
    judge_id: params.judgeId,
    category_id: params.categoryId,
    event_id: params.eventId,
    criteria: params.criteria,
    total_score: params.totalScore,
    comments: params.comments,
    submitted_at: new Date().toISOString(),
    status: 'submitted',
  }

  if (params.existingId) {
    const { data, error } = await supabase
      .from('competition_scores')
      .update(row)
      .eq('id', params.existingId)
      .eq('status', 'draft')
      .select('*')
      .single()

    if (error) throw error
    return mapCompetitionScore(data)
  }

  const { data, error } = await supabase
    .from('competition_scores')
    .insert(row)
    .select('*')
    .single()

  if (error) {
    if (error.code === '23505') {
      throw new JudgeScoringError('Duplicate submission — this participant was already scored.')
    }
    throw error
  }

  return mapCompetitionScore(data)
}

export async function updateJudgeScoreDraft(
  input: SubmitJudgeScoreInput & { scoreId: string },
): Promise<CompetitionScore> {
  const session = await assertJudgeAssignment(input.userId, input.competitionId, input.categoryId)

  if (session.isLocked) {
    throw new JudgeScoringError('This category is locked. Scores are read-only.')
  }

  const criteria = getScoringCriteriaFromSettings(session.competition.settings)
  const validationErrors = validateScoreSubmission(criteria, input.values, input.comments)
  if (validationErrors.length > 0) {
    throw new JudgeScoringError('Fix validation errors before saving.', validationErrors)
  }

  const totalScore = computeTotalScore(criteria, input.values)
  const criteriaPayload = buildCriteriaPayload(input, session.assignment.id, input.values)

  const { data, error } = await supabase
    .from('competition_scores')
    .update({
      criteria: criteriaPayload,
      total_score: totalScore,
      comments: input.comments.trim(),
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', input.scoreId)
    .eq('judge_id', session.assignment.id)
    .neq('status', 'locked')
    .select('*')
    .single()

  if (error) throw error
  return mapCompetitionScore(data)
}

export async function syncOfflineScores(): Promise<{ synced: number; failed: number }> {
  const queue = getOfflineQueue()
  let synced = 0
  let failed = 0

  for (const item of queue) {
    try {
      await persistScore({
        competitionId: item.payload.competitionId,
        participantId: item.payload.participantId,
        judgeId: item.payload.judgeId,
        categoryId: item.payload.categoryId,
        eventId: item.payload.eventId,
        criteria: item.payload.criteria,
        totalScore: item.payload.totalScore,
        comments: item.payload.comments ?? '',
      })
      removeOfflineScore(item.id)
      synced += 1
    } catch (err) {
      failed += 1
      updateOfflineScoreError(
        item.id,
        err instanceof Error ? err.message : 'Sync failed',
      )
    }
  }

  return { synced, failed }
}

export async function getSessionScoringConfig(userId: string, competitionId: string, categoryId: string) {
  const { session } = await fetchJudgeSession(userId, competitionId, categoryId)
  return {
    criteria: getScoringCriteriaFromSettings(session.competition.settings),
    isLocked: isCategoryLocked(session.competition.settings, categoryId),
    session,
  }
}
