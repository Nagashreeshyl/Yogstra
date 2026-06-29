import { supabase } from '../lib/supabase'
import type { CreateRankingEntryInput } from '../domain/competition/models'
import type { CompetitionRankingScope } from '../domain/competition/models'
import { mapCompetitionRanking } from '../utils/competitionMappers'

const rankingSelect = `
  id,
  competition_id,
  scope,
  subject_type,
  subject_id,
  category_id,
  period_start,
  period_end,
  rank,
  points,
  season,
  metadata,
  created_at,
  updated_at
`

export const competitionRankingRepository = {
  async listByScope(scope: CompetitionRankingScope, season?: string, limit = 100) {
    let query = supabase
      .from('competition_rankings')
      .select(rankingSelect)
      .eq('scope', scope)
      .order('rank', { ascending: true })
      .limit(limit)

    if (season) {
      query = query.eq('season', season)
    }

    const { data, error } = await query
    if (error) throw error
    return (data ?? []).map(mapCompetitionRanking)
  },

  async listByCompetition(competitionId: string) {
    const { data, error } = await supabase
      .from('competition_rankings')
      .select(rankingSelect)
      .eq('competition_id', competitionId)
      .order('rank', { ascending: true })

    if (error) throw error
    return (data ?? []).map(mapCompetitionRanking)
  },

  async listBySubject(subjectType: string, subjectId: string) {
    const { data, error } = await supabase
      .from('competition_rankings')
      .select(rankingSelect)
      .eq('subject_type', subjectType)
      .eq('subject_id', subjectId)
      .order('season', { ascending: false })

    if (error) throw error
    return (data ?? []).map(mapCompetitionRanking)
  },

  async upsertEntry(input: CreateRankingEntryInput) {
    const { data, error } = await supabase
      .from('competition_rankings')
      .insert({
        competition_id: input.competitionId ?? null,
        scope: input.scope,
        subject_type: input.subjectType,
        subject_id: input.subjectId,
        category_id: input.categoryId ?? null,
        rank: input.rank,
        points: input.points,
        season: input.season ?? null,
        period_start: input.periodStart ?? null,
        period_end: input.periodEnd ?? null,
        metadata: input.metadata ?? {},
      })
      .select(rankingSelect)
      .single()

    if (error) throw error
    return mapCompetitionRanking(data)
  },
}
