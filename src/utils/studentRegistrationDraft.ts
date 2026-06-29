const DRAFT_PREFIX = 'yogstra-student-registration-draft'

export interface StudentRegistrationDraft {
  step: number
  categoryId: string
  divisionId?: string
  eligibilityConfirmed: boolean
  emergencyContact: {
    name: string
    phone: string
    relation: string
  }
  documents: {
    identity: boolean
    medical: boolean
    photo: boolean
    ageProof: boolean
  }
  notes?: string
  updatedAt: string
}

function draftKey(competitionId: string, userId: string) {
  return `${DRAFT_PREFIX}:${competitionId}:${userId}`
}

export function loadRegistrationDraft(
  competitionId: string,
  userId: string,
): StudentRegistrationDraft | null {
  try {
    const raw = localStorage.getItem(draftKey(competitionId, userId))
    if (!raw) return null
    return JSON.parse(raw) as StudentRegistrationDraft
  } catch {
    return null
  }
}

export function saveRegistrationDraft(
  competitionId: string,
  userId: string,
  draft: Omit<StudentRegistrationDraft, 'updatedAt'>,
) {
  const payload: StudentRegistrationDraft = {
    ...draft,
    updatedAt: new Date().toISOString(),
  }
  localStorage.setItem(draftKey(competitionId, userId), JSON.stringify(payload))
  return payload
}

export function clearRegistrationDraft(competitionId: string, userId: string) {
  localStorage.removeItem(draftKey(competitionId, userId))
}

export function getRegistrationProgress(draft: StudentRegistrationDraft | null): number {
  if (!draft) return 0
  return Math.round(((draft.step + 1) / 7) * 100)
}
