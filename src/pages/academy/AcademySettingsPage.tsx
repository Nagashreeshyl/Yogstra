import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { useApp } from '../../context/AppContext'
import { academyRepository } from '../../repositories/academyRepository'
import {
  archiveAcademy,
  deleteAcademy,
  updateAcademyDetails,
  updateAcademySettings,
} from '../../services/academyOperations'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Textarea } from '../../components/ui/Textarea'
import { NameConfirmModal } from '../../components/ui/NameConfirmModal'
import { HelpTooltip, LabelWithHelp } from '../../components/ui/HelpTooltip'

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
]

const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AED']

export function AcademySettingsPage() {
  const navigate = useNavigate()
  const { user } = useApp()
  const { academyId, academy, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [city, setCity] = useState('')
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [currency, setCurrency] = useState('INR')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const { data: settings, loading, error, refetch } = useAsyncData(
    () => (academyId ? academyRepository.getSettings(academyId) : Promise.resolve(null)),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  useEffect(() => {
    if (!academy) return
    setName(academy.name)
    setDescription(academy.description ?? '')
    setCity(academy.city ?? '')
  }, [academy])

  useEffect(() => {
    if (!settings) return
    setTimezone(settings.timezone)
    setCurrency(settings.currency)
    const prefs = settings.settings
    if (typeof prefs.emailNotifications === 'boolean') {
      setEmailNotifications(prefs.emailNotifications)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academyId) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateAcademyDetails(academyId, {
        name: name.trim(),
        description: description.trim() || null,
        city: city.trim() || null,
      })
      await updateAcademySettings(academyId, {
        timezone,
        currency,
        settings: {
          ...(settings?.settings ?? {}),
          emailNotifications,
        },
      })
      setSaveSuccess(true)
      await refetch()
      await refetchContext()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async () => {
    if (!academyId) return
    await archiveAcademy(academyId)
    setArchiveOpen(false)
    navigate('/dashboard/academy')
    await refetchContext()
  }

  const handleDelete = async () => {
    if (!academyId) return
    await deleteAcademy(academyId)
    setDeleteOpen(false)
    navigate('/dashboard/academy')
    await refetchContext()
  }

  if (contextLoading || (loading && !settings)) {
    return <LoadingSkeleton />
  }

  if (contextError || !academyId || !academy) {
    return (
      <PageContainer width="narrow">
        <ErrorState
          message={contextError ?? 'No academy selected.'}
          onRetry={() => void refetchContext()}
        />
      </PageContainer>
    )
  }

  if (error) {
    return (
      <PageContainer width="narrow">
        <ErrorState message={error} onRetry={() => void refetch()} />
      </PageContainer>
    )
  }

  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Academy settings"
        description="Edit academy details, preferences, and lifecycle."
      />

      <form
        onSubmit={(e) => void handleSave(e)}
        className="rounded-[16px] border border-border bg-elevated p-5 sm:p-6 space-y-6 mb-8"
      >
        <div className="flex flex-col gap-1.5">
          <LabelWithHelp
            htmlFor="academy-name"
            help={{
              label: 'Academy name',
              description: 'Public name shown to students and on your academy profile.',
              example: 'Shanti Yoga Academy',
              bestPractice: 'Use your registered business or brand name.',
            }}
          >
            Academy name
          </LabelWithHelp>
          <Input id="academy-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <Textarea
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
        <Input label="City" value={city} onChange={(e) => setCity(e.target.value)} />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="timezone" className="text-sm font-medium text-foreground">
            Timezone
          </label>
          <select
            id="timezone"
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-elevated rounded-[16px] border border-border focus:outline-none focus:border-primary"
          >
            {TIMEZONE_OPTIONS.map((tz) => (
              <option key={tz} value={tz}>
                {tz}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            <label htmlFor="currency" className="text-sm font-medium text-foreground">
              Currency
            </label>
            <HelpTooltip
              label="Currency"
              description="Default currency for academy finance and fee displays."
              example="INR"
            />
          </div>
          <select
            id="currency"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className="w-full px-4 py-2.5 text-sm bg-elevated rounded-[16px] border border-border focus:outline-none focus:border-primary"
          >
            {CURRENCY_OPTIONS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>

        <label className="flex items-center gap-3 text-sm">
          <input
            type="checkbox"
            checked={emailNotifications}
            onChange={(e) => setEmailNotifications(e.target.checked)}
            className="h-4 w-4 rounded border-border"
          />
          Email notifications for academy activity
        </label>

        {saveError && <p className="text-sm text-destructive">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-primary">Settings saved successfully.</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save changes'}
        </Button>
      </form>

      <section className="rounded-[16px] border border-border bg-elevated p-5 sm:p-6 space-y-4">
        <h2 className="font-heading text-base font-semibold text-foreground">Lifecycle</h2>
        <p className="text-sm text-muted-foreground">
          Archiving hides your academy from public listings. Teachers and students retain their history.
          Deletion is a soft archive — contact platform admin to restore.
        </p>
        <div className="flex flex-wrap gap-3">
          <Button variant="secondary" onClick={() => setArchiveOpen(true)}>
            Archive academy
          </Button>
          {user?.id === academy.createdBy && (
            <Button variant="danger" onClick={() => setDeleteOpen(true)}>
              Delete academy
            </Button>
          )}
        </div>
      </section>

      <NameConfirmModal
        isOpen={archiveOpen}
        title="Archive academy?"
        message="Members will no longer see this academy in active listings. Data is preserved."
        confirmName={academy.name}
        confirmLabel="Archive"
        onConfirm={() => void handleArchive()}
        onCancel={() => setArchiveOpen(false)}
      />

      <NameConfirmModal
        isOpen={deleteOpen}
        title="Delete academy?"
        message="This archives the academy and removes it from active use. Teachers and students are notified via status change."
        confirmName={academy.name}
        confirmLabel="Delete"
        onConfirm={() => void handleDelete()}
        onCancel={() => setDeleteOpen(false)}
      />
    </PageContainer>
  )
}
