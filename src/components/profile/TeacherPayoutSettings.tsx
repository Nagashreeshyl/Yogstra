import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchTeacherPayoutDetails,
  setupTeacherRazorpayPayout,
} from '../../services/teacherPayoutDetails'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Badge } from '../../components/ui/Badge'
import { Toast } from '../../components/ui/Toast'

export function TeacherPayoutSettings() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''

  const { data: payout, loading, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherPayoutDetails(teacherId) : Promise.resolve(null)),
    [teacherId],
  )

  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!payout) return
    setAccountHolderName(payout.accountHolderName)
    setBankAccountNumber(payout.bankAccountNumber)
    setBankIfsc(payout.bankIfsc)
    setPanNumber(payout.panNumber)
  }, [payout])

  const statusLabel =
    payout?.onboardingStatus === 'active'
      ? 'Connected'
      : payout?.onboardingStatus === 'pending'
        ? 'Pending verification'
        : payout?.onboardingStatus === 'failed'
          ? 'Setup failed'
          : 'Not connected'

  const handleSave = async () => {
    if (!teacherId) return
    if (!accountHolderName.trim() || !bankAccountNumber.trim() || !bankIfsc.trim()) {
      setToast({ message: 'Account holder name, account number, and IFSC are required.', type: 'error' })
      return
    }

    setSaving(true)
    try {
      await setupTeacherRazorpayPayout({
        teacherId,
        accountHolderName,
        accountNumber: bankAccountNumber,
        ifsc: bankIfsc,
        pan: panNumber || undefined,
      })
      await refetch()
      setToast({
        message: 'Bank details saved. Razorpay Route will send your share when students pay.',
        type: 'success',
      })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Could not save payout details.',
        type: 'error',
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading && !payout) {
    return <p className="text-charcoal/50">Loading payout settings…</p>
  }

  return (
    <div className="space-y-6 max-w-lg">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <h2 className="font-heading text-lg font-medium">Payout account</h2>
          <Badge variant={payout?.onboardingStatus === 'active' ? 'verified' : 'teal'}>
            {statusLabel}
          </Badge>
        </div>
        <p className="text-sm text-charcoal/55">
          When a student pays, Yogstra keeps the platform commission and your share is routed to
          this bank account via Razorpay Route.
        </p>
      </div>

      <Input
        label="Account holder name"
        value={accountHolderName}
        onChange={(e) => setAccountHolderName(e.target.value)}
        placeholder="As per bank records"
      />
      <Input
        label="Bank account number"
        value={bankAccountNumber}
        onChange={(e) => setBankAccountNumber(e.target.value.replace(/\D/g, ''))}
        inputMode="numeric"
      />
      <Input
        label="IFSC code"
        value={bankIfsc}
        onChange={(e) => setBankIfsc(e.target.value.toUpperCase())}
        placeholder="e.g. HDFC0001234"
      />
      <Input
        label="PAN (optional)"
        value={panNumber}
        onChange={(e) => setPanNumber(e.target.value.toUpperCase())}
        placeholder="For Razorpay KYC"
      />

      {payout?.linkedAccountId && (
        <p className="text-xs text-charcoal/45 font-mono break-all">
          Linked account: {payout.linkedAccountId}
        </p>
      )}

      <Button onClick={() => void handleSave()} disabled={saving}>
        {saving ? 'Saving…' : 'Save & connect payouts'}
      </Button>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
