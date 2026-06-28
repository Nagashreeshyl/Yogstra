import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchTeacherPayoutDetails,
  saveTeacherUpiLocally,
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

  const [upiId, setUpiId] = useState('')
  const [accountHolderName, setAccountHolderName] = useState('')
  const [bankAccountNumber, setBankAccountNumber] = useState('')
  const [bankIfsc, setBankIfsc] = useState('')
  const [panNumber, setPanNumber] = useState('')
  const [savingUpi, setSavingUpi] = useState(false)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!payout) return
    setUpiId(payout.upiId)
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

  const handleSaveUpi = async () => {
    if (!teacherId) return
    setSavingUpi(true)
    try {
      await saveTeacherUpiLocally(teacherId, upiId)
      await refetch()
      setToast({ message: 'UPI ID saved. Admin can pay you via UPI when your earnings are ready.', type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Could not save UPI ID.',
        type: 'error',
      })
    } finally {
      setSavingUpi(false)
    }
  }

  const handleSave = async () => {
    if (!teacherId) return
    const hasBank = accountHolderName.trim() && bankAccountNumber.trim() && bankIfsc.trim()

    if (!hasBank && !upiId.trim()) {
      setToast({ message: 'Enter your UPI ID and/or bank details.', type: 'error' })
      return
    }

    if (!hasBank) {
      await handleSaveUpi()
      return
    }

    setSaving(true)
    try {
      const result = await setupTeacherRazorpayPayout({
        teacherId,
        accountHolderName,
        accountNumber: bankAccountNumber,
        ifsc: bankIfsc,
        pan: panNumber || undefined,
        upiId: upiId || undefined,
      })
      await refetch()
      setToast({
        message: result.warning
          ? result.warning
          : result.bankSavedOnly
            ? 'Bank details saved. Razorpay Route connection is pending.'
            : 'Payout details saved.',
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
    <div className="space-y-8 max-w-lg">
      <div className="space-y-4">
        <div>
          <h2 className="font-heading text-lg font-medium mb-1">Receive via UPI</h2>
          <p className="text-sm text-charcoal/55">
            Add your UPI ID for manual payouts from Yogstra admin (GPay, PhonePe, Paytm, etc.).
          </p>
        </div>
        <Input
          label="UPI ID"
          value={upiId}
          onChange={(e) => setUpiId(e.target.value.toLowerCase())}
          placeholder="yourname@upi"
        />
        <Button variant="secondary" onClick={() => void handleSaveUpi()} disabled={savingUpi}>
          {savingUpi ? 'Saving…' : 'Save UPI ID'}
        </Button>
      </div>

      <div className="border-t border-border pt-8 space-y-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <h2 className="font-heading text-lg font-medium">Bank account (optional)</h2>
            <Badge variant={payout?.onboardingStatus === 'active' ? 'verified' : 'teal'}>
              {statusLabel}
            </Badge>
          </div>
          <p className="text-sm text-charcoal/55">
            For automatic Razorpay Route transfers when enabled on the platform.
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
          {saving ? 'Saving…' : 'Save bank details'}
        </Button>
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
