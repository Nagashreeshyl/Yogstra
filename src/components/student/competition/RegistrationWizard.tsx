import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { CheckCircle2, Save } from 'lucide-react'
import type { CompetitionCategory, CompetitionRegistration } from '../../../domain/competition/models'
import {
  completeStudentRegistration,
  markRegistrationPaid,
  updateStudentRegistrationDocuments,
} from '../../../services/studentCompetitionOperations'
import {
  clearRegistrationDraft,
  loadRegistrationDraft,
  saveRegistrationDraft,
  type StudentRegistrationDraft,
} from '../../../utils/studentRegistrationDraft'
import { formatCategoryLabel } from '../../../services/studentCompetitionExperience'
import { formatUserFacingError } from '../../../utils/format'
import { RegistrationProgress } from './RegistrationProgress'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { CompetitionDocumentUploads } from './CompetitionDocumentUploads'
import { Toast } from '../../ui/Toast'

const DOC_KEYS = ['identity', 'medical', 'photo', 'ageProof'] as const

const EMPTY_DRAFT = (): StudentRegistrationDraft => ({
  step: 0,
  categoryId: '',
  eligibilityConfirmed: false,
  emergencyContact: { name: '', phone: '', relation: '' },
  documents: { identity: false, medical: false, photo: false, ageProof: false },
  documentFiles: {},
  updatedAt: new Date().toISOString(),
})

interface RegistrationWizardProps {
  competitionId: string
  userId: string
  userName: string
  userEmail?: string
  categories: CompetitionCategory[]
  entryFee: number
  competitionName: string
  existingRegistration?: CompetitionRegistration | null
  initialParticipantMetadata?: Record<string, unknown> | null
  onComplete: () => void
}

function documentsComplete(draft: StudentRegistrationDraft): boolean {
  return (
    DOC_KEYS.every((key) => draft.documents[key]) &&
    DOC_KEYS.every((key) => Boolean(draft.documentFiles?.[key]))
  )
}

