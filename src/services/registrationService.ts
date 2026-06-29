import type {
  CreateCompetitionParticipantInput,
  CreateCompetitionRegistrationInput,
} from '../domain/competition/models'
import { competitionRegistrationRepository } from '../repositories/competitionRegistrationRepository'
import { competitionRepository } from '../repositories/competitionRepository'

export async function fetchRegistrationById(id: string) {
  return competitionRegistrationRepository.findById(id)
}

export async function fetchCompetitionRegistrations(competitionId: string) {
  return competitionRegistrationRepository.listByCompetition(competitionId)
}

export async function fetchUserRegistrations(userId: string) {
  return competitionRegistrationRepository.listByRegistrant(userId)
}

export async function fetchCompetitionParticipants(competitionId: string) {
  return competitionRegistrationRepository.listParticipants(competitionId)
}

export async function fetchRegistrationParticipants(registrationId: string) {
  return competitionRegistrationRepository.listParticipantsByRegistration(registrationId)
}

export async function submitRegistration(input: CreateCompetitionRegistrationInput) {
  const competition = await competitionRepository.findById(input.competitionId)
  if (!competition) {
    throw new Error('Competition not found')
  }
  if (competition.status !== 'registration_open') {
    throw new Error('Registration is not open for this competition')
  }

  return competitionRegistrationRepository.create(input)
}

export async function addParticipant(input: CreateCompetitionParticipantInput) {
  return competitionRegistrationRepository.addParticipant(input)
}

export async function fetchRegistrationStats(competitionId: string) {
  const [registrations, participants, pendingDocuments] = await Promise.all([
    competitionRegistrationRepository.listByCompetition(competitionId),
    competitionRegistrationRepository.listParticipants(competitionId),
    competitionRegistrationRepository.countPendingDocuments(competitionId),
  ])

  return {
    totalRegistrations: registrations.length,
    confirmedRegistrations: registrations.filter((r) => r.status === 'confirmed').length,
    pendingRegistrations: registrations.filter((r) => r.status === 'pending').length,
    totalParticipants: participants.length,
    pendingDocuments,
  }
}
