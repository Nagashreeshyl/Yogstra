/** Scoring criterion defined in competition.settings.scoringCriteria */
export interface ScoringCriterion {
  key: string
  label: string
  maxScore: number
  minScore?: number
  weight?: number
  type?: 'score' | 'penalty'
  required?: boolean
}

export interface ScoreAuditMetadata {
  judgeId: string
  userId: string
  timestamp: string
  competitionId: string
  categoryId: string
  participantId: string
  clientSubmittedAt: string
}

export interface ScoreCriteriaPayload {
  values: Record<string, number>
  audit: ScoreAuditMetadata
}

export interface PendingOfflineScore {
  id: string
  payload: {
    competitionId: string
    participantId: string
    judgeId: string
    categoryId: string
    eventId: string | null
    criteria: ScoreCriteriaPayload
    totalScore: number
    comments: string | null
  }
  createdAt: string
  retries: number
  lastError?: string
}

export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error'
