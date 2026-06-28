import { useState } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchCommissionPercent, updateCommissionPercent } from '../../services/platformSettings'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Toast } from '../../components/ui/Toast'

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
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Settings</h1>

      <div className="max-w-lg border border-border rounded-sm p-6 space-y-6">
        <div>
          <p className="text-sm font-medium mb-1">Platform Name</p>
          <p className="text-charcoal/70">Yogstra</p>
        </div>
        <div>
          <p className="text-sm font-medium mb-1">Default Currency</p>
          <p className="text-charcoal/70">INR (₹)</p>
        </div>

        <div className="pt-4 border-t border-border">
          <h2 className="font-heading text-lg font-medium mb-2">Marketplace Commission</h2>
          <p className="text-sm text-charcoal/55 mb-4">
            When a student pays, this percentage stays with Yogstra and the rest is routed to the
            teacher via Razorpay Route.
          </p>
          <div className="flex gap-3 items-end">
            <div className="flex-1">
              <Input
                label="Commission (%)"
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
          <p className="text-xs text-charcoal/45 mt-2">
            Example: 10% on ₹10,000 → ₹1,000 platform, ₹9,000 to teacher.
          </p>
        </div>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
