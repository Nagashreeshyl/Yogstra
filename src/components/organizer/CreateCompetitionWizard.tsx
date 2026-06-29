import { useState } from 'react'
import { X } from 'lucide-react'
import type {
  CompetitionAgeGroup,
  CompetitionFormat,
  CompetitionScope,
  CompetitionStyleType,
  CreateCompetitionCategoryInput,
  CreateCompetitionInput,
} from '../../domain/competition/models'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import { createAndPublishCompetition } from '../../services/organizerOperations'
import { InstructionPanel } from '../ui/InstructionPanel'
import { LabelWithHelp } from '../ui/HelpTooltip'

const STEPS = [
  'Details',
  'Categories',
  'Divisions',
  'Registration',
  'Judges',
  'Schedule',
  'Review',
  'Publish',
] as const

type WizardCategory = Omit<CreateCompetitionCategoryInput, 'competitionId'>
type WizardDivision = { categoryIndex: number; name: string; code?: string }
type WizardEvent = { name: string; startsAt: string; endsAt?: string; venue?: string; stage?: string }

interface CreateCompetitionWizardProps {
  open: boolean
  onClose: () => void
  createdBy: string
  onCreated: (competitionId: string) => void
}

const defaultDetails: CreateCompetitionInput = {
  name: '',
  description: '',
  venue: '',
  city: '',
  state: '',
  country: 'IN',
  entryFee: 0,
  format: 'individual',
  scope: 'friendly',
}

