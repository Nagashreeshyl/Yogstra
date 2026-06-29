import { supabase } from '../lib/supabase'

export type AcademyCompetitionSummary = {
  totalRegistrations: number
  confirmedRegistrations: number
  totalParticipants: number
  pendingDocuments: number
  competitions: {
    competitionId: string
    competitionName: string
    registrations: number
    participants: number
    pendingDocuments: number
  }[]
}

export async function fetchAcademyCompetitionSummary(academyId: string): Promise<AcademyCompetitionSummary> {
  const { data: batchStudents, error: batchError } = await supabase
    .from('batch_students')
    .select('student_id, batch:batches!inner(academy_id)')
    .eq('batch.academy_id', academyId)
    .eq('status', 'active')

  if (batchError) throw batchError

  const studentIds = [...new Set((batchStudents ?? []).map((row) => row.student_id as string))]
  if (studentIds.length === 0) {
    return {
      totalRegistrations: 0,
      confirmedRegistrations: 0,
      totalParticipants: 0,
      pendingDocuments: 0,
      competitions: [],
    }
  }

  const [regsResult, participantsResult] = await Promise.all([
    supabase
      .from('competition_registrations')
      .select('id, competition_id, status, competition:competitions!competition_id(name)')
      .in('registrant_id', studentIds),
    supabase
      .from('competition_participants')
      .select('id, competition_id, documents_verified, competition:competitions!competition_id(name)')
      .in('student_id', studentIds),
  ])

  if (regsResult.error) throw regsResult.error
  if (participantsResult.error) throw participantsResult.error

  const byCompetition = new Map<
    string,
    { name: string; registrations: number; confirmed: number; participants: number; pendingDocs: number }
  >()

  for (const reg of regsResult.data ?? []) {
    const competitionId = reg.competition_id as string
    const competition = Array.isArray(reg.competition) ? reg.competition[0] : reg.competition
    const entry = byCompetition.get(competitionId) ?? {
      name: (competition as { name?: string })?.name ?? 'Competition',
      registrations: 0,
      confirmed: 0,
      participants: 0,
      pendingDocs: 0,
    }
    entry.registrations += 1
    if (reg.status === 'confirmed') entry.confirmed += 1
    byCompetition.set(competitionId, entry)
  }

  for (const participant of participantsResult.data ?? []) {
    const competitionId = participant.competition_id as string
    const competition = Array.isArray(participant.competition) ? participant.competition[0] : participant.competition
    const entry = byCompetition.get(competitionId) ?? {
      name: (competition as { name?: string })?.name ?? 'Competition',
      registrations: 0,
      confirmed: 0,
      participants: 0,
      pendingDocs: 0,
    }
    entry.participants += 1
    if (!participant.documents_verified) entry.pendingDocs += 1
    byCompetition.set(competitionId, entry)
  }

  const competitions = [...byCompetition.entries()].map(([competitionId, stats]) => ({
    competitionId,
    competitionName: stats.name,
    registrations: stats.registrations,
    participants: stats.participants,
    pendingDocuments: stats.pendingDocs,
  }))

  return {
    totalRegistrations: (regsResult.data ?? []).length,
    confirmedRegistrations: (regsResult.data ?? []).filter((r) => r.status === 'confirmed').length,
    totalParticipants: (participantsResult.data ?? []).length,
    pendingDocuments: (participantsResult.data ?? []).filter((p) => !p.documents_verified).length,
    competitions,
  }
}
