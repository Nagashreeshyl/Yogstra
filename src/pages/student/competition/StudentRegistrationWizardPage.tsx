import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CheckCircle2, Save } from 'lucide-react'
import { useApp } from '../../../context/AppContext'
import { useAsyncData } from '../../../hooks/useAsyncData'
import { fetchStudentCompetitionDetail, formatCategoryLabel } from '../../../services/studentCompetitionExperience'
import {
  completeStudentRegistration,
  markRegistrationPaid,
} from '../../../services/studentCompetitionOperations'
import {
  loadRegistrationDraft,
  saveRegistrationDraft,
  clearRegistrationDraft,
  type StudentRegistrationDraft,
} from '../../../utils/studentRegistrationDraft'
import { PageHeader } from '../../../components/shell/PageHeader'
import { ErrorState } from '../../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../../components/shell/LoadingSkeleton'
import { DashboardCard } from '../../../components/student/dashboard/DashboardCard'
import { RegistrationProgress } from '../../../components/student/competition/RegistrationProgress'

const EMPTY_DRAFT = (): StudentRegistrationDraft => ({
  step: 0,
  categoryId: '',
  eligibilityConfirmed: false,
  emergencyContact: { name: '', phone: '', relation: '' },
  documents: { identity: false, medical: false, photo: false, ageProof: false },
  updatedAt: new Date().toISOString(),
})

