import { supabase } from '../lib/supabase'
import type {
  AssignCompetitionJudgeInput,
  SubmitCompetitionScoreInput,
} from '../domain/competition/models'
import {
  mapCompetitionJudge,
  mapCompetitionResult,
  mapCompetitionScore,
} from '../utils/competitionMappers'

const judgeSelect = `
  id,
  competition_id,
  user_id,
  role,
  category_id,
  event_id,
  status,
  invited_by,
  created_at,
  updated_at,
  user:profiles!user_id(full_name)
`

const scoreSelect = `
  id,
  competition_id,
  participant_id,
  judge_id,
  category_id,
  event_id,
  criteria,
  total_score,
  comments,
  submitted_at,
  status,
  created_at,
  updated_at
`

const resultSelect = `
  id,
  competition_id,
  participant_id,
  category_id,
  division_id,
  rank,
  total_score,
  medal,
  status,
  approved_by,
  approved_at,
  created_at,
  updated_at,
  participant:competition_participants!participant_id(display_name)
`

export const competitionJudgeRepository = {
  async listByCompetition(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_judges')
      .select(judgeSelect)
      .eq('competition_id', competitionId)
      .neq('status', 'removed')
      .order('created_at', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapCompetitionJudge)
  },

  async findByUser(competitionId: string, userId: string) {
    const { data, error } = await supabase
      .from('competition_judges')
      .select(judgeSelect)
      .eq('competition_id', competitionId)
      .eq('user_id', userId)
      .maybeSingle()

    if (error) throw error
    return data ? mapCompetitionJudge(data) : null
  },

  async assign(input: AssignCompetitionJudgeInput) {
    const { data, error } = await supabase
      .from('competition_judges')
      .insert({
        competition_id: input.competitionId,
        user_id: input.userId,
        role: input.role ?? 'judge',
        category_id: input.categoryId ?? null,
        event_id: input.eventId ?? null,
        invited_by: input.invitedBy ?? null,
        status: 'invited',
      })
      .select(judgeSelect)
      .single()

    if (error) throw error
    return mapCompetitionJudge(data)
  },

  async submitScore(input: SubmitCompetitionScoreInput) {
    const { data, error } = await supabase
      .from('competition_scores')
      .insert({
        competition_id: input.competitionId,
        participant_id: input.participantId,
        judge_id: input.judgeId,
        category_id: input.categoryId ?? null,
        event_id: input.eventId ?? null,
        criteria: input.criteria,
        total_score: input.totalScore,
        comments: input.comments ?? null,
        submitted_at: new Date().toISOString(),
        status: 'submitted',
      })
      .select(scoreSelect)
      .single()

    if (error) throw error
    return mapCompetitionScore(data)
  },

  async listScoresByCompetition(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_scores')
      .select(scoreSelect)
      .eq('competition_id', competitionId)
      .order('submitted_at', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionScore)
  },

  async listResults(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_results')
      .select(resultSelect)
      .eq('competition_id', competitionId)
      .order('rank', { ascending: true, nullsFirst: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionResult)
  },

  async listPublishedResults(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_results')
      .select(resultSelect)
      .eq('competition_id', competitionId)
      .eq('status', 'published')
      .order('rank', { ascending: true, nullsFirst: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionResult)
  },
}
