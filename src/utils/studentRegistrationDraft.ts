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

function parseDraftKey(key: string): { competitionId: string; userId: string } | null {
  if (!key.startsWith(`${DRAFT_PREFIX}:`)) return null
  const rest = key.slice(DRAFT_PREFIX.length + 1)
  const lastColon = rest.lastIndexOf(':')
  if (lastColon <= 0) return null
  return {
    competitionId: rest.slice(0, lastColon),
    userId: rest.slice(lastColon + 1),
  }
}

export function listRegistrationDrafts(userId: string): Array<{
  competitionId: string
  draft: StudentRegistrationDraft
}> {
  const drafts: Array<{ competitionId: string; draft: StudentRegistrationDraft }> = []
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (!key) continue
      const parsed = parseDraftKey(key)
      if (!parsed || parsed.userId !== userId) continue
      const draft = loadRegistrationDraft(parsed.competitionId, userId)
      if (draft && draft.step < 6) {
        drafts.push({ competitionId: parsed.competitionId, draft })
      }
    }
  } catch {
    return []
  }
  return drafts.sort(
    (a, b) => new Date(b.draft.updatedAt).getTime() - new Date(a.draft.updatedAt).getTime(),
  )
}

export function hasRegistrationDraft(competitionId: string, userId: string): boolean {
  const draft = loadRegistrationDraft(competitionId, userId)
  return Boolean(draft && draft.step < 6)
}
