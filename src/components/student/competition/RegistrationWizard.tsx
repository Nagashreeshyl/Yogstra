import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, Save } from 'lucide-react'
import type { CompetitionCategory } from '../../../domain/competition/models'
import { completeStudentRegistration, markRegistrationPaid } from '../../../services/studentCompetitionOperations'
import {
  loadRegistrationDraft,
  saveRegistrationDraft,
  type StudentRegistrationDraft,
} from '../../../utils/studentRegistrationDraft'
import { formatCategoryLabel } from '../../../services/studentCompetitionExperience'
import { RegistrationProgress } from './RegistrationProgress'
import { DashboardCard } from '../../student/dashboard/DashboardCard'

const EMPTY_DRAFT = (): StudentRegistrationDraft => ({
  step: 0,
  categoryId: '',
  eligibilityConfirmed: false,
  emergencyContact: { name: '', phone: '', relation: '' },
  documents: { identity: false, medical: false, photo: false, ageProof: false },
  updatedAt: new Date().toISOString(),
})

interface RegistrationWizardProps {
  competitionId: string
  userId: string
  userName: string
  categories: CompetitionCategory[]
  entryFee: number
  competitionName: string
  onComplete: () => void
}

function canAdvance(step: number, draft: StudentRegistrationDraft): boolean {
  switch (step) {
    case 0:
      return draft.eligibilityConfirmed
    case 1:
      return Boolean(draft.categoryId)
    case 2:
      return Object.values(draft.documents).every(Boolean)
    case 3:
      return Boolean(
        draft.emergencyContact.name &&
          draft.emergencyContact.phone &&
          draft.emergencyContact.relation,
      )
    case 4:
      return true
    default:
      return true
  }
}

export function RegistrationWizard({
  competitionId,
  userId,
  userName,
  categories,
  entryFee,
  competitionName,
  onComplete,
}: RegistrationWizardProps) {
  const [draft, setDraft] = useState<StudentRegistrationDraft>(EMPTY_DRAFT)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)

  useEffect(() => {
    const saved = loadRegistrationDraft(competitionId, userId)
    if (saved) setDraft(saved)
  }, [competitionId, userId])

  const persist = useCallback(
    (next: StudentRegistrationDraft) => {
      setDraft(next)
      saveRegistrationDraft(competitionId, userId, next)
    },
    [competitionId, userId],
  )

  const selectedCategory = categories.find((c) => c.id === draft.categoryId)
  const fee = selectedCategory?.entryFeeOverride ?? entryFee

  const handleSubmit = async () => {
    if (!draft.categoryId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const registration = await completeStudentRegistration({
        competitionId,
        userId,
        userName,
        categoryId: draft.categoryId,
        divisionId: draft.divisionId,
        draft,
      })
      if (fee > 0) await markRegistrationPaid(registration.id)
      setCompleted(true)
      persist({ ...draft, step: 6 })
      onComplete()
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (completed && draft.step === 6) {
    return (
      <div className="py-8 text-center">
        <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden />
        <h2 className="mt-4 font-heading text-xl font-semibold">You're registered!</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Your spot for {competitionName} is confirmed. Start preparing now.
        </p>
        <Link
          to={`/dashboard/student/competitions/${competitionId}/preparation`}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Open preparation dashboard
        </Link>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={() => saveRegistrationDraft(competitionId, userId, draft)}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
        >
          <Save className="h-4 w-4" aria-hidden />
          Save & continue later
        </button>
      </div>

      <RegistrationProgress step={draft.step} />

      <DashboardCard title="" className="mt-6">
        {draft.step === 0 && (
          <fieldset>
            <legend className="mb-4 font-heading text-lg font-semibold">Eligibility</legend>
            <p className="mb-4 text-sm text-muted-foreground">
              Confirm you meet the competition requirements before selecting a category.
            </p>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={draft.eligibilityConfirmed}
                onChange={(e) => persist({ ...draft, eligibilityConfirmed: e.target.checked })}
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm">
                I confirm I am eligible and agree to all competition rules and code of conduct.
              </span>
            </label>
          </fieldset>
        )}

        {draft.step === 1 && (
          <fieldset>
            <legend className="mb-4 font-heading text-lg font-semibold">Category selection</legend>
            <div className="space-y-2">
              {categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                    draft.categoryId === cat.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    checked={draft.categoryId === cat.id}
                    onChange={() => persist({ ...draft, categoryId: cat.id })}
                    className="h-4 w-4 accent-primary"
                  />
                  {formatCategoryLabel(cat)}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {draft.step === 2 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Documents</h2>
            <div className="space-y-2">
              {(
                [
                  ['identity', 'Government ID'],
                  ['medical', 'Medical fitness certificate'],
                  ['photo', 'Passport-size photo'],
                  ['ageProof', 'Age proof'],
                ] as const
              ).map(([key, label]) => (
                <label
                  key={key}
                  className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border border-border px-4 py-3 text-sm"
                >
                  <input
                    type="checkbox"
                    checked={draft.documents[key]}
                    onChange={(e) =>
                      persist({
                        ...draft,
                        documents: { ...draft.documents, [key]: e.target.checked },
                      })
                    }
                    className="h-4 w-4 accent-primary"
                  />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {draft.step === 3 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Emergency contact</h2>
            <div className="space-y-4">
              {(['name', 'phone', 'relation'] as const).map((field) => (
                <label key={field} className="block">
                  <span className="mb-1 block text-sm font-medium capitalize">{field}</span>
                  <input
                    type={field === 'phone' ? 'tel' : 'text'}
                    value={draft.emergencyContact[field]}
                    onChange={(e) =>
                      persist({
                        ...draft,
                        emergencyContact: { ...draft.emergencyContact, [field]: e.target.value },
                      })
                    }
                    required
                    className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  />
                </label>
              ))}
            </div>
          </div>
        )}

        {draft.step === 4 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Review</h2>
            <dl className="space-y-2 text-sm">
              <div className="flex justify-between border-b border-border py-2">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">
                  {selectedCategory ? formatCategoryLabel(selectedCategory) : '—'}
                </dd>
              </div>
              <div className="flex justify-between border-b border-border py-2">
                <dt className="text-muted-foreground">Emergency contact</dt>
                <dd className="text-right font-medium">
                  {draft.emergencyContact.name} · {draft.emergencyContact.phone}
                </dd>
              </div>
              <div className="flex justify-between py-2">
                <dt className="text-muted-foreground">Entry fee</dt>
                <dd className="font-medium">{fee > 0 ? `₹${fee.toLocaleString('en-IN')}` : 'Free'}</dd>
              </div>
            </dl>
          </div>
        )}

        {draft.step === 5 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Payment</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {fee > 0
                ? `Pay ₹${fee.toLocaleString('en-IN')} to complete registration.`
                : 'No payment required.'}
            </p>
            {submitError && (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleSubmit()}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60 sm:w-auto"
            >
              {submitting ? 'Processing…' : fee > 0 ? 'Pay & confirm' : 'Confirm registration'}
            </button>
          </div>
        )}

        {draft.step < 6 && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
            {draft.step > 0 && (
              <button
                type="button"
                onClick={() => persist({ ...draft, step: draft.step - 1 })}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
            )}
            {draft.step < 5 && (
              <button
                type="button"
                disabled={!canAdvance(draft.step, draft)}
                onClick={() => persist({ ...draft, step: draft.step + 1 })}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {draft.step === 4 && (
              <button
                type="button"
                onClick={() => persist({ ...draft, step: 5 })}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Proceed to payment
              </button>
            )}
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
