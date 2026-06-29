import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchTeacherPayoutDetails,
  formatPayoutSaveError,
  saveTeacherUpiLocally,
} from '../../services/teacherPayoutDetails'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Toast } from '../../components/ui/Toast'

export function TeacherPayoutSettings() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''

  const { data: payout, loading, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherPayoutDetails(teacherId) : Promise.resolve(null)),
    [teacherId],
  )

  const [upiId, setUpiId] = useState('')
  const [savingUpi, setSavingUpi] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!payout) return
    setUpiId(payout.upiId)
  }, [payout])

  const handleSaveUpi = async () => {
    if (!teacherId) return
    setSavingUpi(true)
    try {
      await saveTeacherUpiLocally(teacherId, upiId)
      await refetch()
      setToast({
        message: 'UPI ID saved. Admin will pay you manually when your earnings are ready.',
        type: 'success',
      })
    } catch (err) {
      setToast({
        message: formatPayoutSaveError(err),
        type: 'error',
      })
    } finally {
      setSavingUpi(false)
    }
  }

  if (loading && !payout) {
    return <p className="text-muted-foreground">Loading payout settings…</p>
  }

  return (
    <div className="space-y-4 max-w-lg">
      <div>
        <h2 className="font-heading text-lg font-medium mb-1">Receive via UPI</h2>
        <p className="text-sm text-foreground/55">
          Add your UPI ID. Yogstra admin pays teachers manually via GPay, PhonePe, Paytm, etc.
        </p>
      </div>
      <Input
        label="UPI ID"
        value={upiId}
        onChange={(e) => setUpiId(e.target.value.toLowerCase())}
        placeholder="yourname@upi"
      />
      <Button onClick={() => void handleSaveUpi()} disabled={savingUpi}>
        {savingUpi ? 'Saving…' : 'Save UPI ID'}
      </Button>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
