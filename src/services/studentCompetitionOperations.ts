import { supabase } from '../lib/supabase'
import { submitRegistration, addParticipant } from './registrationService'
import { clearRegistrationDraft, type StudentRegistrationDraft } from '../utils/studentRegistrationDraft'
import { formatUserFacingError } from '../utils/format'

export async function completeStudentRegistration(params: {
  competitionId: string
  userId: string
  userName: string
  categoryId: string
  divisionId?: string
  draft: StudentRegistrationDraft
}) {
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new Error('Not signed in')

  const registrantId = user.id

  let registration
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
      metadata: {
        emergencyContact: params.draft.emergencyContact,
        documents: params.draft.documents,
        eligibilityConfirmed: params.draft.eligibilityConfirmed,
      },
    })
  } catch (err) {
    throw new Error(formatUserFacingError(err, 'Could not save participant details.'))
  }

  clearRegistrationDraft(params.competitionId, registrantId)
  return registration
}

export async function markRegistrationPaid(registrationId: string, amount: number) {
  const { error } = await supabase
    .from('competition_registrations')
    .update({
      payment_status: amount > 0 ? 'paid' : 'waived',
      payment_amount: amount > 0 ? amount : null,
      status: 'confirmed',
      confirmed_at: new Date().toISOString(),
    })
    .eq('id', registrationId)

  if (error) {
    throw new Error(formatUserFacingError(error, 'Payment could not be recorded.'))
  }
}