export function StudentRegistrationWizardPage() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const { user } = useApp()
  const userId = user?.id ?? ''
  const userName = user?.name ?? 'Student'

  const { data, loading, error } = useAsyncData(
    () =>
      userId && id
        ? fetchStudentCompetitionDetail(id, userId)
        : Promise.reject(new Error('Not signed in')),
    [userId, id],
    { enabled: Boolean(userId && id) },
  )

  const [draft, setDraft] = useState<StudentRegistrationDraft>(EMPTY_DRAFT)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completedRegistrationId, setCompletedRegistrationId] = useState<string | null>(null)

  useEffect(() => {
    if (!userId || !id) return
    const saved = loadRegistrationDraft(id, userId)
    if (saved) setDraft(saved)
  }, [userId, id])

  const persistDraft = useCallback(
    (next: StudentRegistrationDraft) => {
      setDraft(next)
      if (userId && id) {
        saveRegistrationDraft(id, userId, next)
      }
    },
    [userId, id],
  )

  const goNext = () => persistDraft({ ...draft, step: Math.min(draft.step + 1, 6) })
  const goBack = () => persistDraft({ ...draft, step: Math.max(draft.step - 1, 0) })

  const handleComplete = async () => {
    if (!userId || !id || !draft.categoryId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const registration = await completeStudentRegistration({
        competitionId: id,
        userId,
        userName,
        categoryId: draft.categoryId,
        divisionId: draft.divisionId,
        draft,
      })
      if (data?.competition.entryFee && data.competition.entryFee > 0) {
        await markRegistrationPaid(registration.id)
      }
      setCompletedRegistrationId(registration.id)
      persistDraft({ ...draft, step: 6 })
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  if (!user || loading) return <LoadingSkeleton variant="page" />

  if (error || !data) {
    return (
      <ErrorState title="Cannot register" message={error ?? 'Competition unavailable.'} />
    )
  }

  if (data.registration) {
    return (
      <div className="text-center py-12">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden />
        <h2 className="mt-4 font-heading text-xl font-semibold">Already registered</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          You're signed up for {data.competition.name}.
        </p>
        <Link
          to={`/dashboard/student/competitions/${id}/prepare`}
          className="mt-6 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
        >
          Go to preparation
        </Link>
      </div>
    )
  }

  const selectedCategory = data.categories.find((c) => c.id === draft.categoryId)
  const entryFee = selectedCategory?.entryFeeOverride ?? data.competition.entryFee

  return (
    <>
      <PageHeader
        title="Registration"
        description={`Join ${data.competition.name}`}
        actions={
          <button
            type="button"
            onClick={() => {
              saveRegistrationDraft(id, userId, draft)
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium hover:bg-muted"
          >
            <Save className="h-4 w-4" aria-hidden />
            Save progress
          </button>
        }
      />

      <RegistrationProgress step={draft.step} />

      <DashboardCard title="" className="mt-6">
        {draft.step === 0 && (
          <fieldset>
            <legend className="mb-4 font-heading text-lg font-semibold">Select category</legend>
            <div className="space-y-2">
              {data.categories.map((cat) => (
                <label
                  key={cat.id}
                  className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-lg border px-4 py-3 text-sm ${
                    draft.categoryId === cat.id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="category"
                    value={cat.id}
                    checked={draft.categoryId === cat.id}
                    onChange={() => persistDraft({ ...draft, categoryId: cat.id, step: 0 })}
                    className="h-4 w-4 accent-primary"
                  />
                  {formatCategoryLabel(cat)}
                </label>
              ))}
            </div>
          </fieldset>
        )}

        {draft.step === 1 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Verify eligibility</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Confirm you meet the age and style requirements for your category.
            </p>
            <label className="flex min-h-[44px] cursor-pointer items-start gap-3 rounded-lg border border-border px-4 py-3">
              <input
                type="checkbox"
                checked={draft.eligibilityConfirmed}
                onChange={(e) =>
                  persistDraft({ ...draft, eligibilityConfirmed: e.target.checked })
                }
                className="mt-1 h-4 w-4 accent-primary"
              />
              <span className="text-sm">
                I confirm I am eligible for{' '}
                <strong>{selectedCategory ? formatCategoryLabel(selectedCategory) : 'this category'}</strong>{' '}
                and agree to follow all competition rules.
              </span>
            </label>
          </div>
        )}

        {draft.step === 2 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Required documents</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Mark each document as ready. Uploads will be verified by the organizer.
            </p>
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
                      persistDraft({
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
                      persistDraft({
                        ...draft,
                        emergencyContact: {
                          ...draft.emergencyContact,
                          [field]: e.target.value,
                        },
                      })
                    }
                    className="min-h-[44px] w-full rounded-lg border border-border bg-elevated px-3 text-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    required
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
              <div className="flex justify-between gap-4 border-b border-border py-2">
                <dt className="text-muted-foreground">Category</dt>
                <dd className="font-medium">
                  {selectedCategory ? formatCategoryLabel(selectedCategory) : '—'}
                </dd>
              </div>
              <div className="flex justify-between gap-4 border-b border-border py-2">
                <dt className="text-muted-foreground">Emergency contact</dt>
                <dd className="text-right font-medium">
                  {draft.emergencyContact.name} ({draft.emergencyContact.relation})
                  <br />
                  {draft.emergencyContact.phone}
                </dd>
              </div>
              <div className="flex justify-between gap-4 py-2">
                <dt className="text-muted-foreground">Entry fee</dt>
                <dd className="font-medium">
                  {entryFee > 0 ? `₹${entryFee.toLocaleString('en-IN')}` : 'Free'}
                </dd>
              </div>
            </dl>
          </div>
        )}

        {draft.step === 5 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Payment</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {entryFee > 0
                ? `Complete payment of ₹${entryFee.toLocaleString('en-IN')} to finalize registration.`
                : 'No payment required for this event.'}
            </p>
            {submitError && (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handleComplete()}
              className="inline-flex min-h-[44px] w-full items-center justify-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-60 sm:w-auto"
            >
              {submitting ? 'Processing…' : entryFee > 0 ? 'Pay & submit' : 'Submit registration'}
            </button>
          </div>
        )}

        {draft.step === 6 && completedRegistrationId && (
          <div className="text-center py-6">
            <CheckCircle2 className="mx-auto h-14 w-14 text-primary" aria-hidden />
            <h2 className="mt-4 font-heading text-xl font-semibold">You're in!</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Registration submitted for {data.competition.name}. Start preparing for competition day.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to={`/dashboard/student/competitions/${id}/prepare`}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground"
              >
                Preparation dashboard
              </Link>
              <button
                type="button"
                onClick={() => {
                  clearRegistrationDraft(id, userId)
                  navigate(`/dashboard/student/competitions/${id}`)
                }}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-5 py-2 text-sm font-medium"
              >
                View competition
              </button>
            </div>
          </div>
        )}

        {draft.step < 6 && (
          <div className="mt-6 flex flex-wrap gap-3 border-t border-border pt-4">
            {draft.step > 0 && (
              <button
                type="button"
                onClick={goBack}
                className="inline-flex min-h-[44px] items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
              >
                Back
              </button>
            )}
            {draft.step < 5 && (
              <button
                type="button"
                onClick={goNext}
                disabled={
                  (draft.step === 0 && !draft.categoryId) ||
                  (draft.step === 1 && !draft.eligibilityConfirmed) ||
                  (draft.step === 3 &&
                    (!draft.emergencyContact.name ||
                      !draft.emergencyContact.phone ||
                      !draft.emergencyContact.relation))
                }
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary-hover disabled:opacity-50"
              >
                Continue
              </button>
            )}
            {draft.step === 4 && (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground"
              >
                Proceed to payment
              </button>
            )}
          </div>
        )}
      </DashboardCard>
    </>
  )
}
