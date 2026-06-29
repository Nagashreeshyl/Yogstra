import type { CompetitionScore } from '../../domain/competition/models'
import type { ScoringCriterion } from '../../types/judgePortal'

interface ReviewPanelProps {
  scores: CompetitionScore[]
  criteria: ScoringCriterion[]
  participantNames: Map<string, string>
  isLocked: boolean
}

export function ReviewPanel({ scores, criteria, participantNames, isLocked }: ReviewPanelProps) {
  if (scores.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No submitted scores yet for this category.
      </p>
    )
  }

  return (
    <div className="space-y-3">
      {isLocked && (
        <p className="text-sm text-muted-foreground rounded-[12px] bg-muted px-3 py-2">
          Category locked — scores are read-only.
        </p>
      )}
      {scores.map((score) => {
        const stored = score.criteria as { values?: Record<string, number> }
        const name = participantNames.get(score.participantId) ?? 'Participant'

        return (
          <article
            key={score.id}
            className="rounded-[12px] border border-border px-4 py-3"
          >
            <div className="flex items-center justify-between gap-2 mb-2">
              <h3 className="font-medium text-foreground">{name}</h3>
              <span className="font-heading text-lg font-semibold">{score.totalScore}</span>
            </div>
            <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
              {criteria.map((criterion) => (
                <div key={criterion.key} className="flex justify-between gap-2">
                  <dt className="text-muted-foreground truncate">{criterion.label}</dt>
                  <dd className="font-medium">
                    {stored.values?.[criterion.key] ?? '—'}
                  </dd>
                </div>
              ))}
            </dl>
            {score.comments && (
              <p className="mt-2 text-sm text-muted-foreground border-t border-border pt-2">
                {score.comments}
              </p>
            )}
            <p className="mt-1 text-xs text-muted-foreground capitalize">
              {score.status}
              {score.submittedAt
                ? ` · ${new Date(score.submittedAt).toLocaleString('en-IN')}`
                : ''}
            </p>
          </article>
        )
      })}
    </div>
  )
}
