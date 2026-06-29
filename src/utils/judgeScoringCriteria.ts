import type { ScoringCriterion } from '../types/judgePortal'

type RawCriterion = Record<string, unknown>

function parseCriterion(raw: RawCriterion): ScoringCriterion | null {
  const key = typeof raw.key === 'string' ? raw.key : typeof raw.id === 'string' ? raw.id : null
  const label = typeof raw.label === 'string' ? raw.label : typeof raw.name === 'string' ? raw.name : null
  const maxScore = Number(raw.maxScore ?? raw.max ?? 10)

  if (!key || !label || Number.isNaN(maxScore)) return null

  return {
    key,
    label,
    maxScore,
    minScore: raw.minScore !== undefined ? Number(raw.minScore) : raw.type === 'penalty' ? -10 : 0,
    weight: raw.weight !== undefined ? Number(raw.weight) : 1,
    type: raw.type === 'penalty' ? 'penalty' : 'score',
    required: raw.required !== false,
  }
}

/** Reads scoring criteria from competition.settings — never uses hardcoded defaults. */
export function getScoringCriteriaFromSettings(settings: Record<string, unknown>): ScoringCriterion[] {
  const configured = settings.scoringCriteria ?? settings.scoring_criteria

  if (!Array.isArray(configured)) return []

  return configured
    .map((item) => parseCriterion(item as RawCriterion))
    .filter((item): item is ScoringCriterion => item !== null)
}

export function isCategoryLocked(
  settings: Record<string, unknown>,
  categoryId: string,
): boolean {
  const locked = settings.lockedCategories ?? settings.locked_categories
  if (!Array.isArray(locked)) return false
  return locked.includes(categoryId)
}

export function computeTotalScore(
  criteria: ScoringCriterion[],
  values: Record<string, number>,
): number {
  let total = 0
  for (const criterion of criteria) {
    const value = values[criterion.key]
    if (value === undefined || Number.isNaN(value)) continue
    const weight = criterion.weight ?? 1
    if (criterion.type === 'penalty') {
      total -= Math.abs(value) * weight
    } else {
      total += value * weight
    }
  }
  return Math.round(total * 100) / 100
}

export interface ScoreValidationError {
  field?: string
  message: string
}

export function validateScoreSubmission(
  criteria: ScoringCriterion[],
  values: Record<string, number>,
  comments: string,
): ScoreValidationError[] {
  const errors: ScoreValidationError[] = []

  if (criteria.length === 0) {
    errors.push({ message: 'Scoring criteria are not configured for this competition.' })
    return errors
  }

  for (const criterion of criteria) {
    const value = values[criterion.key]
    const min = criterion.minScore ?? (criterion.type === 'penalty' ? -criterion.maxScore : 0)
    const max = criterion.maxScore

    if (criterion.required && (value === undefined || Number.isNaN(value))) {
      errors.push({
        field: criterion.key,
        message: `${criterion.label} is required.`,
      })
      continue
    }

    if (value === undefined) continue

    if (criterion.type !== 'penalty' && value < 0) {
      errors.push({
        field: criterion.key,
        message: `${criterion.label} cannot be negative.`,
      })
    }

    if (value < min || value > max) {
      errors.push({
        field: criterion.key,
        message: `${criterion.label} must be between ${min} and ${max}.`,
      })
    }
  }

  if (!comments.trim()) {
    errors.push({ field: 'comments', message: 'Add a brief comment before submitting.' })
  }

  return errors
}