function canAdvance(step: number, draft: StudentRegistrationDraft): boolean {
  switch (step) {
    case 0:
      return draft.eligibilityConfirmed
    case 1:
      return Boolean(draft.categoryId)
    case 2:
      return documentsComplete(draft)
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

function paymentComplete(registration?: CompetitionRegistration | null) {
  return registration?.paymentStatus === 'paid' || registration?.paymentStatus === 'waived'
}

export function RegistrationWizard({
  competitionId,
  userId,
  userName,
  userEmail,
  categories,
  entryFee,
  competitionName,
  existingRegistration,
  initialParticipantMetadata,
  onComplete,
}: RegistrationWizardProps) {
  const navigate = useNavigate()
  const [draft, setDraft] = useState<StudentRegistrationDraft>(EMPTY_DRAFT)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [completed, setCompleted] = useState(false)
  const [saveToast, setSaveToast] = useState<string | null>(null)
  const [resumedDraft, setResumedDraft] = useState(false)
  const [activeRegistration, setActiveRegistration] = useState(existingRegistration ?? null)

  useEffect(() => {
    const saved = loadRegistrationDraft(competitionId, userId)
    const meta = initialParticipantMetadata ?? {}
    const metaDocs = (meta.documents ?? {}) as StudentRegistrationDraft['documents']
    const metaFiles = (meta.documentFiles ?? {}) as StudentRegistrationDraft['documentFiles']
    const metaEmergency = (meta.emergencyContact ?? {
      name: '',
      phone: '',
      relation: '',
    }) as StudentRegistrationDraft['emergencyContact']

    if (saved) {
      setDraft({
        ...saved,
        registrationId: saved.registrationId ?? existingRegistration?.id,
        documentFiles: { ...metaFiles, ...saved.documentFiles },
      })
      if (saved.step > 0) setResumedDraft(true)
    } else if (existingRegistration) {
      const unpaid = !paymentComplete(existingRegistration)
      setDraft({
        ...EMPTY_DRAFT(),
        step: unpaid ? 5 : 2,
        registrationId: existingRegistration.id,
        categoryId: existingRegistration.categoryId ?? '',
        documents: {
          identity: Boolean(metaDocs.identity),
          medical: Boolean(metaDocs.medical),
          photo: Boolean(metaDocs.photo),
          ageProof: Boolean(metaDocs.ageProof),
        },
        documentFiles: metaFiles ?? {},
        emergencyContact: metaEmergency,
        eligibilityConfirmed: Boolean(meta.eligibilityConfirmed),
      })
      setResumedDraft(true)
    }
    setActiveRegistration(existingRegistration ?? null)
  }, [competitionId, userId, existingRegistration, initialParticipantMetadata])

  const persist = useCallback(
    (next: StudentRegistrationDraft) => {
      setDraft(next)
      saveRegistrationDraft(competitionId, userId, next)
    },
    [competitionId, userId],
  )

  const selectedCategory = categories.find((c) => c.id === draft.categoryId)
  const fee = selectedCategory?.entryFeeOverride ?? entryFee

  const handleSaveAndContinueLater = () => {
    saveRegistrationDraft(competitionId, userId, {
      ...draft,
      registrationId: activeRegistration?.id ?? draft.registrationId,
    })
    setSaveToast('Progress saved. You can resume registration anytime from Competitions.')
    window.setTimeout(() => {
      navigate('/dashboard/student/competitions')
    }, 900)
  }

  const handleSubmitApplication = async () => {
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
        existingRegistration: activeRegistration,
      })
      setActiveRegistration(registration)
      persist({ ...draft, registrationId: registration.id, step: 5 })
    } catch (err) {
      setSubmitError(formatUserFacingError(err, 'Could not save your application.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handlePay = async () => {
    setSubmitting(true)
    setSubmitError(null)
    try {
      let registration = activeRegistration
      if (!registration?.id && !draft.registrationId) {
        registration = await completeStudentRegistration({
          competitionId,
          userId,
          userName,
          categoryId: draft.categoryId,
          divisionId: draft.divisionId,
          draft,
          existingRegistration: activeRegistration,
        })
        setActiveRegistration(registration)
        persist({ ...draft, registrationId: registration.id })
      }

      const registrationId = registration?.id ?? draft.registrationId
      if (!registrationId) {
        throw new Error('Registration not found. Please review your application first.')
      }

      await updateStudentRegistrationDocuments({
        registrationId,
        studentId: userId,
        draft,
      })
      await markRegistrationPaid(registrationId, fee, {
        studentName: userName,
        studentEmail: userEmail,
        competitionName,
      })
      clearRegistrationDraft(competitionId, userId)
      setCompleted(true)
      persist({ ...draft, registrationId, step: 6 })
      onComplete()
    } catch (err) {
      setSubmitError(formatUserFacingError(err, 'Payment failed. Please try again.'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleDocumentsOnly = async () => {
    const registrationId = activeRegistration?.id ?? draft.registrationId
    if (!registrationId) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      await updateStudentRegistrationDocuments({
        registrationId,
        studentId: userId,
        draft,
      })
      setSaveToast('Documents updated successfully.')
      onComplete()
    } catch (err) {
      setSubmitError(formatUserFacingError(err, 'Could not update documents.'))
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

  const documentsOnlyMode =
    Boolean(activeRegistration) &&
    paymentComplete(activeRegistration) &&
    !documentsComplete(draft)

  return (
    <div>
      {saveToast && (
        <Toast message={saveToast} type="success" onClose={() => setSaveToast(null)} />
      )}

      {resumedDraft && (
        <p className="mb-4 rounded-lg border border-primary/30 bg-primary/5 px-4 py-3 text-sm text-foreground">
          Welcome back — your saved progress was restored. Continue where you left off.
        </p>
      )}

      {activeRegistration && !paymentComplete(activeRegistration) && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-100">
          You have a pending application. Complete payment to confirm your spot — no duplicate
          registration will be created.
        </p>
      )}

      <div className="mb-4 flex justify-end">
        <button
          type="button"
          onClick={handleSaveAndContinueLater}
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
            <h2 className="mb-2 font-heading text-lg font-semibold">Required documents</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              Upload each document, then confirm with the checkbox.
            </p>
            <CompetitionDocumentUploads
              competitionId={competitionId}
              userId={userId}
              documents={draft.documents}
              documentFiles={draft.documentFiles ?? {}}
              onChange={(documents, documentFiles) =>
                persist({ ...draft, documents, documentFiles })
              }
            />
            {documentsOnlyMode && (
              <button
                type="button"
                disabled={submitting || !documentsComplete(draft)}
                onClick={() => void handleDocumentsOnly()}
                className="mt-4 inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-50"
              >
                {submitting ? 'Saving…' : 'Save documents'}
              </button>
            )}
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
            {submitError && (
              <p className="mt-4 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
          </div>
        )}

        {draft.step === 5 && (
          <div>
            <h2 className="mb-4 font-heading text-lg font-semibold">Payment</h2>
            <p className="mb-4 text-sm text-muted-foreground">
              {fee > 0
                ? `Pay ₹${fee.toLocaleString('en-IN')} to complete registration.`
                : 'No payment required — confirm to enroll.'}
            </p>
            {submitError && (
              <p className="mb-4 text-sm text-destructive" role="alert">
                {submitError}
              </p>
            )}
            <button
              type="button"
              disabled={submitting}
              onClick={() => void handlePay()}
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
            {draft.step < 4 && (
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
                disabled={submitting}
                onClick={() => void handleSubmitApplication()}
                className="inline-flex min-h-[44px] items-center rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {submitting ? 'Saving…' : 'Proceed to payment'}
              </button>
            )}
          </div>
        )}
      </DashboardCard>
    </div>
  )
}
