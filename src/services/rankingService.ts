import type {
  CompetitionRankingScope,
  CreateRankingEntryInput,
} from '../domain/competition/models'
import { competitionRankingRepository } from '../repositories/competitionRankingRepository'

export async function fetchRankingsByScope(
  scope: CompetitionRankingScope,
  season?: string,
  limit = 100,
) {
  return competitionRankingRepository.listByScope(scope, season, limit)
}

export async function fetchStudentRankings(season?: string) {
  return competitionRankingRepository.listByScope('student', season)
}

export async function fetchTeacherRankings(season?: string) {
  return competitionRankingRepository.listByScope('teacher', season)
}

export async function fetchAcademyRankings(season?: string) {
  return competitionRankingRepository.listByScope('academy', season)
}

export async function fetchStateRankings(season?: string) {
  return competitionRankingRepository.listByScope('state', season)
}

export async function fetchNationalRankings(season?: string) {
  return competitionRankingRepository.listByScope('national', season)
}

export async function fetchCompetitionRankings(competitionId: string) {
  return competitionRankingRepository.listByCompetition(competitionId)
}

export async function fetchSubjectRankingHistory(
  subjectType: 'student' | 'teacher' | 'academy',
  subjectId: string,
) {
  return competitionRankingRepository.listBySubject(subjectType, subjectId)
}

export async function recordRankingEntry(input: CreateRankingEntryInput) {
  return competitionRankingRepository.upsertEntry(input)
}
