import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchCommissionPercent, updateCommissionPercent } from '../../services/platformSettings'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Toast } from '../../components/ui/Toast'
import { LabelWithHelp } from '../../components/ui/HelpTooltip'

export function AdminSettingsPage() {
  const { data: commission, loading, refetch } = useAsyncData(() => fetchCommissionPercent())
  const [value, setValue] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const displayValue = value || (commission != null ? String(commission) : '10')

  const handleSave = async () => {
    const percent = Number(displayValue)
    setSaving(true)
    try {
      await updateCommissionPercent(percent)
      await refetch()
      setToast({ message: 'Commission updated.', type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Could not save commission.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Platform configuration." />

      <div className="max-w-lg rounded-[16px] border border-border p-6 space-y-6">
        <div>
          <p className="text-sm font-medium mb-1">Platform Name</p>
          <p className="text-muted-foreground">Yogstra</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Default Currency</p>
          <p className="text-muted-foreground">INR (₹)</p>
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="font-heading text-lg font-medium mb-2">Marketplace Commission</h2>
          <p className="text-sm text-foreground/55 mb-4">
            When a student pays, this percentage stays with Yogstra and the rest is routed to the
            coach through our integrated payment partner.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <LabelWithHelp
                htmlFor="commission"
                help={{
                  label: 'Marketplace commission',
                  description: 'Percentage retained by Yogstra on successful paid enrollments.',
                  example: '10% on a ₹10,000 enrollment → ₹1,000 platform, ₹9,000 to coach.',
                  validationHint: 'Must be between 0 and 100.',
                }}
              >
                Commission (%)
              </LabelWithHelp>
              <Input
                id="commission"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={displayValue}
                onChange={(e) => setValue(e.target.value)}
                disabled={loading || saving}
              />
            </div>
            <Button onClick={() => void handleSave()} disabled={loading || saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground/70 mt-2">
            Example: 10% on ₹10,000 → ₹1,000 platform, ₹9,000 to teacher.
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
