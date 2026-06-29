import type {
  AssignCompetitionJudgeInput,
  SubmitCompetitionScoreInput,
} from '../domain/competition/models'
import { competitionJudgeRepository } from '../repositories/competitionJudgeRepository'

export async function fetchCompetitionJudges(competitionId: string) {
  return competitionJudgeRepository.listByCompetition(competitionId)
}

export async function fetchJudgeAssignment(competitionId: string, userId: string) {
  return competitionJudgeRepository.findByUser(competitionId, userId)
}

export async function assignJudge(input: AssignCompetitionJudgeInput) {
  return competitionJudgeRepository.assign(input)
}

export async function submitScore(input: SubmitCompetitionScoreInput) {
  return competitionJudgeRepository.submitScore(input)
}

export async function fetchCompetitionScores(competitionId: string) {
  return competitionJudgeRepository.listScoresByCompetition(competitionId)
}

export async function fetchCompetitionResults(competitionId: string) {
  return competitionJudgeRepository.listResults(competitionId)
}

export async function fetchPublishedResults(competitionId: string) {
  return competitionJudgeRepository.listPublishedResults(competitionId)
}

export async function isUserAssignedJudge(competitionId: string, userId: string) {
  const assignment = await competitionJudgeRepository.findByUser(competitionId, userId)
  return assignment !== null && assignment.status === 'active'
}
