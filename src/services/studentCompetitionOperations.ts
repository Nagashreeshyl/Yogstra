import { supabase } from '../lib/supabase'
import { competitionRegistrationRepository } from '../repositories/competitionRegistrationRepository'
import { submitRegistration, addParticipant } from './registrationService'
import { type StudentRegistrationDraft } from '../utils/studentRegistrationDraft'
import { formatUserFacingError } from '../utils/format'
import type { CompetitionRegistration } from '../domain/competition/models'

function buildParticipantMetadata(draft: StudentRegistrationDraft) {
  return {
    emergencyContact: draft.emergencyContact,
    documents: draft.documents,
    documentFiles: draft.documentFiles ?? {},
    eligibilityConfirmed: draft.eligibilityConfirmed,
  }
}

export async function completeStudentRegistration(params: {
  competitionId: string
  userId: string
  userName: string
  categoryId: string
  divisionId?: string
  draft: StudentRegistrationDraft
  existingRegistration?: CompetitionRegistration | null
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const registrantId = user.id
  const metadata = buildParticipantMetadata(params.draft)

  let existing =
    params.existingRegistration ??
    (params.draft.registrationId
      ? await competitionRegistrationRepository.findById(params.draft.registrationId)
      : null) ??
    (await competitionRegistrationRepository.findByCompetitionAndRegistrant(
      params.competitionId,
      registrantId,
    ))

  if (
    existing &&
    (existing.paymentStatus === 'paid' || existing.paymentStatus === 'waived') &&
    existing.status === 'confirmed'
  ) {
    throw new Error('You are already registered for this competition.')
  }

  let registration = existing

  if (registration) {
    registration = await competitionRegistrationRepository.updateRegistration(registration.id, {
      categoryId: params.categoryId,
      divisionId: params.divisionId ?? null,
      notes: params.draft.notes ?? null,
    })

    const participant = await competitionRegistrationRepository.findParticipantByRegistration(
      registration.id,
      registrantId,
    )

    if (participant) {
      await competitionRegistrationRepository.updateParticipant(participant.id, {
        categoryId: params.categoryId,
        divisionId: params.divisionId ?? null,
        displayName: params.userName,
        metadata,
      })
    } else {
      await addParticipant({
        registrationId: registration.id,
        competitionId: params.competitionId,
        studentId: registrantId,
        categoryId: params.categoryId,
        divisionId: params.divisionId,
        displayName: params.userName,
        metadata,
      })
    }
  } else {
    try {
      registration = await submitRegistration({
        competitionId: params.competitionId,
        categoryId: params.categoryId,
        divisionId: params.divisionId,
        registrantId,
        registrantType: 'student',
        notes: params.draft.notes,
      })
    } catch (err) {
      throw new Error(formatUserFacingError(err, 'Could not submit registration.'))
    }

    try {
      await addParticipant({
        registrationId: registration.id,
        competitionId: params.competitionId,
        studentId: registrantId,
        categoryId: params.categoryId,
        divisionId: params.divisionId,
        displayName: params.userName,
        metadata,
      })
    } catch (err) {
      throw new Error(formatUserFacingError(err, 'Could not save participant details.'))
    }
  }

  return registration
}

export async function markRegistrationPaid(registrationId: string, amount: number) {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const token = session?.access_token
  if (!token) {
    throw new Error('Not signed in')
  }

  const response = await fetch('/api/competition-registration-complete', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ registrationId, amount }),
  })

  const payload = (await response.json().catch(() => ({}))) as { error?: string }
  if (!response.ok) {
    throw new Error(formatUserFacingError(payload.error, 'Payment could not be recorded.'))
  }
}

export async function updateStudentRegistrationDocuments(params: {
  registrationId: string
  studentId: string
  draft: Pick<StudentRegistrationDraft, 'documents' | 'documentFiles' | 'emergencyContact'>
}) {
  const participant = await competitionRegistrationRepository.findParticipantByRegistration(
    params.registrationId,
    params.studentId,
  )
  if (!participant) {
    throw new Error('Registration not found.')
  }

  const existingMeta = (participant.metadata ?? {}) as Record<string, unknown>
  await competitionRegistrationRepository.updateParticipant(participant.id, {
    metadata: {
      ...existingMeta,
      documents: params.draft.documents,
      documentFiles: params.draft.documentFiles ?? {},
      emergencyContact: params.draft.emergencyContact,
    },
    documentsVerified: false,
  })
}

export async function payStudentRegistration(registrationId: string, amount: number) {
  return markRegistrationPaid(registrationId, amount)
}
