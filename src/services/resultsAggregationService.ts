import { supabase } from '../lib/supabase'

type ParticipantScoreAggregate = {
  participantId: string
  categoryId: string
  divisionId: string | null
  avgScore: number
}

function medalForRank(rank: number): string | null {
  if (rank === 1) return 'gold'
  if (rank === 2) return 'silver'
  if (rank === 3) return 'bronze'
  return 'participation'
}

async function upsertProvisionalResult(input: {
  competitionId: string
  participantId: string
  categoryId: string
  divisionId: string | null
  rank: number
  totalScore: number
  medal: string | null
}) {
  const { data: existing, error: findError } = await supabase
    .from('competition_results')
    .select('id, status')
    .eq('participant_id', input.participantId)
    .maybeSingle()

  if (findError) throw findError
  if (existing?.status === 'published') return

  const row = {
    competition_id: input.competitionId,
    participant_id: input.participantId,
    category_id: input.categoryId,
    division_id: input.divisionId,
    rank: input.rank,
    total_score: input.totalScore,
    medal: input.medal,
    status: existing?.status === 'approved' ? 'approved' : 'provisional',
  }

  if (existing) {
    const { error } = await supabase.from('competition_results').update(row).eq('id', existing.id)
    if (error) throw error
    return
  }

  const { error } = await supabase.from('competition_results').insert(row)
  if (error) throw error
}

/** Aggregates submitted judge scores into provisional competition results with ranks. */
export async function aggregateResultsFromScores(
  competitionId: string,
  categoryId?: string,
): Promise<{ updated: number }> {
  let query = supabase
    .from('competition_scores')
    .select(
      `
      participant_id,
      category_id,
      total_score,
      participant:competition_participants!participant_id(
        id,
        category_id,
        division_id
      )
    `,
    )
    .eq('competition_id', competitionId)
    .eq('status', 'submitted')

  if (categoryId) {
    query = query.eq('category_id', categoryId)
  }

  const { data: scores, error } = await query
  if (error) throw error

  const byParticipant = new Map<
    string,
    { sum: number; count: number; categoryId: string; divisionId: string | null }
  >()

  for (const score of scores ?? []) {
    const participantId = score.participant_id as string
    const participant = Array.isArray(score.participant) ? score.participant[0] : score.participant
    const category = (score.category_id as string) ?? (participant as { category_id?: string })?.category_id
    if (!category) continue

    const divisionId = ((participant as { division_id?: string | null })?.division_id ?? null) as string | null
    const existing = byParticipant.get(participantId) ?? {
      sum: 0,
      count: 0,
      categoryId: category,
      divisionId,
    }
    existing.sum += Number(score.total_score ?? 0)
    existing.count += 1
    byParticipant.set(participantId, existing)
  }

  const byCategory = new Map<string, ParticipantScoreAggregate[]>()
  for (const [participantId, agg] of byParticipant) {
    if (agg.count === 0) continue
    const entry: ParticipantScoreAggregate = {
      participantId,
      categoryId: agg.categoryId,
      divisionId: agg.divisionId,
      avgScore: Math.round((agg.sum / agg.count) * 100) / 100,
    }
    const list = byCategory.get(agg.categoryId) ?? []
    list.push(entry)
    byCategory.set(agg.categoryId, list)
  }

  let updated = 0
  for (const [, participants] of byCategory) {
    participants.sort((a, b) => b.avgScore - a.avgScore)
    for (let index = 0; index < participants.length; index += 1) {
      const participant = participants[index]
      const rank = index + 1
      await upsertProvisionalResult({
        competitionId,
        participantId: participant.participantId,
        categoryId: participant.categoryId,
        divisionId: participant.divisionId,
        rank,
        totalScore: participant.avgScore,
        medal: medalForRank(rank),
      })
      updated += 1
    }
  }

  return { updated }
}
