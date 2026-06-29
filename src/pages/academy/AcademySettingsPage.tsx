import { useEffect, useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useAcademyContext } from '../../hooks/useAcademyContext'
import { academyRepository } from '../../repositories/academyRepository'
import { updateAcademySettings } from '../../services/academyOperations'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { ErrorState } from '../../components/shell/ErrorState'
import { LoadingSkeleton } from '../../components/shell/LoadingSkeleton'
import { Button } from '../../components/ui/Button'

const TIMEZONE_OPTIONS = [
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Europe/London',
  'America/New_York',
]

const CURRENCY_OPTIONS = ['INR', 'USD', 'EUR', 'GBP', 'AED']

export function AcademySettingsPage() {
  const { academyId, academy, loading: contextLoading, error: contextError, refetch: refetchContext } =
    useAcademyContext()
  const [timezone, setTimezone] = useState('Asia/Kolkata')
  const [currency, setCurrency] = useState('INR')
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [smsNotifications, setSmsNotifications] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)

  const { data: settings, loading, error, refetch } = useAsyncData(
    () => (academyId ? academyRepository.getSettings(academyId) : Promise.resolve(null)),
    [academyId],
    { enabled: Boolean(academyId) },
  )

  useEffect(() => {
    if (!settings) return
    setTimezone(settings.timezone)
    setCurrency(settings.currency)
    const prefs = settings.settings
    if (typeof prefs.emailNotifications === 'boolean') {
      setEmailNotifications(prefs.emailNotifications)
    }
    if (typeof prefs.smsNotifications === 'boolean') {
      setSmsNotifications(prefs.smsNotifications)
    }
  }, [settings])

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!academyId) return

    setSaving(true)
    setSaveError(null)
    setSaveSuccess(false)

    try {
      await updateAcademySettings(academyId, {
        timezone,
        currency,
        settings: {
          ...(settings?.settings ?? {}),
          emailNotifications,
          smsNotifications,
        },
      })
      setSaveSuccess(true)
      await refetch()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Could not save settings.')
    } finally {
      setSaving(false)
    }
  }

  if (contextLoading || (loading && !settings)) {
    return <LoadingSkeleton />
  }

  if (contextError || !academyId) {
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
        title="Settings"
        description={`Configure preferences for ${academy?.name ?? 'your academy'}.`}
      />

      <form
        onSubmit={(e) => void handleSave(e)}
        className="rounded-[16px] border border-border bg-elevated p-5 sm:p-6 space-y-6"
      >
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
          <label htmlFor="currency" className="text-sm font-medium text-foreground">
            Currency
          </label>
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

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium text-foreground mb-2">Notification preferences</legend>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            Email notifications for academy activity
          </label>
          <label className="flex items-center gap-3 text-sm">
            <input
              type="checkbox"
              checked={smsNotifications}
              onChange={(e) => setSmsNotifications(e.target.checked)}
              className="h-4 w-4 rounded border-border"
            />
            SMS notifications for urgent updates
          </label>
        </fieldset>

        {saveError && <p className="text-sm text-red-600">{saveError}</p>}
        {saveSuccess && <p className="text-sm text-primary">Settings saved successfully.</p>}

        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : 'Save settings'}
        </Button>
      </form>
    </PageContainer>
  )
}
