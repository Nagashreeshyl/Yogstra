import type { ScoringCriterion } from '../types/judgePortal'

/** Default yoga competition scoring rubric applied when a competition is created. */
export const DEFAULT_SCORING_CRITERIA: ScoringCriterion[] = [
  { key: 'technique', label: 'Technique', maxScore: 10, weight: 1, required: true, type: 'score' },
  { key: 'flexibility', label: 'Flexibility', maxScore: 10, weight: 1, required: true, type: 'score' },
  { key: 'presentation', label: 'Presentation', maxScore: 10, weight: 1, required: true, type: 'score' },
]

export function defaultCompetitionSettings() {
  return {
    scoringCriteria: DEFAULT_SCORING_CRITERIA,
    lockedCategories: [] as string[],
  }
}