export function CreateCompetitionWizard({
  open,
  onClose,
  createdBy,
  onCreated,
}: CreateCompetitionWizardProps) {
  const [step, setStep] = useState(0)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [details, setDetails] = useState<CreateCompetitionInput>(defaultDetails)
  const [categories, setCategories] = useState<WizardCategory[]>([
    { name: 'Open Traditional', ageGroup: 'open', styleType: 'traditional' },
  ])
  const [divisions, setDivisions] = useState<WizardDivision[]>([])
  const [maxParticipants, setMaxParticipants] = useState<number | ''>('')
  const [registrationDeadline, setRegistrationDeadline] = useState('')
  const [rules, setRules] = useState('')
  const [events, setEvents] = useState<WizardEvent[]>([
    { name: 'Finals', startsAt: '', venue: '' },
  ])
  const [openRegistration, setOpenRegistration] = useState(true)

  if (!open) return null

  function reset() {
    setStep(0)
    setDetails(defaultDetails)
    setCategories([{ name: 'Open Traditional', ageGroup: 'open', styleType: 'traditional' }])
    setDivisions([])
    setMaxParticipants('')
    setRegistrationDeadline('')
    setRules('')
    setEvents([{ name: 'Finals', startsAt: '', venue: '' }])
    setOpenRegistration(true)
    setError(null)
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handlePublish() {
    if (!details.name.trim()) {
      setError('Competition name is required.')
      return
    }
    if (
      details.startDate &&
      details.endDate &&
      new Date(details.endDate) < new Date(details.startDate)
    ) {
      setError('End date must be on or after the start date.')
      return
    }
    if (maxParticipants !== '' && Number(maxParticipants) <= 0) {
      setError('Maximum participants must be greater than zero.')
      return
    }
    setBusy(true)
    setError(null)
    try {
      const competition = await createAndPublishCompetition(
        {
          ...details,
          name: details.name.trim(),
          maxParticipants: maxParticipants === '' ? undefined : Number(maxParticipants),
          registrationDeadline: registrationDeadline || undefined,
          rules: rules || undefined,
          startDate: details.startDate || undefined,
          endDate: details.endDate || undefined,
        },
        createdBy,
        {
          categories: categories.map((c) => ({ ...c, competitionId: '' })),
          divisions,
          events: events.filter((e) => e.name.trim() && e.startsAt.trim()),
          openRegistration,
        },
      )
      onCreated(competition.id)
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create competition.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="wizard-title"
    >
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-t-[20px] sm:rounded-[20px] border border-border bg-elevated shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-elevated px-5 py-4">
          <div>
            <h2 id="wizard-title" className="font-heading text-lg font-semibold">
              Create competition
            </h2>
            <p className="text-sm text-muted-foreground">
              Step {step + 1} of {STEPS.length}: {STEPS[step]}
            </p>
          </div>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-[16px] p-2 hover:bg-muted"
            aria-label="Close wizard"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-5 py-4">
          <InstructionPanel
            storageKey="competition-creation-wizard"
            title="Competition creation"
            steps={[
              { label: 'Create competition' },
              { label: 'Configure categories' },
              { label: 'Assign judges' },
              { label: 'Publish registrations' },
              { label: 'Publish results' },
            ]}
            className="mb-6"
          />

          <div className="mb-6 flex gap-1">
            {STEPS.map((label, index) => (
              <div
                key={label}
                className={`h-1 flex-1 rounded-full ${index <= step ? 'bg-primary' : 'bg-muted'}`}
                aria-hidden
              />
            ))}
          </div>

          {step === 0 && (
            <div className="space-y-4">
              <div className="flex flex-col gap-1.5">
                <LabelWithHelp
                  htmlFor="competition-name"
                  help={{
                    label: 'Competition name',
                    description: 'Public name shown to participants on listings and certificates.',
                    example: 'National Yoga Championship 2026',
                    bestPractice: 'Use a clear, memorable name with the year or season.',
                    validationHint: 'Required before publishing.',
                  }}
                >
                  Competition name
                </LabelWithHelp>
                <input
                  id="competition-name"
                  className="h-11 w-full rounded-[12px] border border-border bg-elevated px-4 text-base text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 sm:text-sm"
                  value={details.name}
                  onChange={(e) => setDetails({ ...details, name: e.target.value })}
                  required
                />
              </div>
              <Textarea
                label="Description"
                value={details.description ?? ''}
                onChange={(e) => setDetails({ ...details, description: e.target.value })}
                rows={3}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Venue"
                  value={details.venue ?? ''}
                  onChange={(e) => setDetails({ ...details, venue: e.target.value })}
                />
                <Input
                  label="City"
                  value={details.city ?? ''}
                  onChange={(e) => setDetails({ ...details, city: e.target.value })}
                />
                <Input
                  label="Start date"
                  type="date"
                  value={details.startDate ?? ''}
                  onChange={(e) => setDetails({ ...details, startDate: e.target.value })}
                />
                <Input
                  label="End date"
                  type="date"
                  value={details.endDate ?? ''}
                  onChange={(e) => setDetails({ ...details, endDate: e.target.value })}
                />
                <Input
                  label="Entry fee (₹)"
                  type="number"
                  min={0}
                  value={details.entryFee ?? 0}
                  onChange={(e) => setDetails({ ...details, entryFee: Number(e.target.value) })}
                />
                <Select
                  label="Format"
                  value={details.format ?? 'individual'}
                  onChange={(e) =>
                    setDetails({ ...details, format: e.target.value as CompetitionFormat })
                  }
                >
                  <option value="individual">Individual</option>
                  <option value="team">Team</option>
                  <option value="online">Online</option>
                </Select>
                <Select
                  label="Scope"
                  value={details.scope ?? 'friendly'}
                  onChange={(e) =>
                    setDetails({ ...details, scope: e.target.value as CompetitionScope })
                  }
                >
                  <option value="friendly">Friendly</option>
                  <option value="state">State</option>
                  <option value="national">National</option>
                  <option value="international">International</option>
                </Select>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              {categories.map((category, index) => (
                <div key={index} className="rounded-[12px] border border-border p-4 space-y-3">
                  <Input
                    label="Category name"
                    value={category.name}
                    onChange={(e) => {
                      const next = [...categories]
                      next[index] = { ...category, name: e.target.value }
                      setCategories(next)
                    }}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <Select
                      label="Age group"
                      value={category.ageGroup ?? 'open'}
                      onChange={(e) => {
                        const next = [...categories]
                        next[index] = {
                          ...category,
                          ageGroup: e.target.value as CompetitionAgeGroup,
                        }
                        setCategories(next)
                      }}
                    >
                      <option value="under_8">Under 8</option>
                      <option value="under_10">Under 10</option>
                      <option value="under_12">Under 12</option>
                      <option value="under_14">Under 14</option>
                      <option value="under_16">Under 16</option>
                      <option value="under_18">Under 18</option>
                      <option value="open">Open</option>
                      <option value="masters">Masters</option>
                    </Select>
                    <Select
                      label="Style"
                      value={category.styleType ?? 'traditional'}
                      onChange={(e) => {
                        const next = [...categories]
                        next[index] = {
                          ...category,
                          styleType: e.target.value as CompetitionStyleType,
                        }
                        setCategories(next)
                      }}
                    >
                      <option value="traditional">Traditional</option>
                      <option value="artistic">Artistic</option>
                      <option value="rhythmic">Rhythmic</option>
                      <option value="pair">Pair</option>
                      <option value="group">Group</option>
                    </Select>
                  </div>
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setCategories([
                    ...categories,
                    { name: 'New category', ageGroup: 'open', styleType: 'traditional' },
                  ])
                }
              >
                Add category
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Optional sub-groups within categories (e.g. Preliminary, Finals).
              </p>
              {divisions.map((division, index) => (
                <div key={index} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Category"
                    value={String(division.categoryIndex)}
                    onChange={(e) => {
                      const next = [...divisions]
                      next[index] = { ...division, categoryIndex: Number(e.target.value) }
                      setDivisions(next)
                    }}
                  >
                    {categories.map((c, i) => (
                      <option key={i} value={i}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                  <Input
                    label="Division name"
                    value={division.name}
                    onChange={(e) => {
                      const next = [...divisions]
                      next[index] = { ...division, name: e.target.value }
                      setDivisions(next)
                    }}
                  />
                  <Input
                    label="Code"
                    value={division.code ?? ''}
                    onChange={(e) => {
                      const next = [...divisions]
                      next[index] = { ...division, code: e.target.value }
                      setDivisions(next)
                    }}
                  />
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setDivisions([...divisions, { categoryIndex: 0, name: 'Preliminary' }])
                }
              >
                Add division
              </Button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <Input
                label="Registration deadline"
                type="datetime-local"
                value={registrationDeadline}
                onChange={(e) => setRegistrationDeadline(e.target.value)}
              />
              <Input
                label="Maximum participants"
                type="number"
                min={1}
                value={maxParticipants}
                onChange={(e) =>
                  setMaxParticipants(e.target.value === '' ? '' : Number(e.target.value))
                }
              />
              <Textarea
                label="Registration rules"
                value={rules}
                onChange={(e) => setRules(e.target.value)}
                rows={4}
                placeholder="Medical declaration, identity proof, age verification…"
              />
            </div>
          )}

          {step === 4 && (
            <div className="rounded-[12px] border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-2">Judges</p>
              <p>
                Invite judges from the dashboard after publishing. You can assign them to categories
                with drag-and-drop and detect scheduling conflicts automatically.
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-4">
              {events.map((event, index) => (
                <div key={index} className="rounded-[12px] border border-border p-4 grid gap-3 sm:grid-cols-2">
                  <Input
                    label="Session name"
                    value={event.name}
                    onChange={(e) => {
                      const next = [...events]
                      next[index] = { ...event, name: e.target.value }
                      setEvents(next)
                    }}
                  />
                  <Input
                    label="Starts at"
                    type="datetime-local"
                    value={event.startsAt}
                    onChange={(e) => {
                      const next = [...events]
                      next[index] = { ...event, startsAt: e.target.value }
                      setEvents(next)
                    }}
                  />
                  <Input
                    label="Stage"
                    value={event.stage ?? ''}
                    onChange={(e) => {
                      const next = [...events]
                      next[index] = { ...event, stage: e.target.value }
                      setEvents(next)
                    }}
                  />
                  <Input
                    label="Venue override"
                    value={event.venue ?? ''}
                    onChange={(e) => {
                      const next = [...events]
                      next[index] = { ...event, venue: e.target.value }
                      setEvents(next)
                    }}
                  />
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEvents([...events, { name: 'Session', startsAt: '' }])}
              >
                Add session
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3 text-sm">
              <ReviewRow label="Name" value={details.name} />
              <ReviewRow label="Location" value={[details.venue, details.city].filter(Boolean).join(', ') || '—'} />
              <ReviewRow label="Dates" value={[details.startDate, details.endDate].filter(Boolean).join(' → ') || '—'} />
              <ReviewRow label="Categories" value={String(categories.length)} />
              <ReviewRow label="Divisions" value={String(divisions.length)} />
              <ReviewRow label="Sessions" value={String(events.filter((e) => e.startsAt).length)} />
              <ReviewRow label="Entry fee" value={`₹${details.entryFee ?? 0}`} />
            </div>
          )}

          {step === 7 && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Publishing creates your competition and optionally opens registration immediately.
              </p>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={openRegistration}
                  onChange={(e) => setOpenRegistration(e.target.checked)}
                />
                Open registration on publish
              </label>
            </div>
          )}

          {error && (
            <p className="mt-4 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>

        <div className="sticky bottom-0 flex justify-between gap-3 border-t border-border bg-elevated px-5 py-4">
          <Button
            variant="ghost"
            disabled={step === 0 || busy}
            onClick={() => setStep((s) => Math.max(0, s - 1))}
          >
            Back
          </Button>
          {step < STEPS.length - 1 ? (
            <Button onClick={() => setStep((s) => s + 1)} disabled={busy}>
              Continue
            </Button>
          ) : (
            <Button onClick={() => void handlePublish()} disabled={busy}>
              {busy ? 'Publishing…' : 'Publish competition'}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 border-b border-border/60 pb-2">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground text-right">{value}</span>
    </div>
  )
}
