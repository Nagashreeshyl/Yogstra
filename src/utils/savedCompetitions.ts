const SAVED_KEY = 'yogstra-saved-competitions'

export function loadSavedCompetitionIds(userId: string): string[] {
  try {
    const raw = localStorage.getItem(`${SAVED_KEY}:${userId}`)
    if (!raw) return []
    return JSON.parse(raw) as string[]
  } catch {
    return []
  }
}

export function toggleSavedCompetition(userId: string, competitionId: string): boolean {
  const current = loadSavedCompetitionIds(userId)
  const exists = current.includes(competitionId)
  const next = exists
    ? current.filter((id) => id !== competitionId)
    : [...current, competitionId]
  localStorage.setItem(`${SAVED_KEY}:${userId}`, JSON.stringify(next))
  return !exists
}

export function isCompetitionSaved(userId: string, competitionId: string): boolean {
  return loadSavedCompetitionIds(userId).includes(competitionId)
}
