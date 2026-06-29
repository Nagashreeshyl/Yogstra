import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, Clock } from 'lucide-react'
import type { CompetitionParticipant } from '../../domain/competition/models'
import type { CompetitionScore } from '../../domain/competition/models'
import type { ScoringCriterion } from '../../types/judgePortal'
import {
  computeTotalScore,
  validateScoreSubmission,
} from '../../utils/judgeScoringCriteria'
import {
  JudgeScoringError,
  submitJudgeScore,
  updateJudgeScoreDraft,
} from '../../services/judgeScoringService'
import { CriteriaInput } from './CriteriaInput'
import { SubmissionStatus } from './SubmissionStatus'
import { Button } from '../ui/Button'
import { Textarea } from '../ui/Textarea'

interface ScoreCardProps {
  userId: string
  competitionId: string
  categoryId: string
  participant: CompetitionParticipant
  criteria: ScoringCriterion[]
  existingScore: CompetitionScore | null
  isLocked: boolean
  eventId?: string | null
  onSubmitted: () => void
  onBack: () => void
}

export function ScoreCard({
  userId,
  competitionId,
  categoryId,
  participant,
  criteria,
  existingScore,
  isLocked,
  eventId,
  onSubmitted,
  onBack,
}: ScoreCardProps) {
  const readOnly = isLocked || existingScore?.status === 'locked'

  const initialValues = useMemo(() => {
    const values: Record<string, number | ''> = {}
    const stored = existingScore?.criteria as { values?: Record<string, number> } | undefined
    for (const criterion of criteria) {
      const v = stored?.values?.[criterion.key]
      values[criterion.key] = v !== undefined ? v : ''
    }
    return values
  }, [criteria, existingScore])

  const [values, setValues] = useState(initialValues)
  const [comments, setComments] = useState(existingScore?.comments ?? '')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [submitStatus, setSubmitStatus] = useState<
    'idle' | 'submitting' | 'success' | 'error' | 'offline'
  >('idle')
  const [submitMessage, setSubmitMessage] = useState('')
  const [showConfirm, setShowConfirm] = useState(false)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    setValues(initialValues)
    setComments(existingScore?.comments ?? '')
  }, [participant.id, initialValues, existingScore])

  useEffect(() => {
    const timer = window.setInterval(() => setElapsed((e) => e + 1), 1000)
    return () => window.clearInterval(timer)
  }, [participant.id])

  const total = computeTotalScore(
    criteria,
    Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '') as [string, number][],
    ),
  )

  async function handleSubmit() {
    const numericValues = Object.fromEntries(
      Object.entries(values).filter(([, v]) => v !== '') as [string, number][],
    )

    const errors = validateScoreSubmission(criteria, numericValues, comments)
    if (errors.length > 0) {
      setFieldErrors(Object.fromEntries(errors.map((e) => [e.field ?? '_', e.message])))
      setSubmitStatus('error')
      setSubmitMessage(errors[0]?.message ?? 'Validation failed')
      return
    }

    if (!showConfirm) {
      setShowConfirm(true)
      setSubmitMessage('Review your scores, then confirm submission.')
      return
    }

    setSubmitStatus('submitting')
    setFieldErrors({})

    try {
      const input = {
        userId,
        competitionId,
        categoryId,
        participantId: participant.id,
        values: numericValues,
        comments,
        eventId,
      }

      if (existingScore && existingScore.status !== 'locked') {
        await updateJudgeScoreDraft({ ...input, scoreId: existingScore.id })
      } else {
        await submitJudgeScore(input)
      }

      setSubmitStatus('success')
      setShowConfirm(false)
      onSubmitted()
    } catch (err) {
      if (err instanceof JudgeScoringError) {
        const offline = err.message.includes('Offline')
        setSubmitStatus(offline ? 'offline' : 'error')
        setSubmitMessage(err.message)
        if (err.fieldErrors.length > 0) {
          setFieldErrors(
            Object.fromEntries(err.fieldErrors.map((e) => [e.field ?? '_', e.message])),
          )
        }
        if (offline) onSubmitted()
      } else {
        setSubmitStatus('error')
        setSubmitMessage(err instanceof Error ? err.message : 'Submission failed')
      }
    }
  }

  const minutes = String(Math.floor(elapsed / 60)).padStart(2, '0')
  const seconds = String(elapsed % 60).padStart(2, '0')

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background judge-focus-mode">
      <header className="flex items-center gap-3 border-b border-border px-4 py-3 shrink-0">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[12px] border border-border hover:bg-muted touch-manipulation"
          aria-label="Back to participant queue"
        >
          <ArrowLeft size={20} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Scoring</p>
          <h2 className="font-heading text-lg font-semibold truncate">{participant.displayName}</h2>
        </div>
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground shrink-0">
          <Clock size={16} aria-hidden />
          {minutes}:{seconds}
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 max-w-lg mx-auto w-full">
        {criteria.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">
            Scoring criteria are not configured. Contact the organizer.
          </p>
        ) : (
          <div className="space-y-6">
            {criteria.map((criterion) => (
              <CriteriaInput
                key={criterion.key}
                criterion={criterion}
                value={values[criterion.key] ?? ''}
                error={fieldErrors[criterion.key]}
                disabled={readOnly}
                onChange={(value) =>
                  setValues((prev) => ({ ...prev, [criterion.key]: value }))
                }
              />
            ))}

            <div className="rounded-[16px] border-2 border-primary/30 bg-primary/5 px-4 py-4 text-center">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Total</p>
              <p className="font-heading text-4xl font-bold text-foreground">{total.toFixed(2)}</p>
            </div>

            <Textarea
              label="Judge notes"
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              rows={3}
              disabled={readOnly}
              placeholder="Technique notes, deductions explained…"
            />

            {fieldErrors.comments && (
              <p className="text-sm text-red-600" role="alert">
                {fieldErrors.comments}
              </p>
            )}

            <SubmissionStatus status={submitStatus} message={submitMessage} />

            {!readOnly && (
              <div className="sticky bottom-0 bg-background pt-2 pb-4 space-y-2">
                {showConfirm && (
                  <p className="text-sm text-center text-amber-800 dark:text-amber-200 font-medium">
                    Confirm submission? This cannot be undone after the category is locked.
                  </p>
                )}
                <Button
                  size="lg"
                  className="w-full min-h-[52px] text-base touch-manipulation"
                  disabled={submitStatus === 'submitting'}
                  onClick={() => void handleSubmit()}
                >
                  {showConfirm ? 'Confirm submit' : existingScore ? 'Update score' : 'Submit score'}
                </Button>
                {showConfirm && (
                  <Button
                    variant="ghost"
                    className="w-full min-h-[44px]"
                    onClick={() => setShowConfirm(false)}
                  >
                    Go back
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
