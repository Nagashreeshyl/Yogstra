import { supabase } from '../lib/supabase'
import { submitRegistration, addParticipant } from './registrationService'
import { clearRegistrationDraft, type StudentRegistrationDraft } from '../utils/studentRegistrationDraft'

export async function completeStudentRegistration(params: {
  competitionId: string
  userId: string
  userName: string
  categoryId: string
  divisionId?: string
  draft: StudentRegistrationDraft
}) {
  const registration = await submitRegistration({
    competitionId: params.competitionId,
    categoryId: params.categoryId,
    divisionId: params.divisionId,
    registrantId: params.userId,
    registrantType: 'student',
    notes: params.draft.notes,
  })

  await addParticipant({
    registrationId: registration.id,
    competitionId: params.competitionId,
    studentId: params.userId,
    categoryId: params.categoryId,
    divisionId: params.divisionId,
    displayName: params.userName,
    metadata: {
      emergencyContact: params.draft.emergencyContact,
      documents: params.draft.documents,
      eligibilityConfirmed: params.draft.eligibilityConfirmed,
    },
  })

  clearRegistrationDraft(params.competitionId, params.userId)
  return registration
}

export async function markRegistrationPaid(registrationId: string) {
  const { error } = await supabase
    .from('competition_registrations')
    .update({
      payment_status: 'paid',
      payment_amount: null,
    })
    .eq('id', registrationId)

  if (error) throw error
}
