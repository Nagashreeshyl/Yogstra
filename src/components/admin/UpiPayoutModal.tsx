import { useEffect, useState } from 'react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import type { Payout } from '../../types'
import { buildUpiPaymentUri, generateUpiQrDataUrl } from '../../utils/upi'

interface UpiPayoutModalProps {
  payout: Payout
  isOpen: boolean
  onClose: () => void
  onMarkPaid: (payoutId: string) => Promise<void>
}

export function UpiPayoutModal({ payout, isOpen, onClose, onMarkPaid }: UpiPayoutModalProps) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null)
  const [loadingQr, setLoadingQr] = useState(false)
  const [markingPaid, setMarkingPaid] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const amount = payout.teacherAmount ?? payout.amount
  const upiId = payout.teacherUpiId ?? ''

  useEffect(() => {
    if (!isOpen || !upiId) {
      setQrDataUrl(null)
      return
    }

    setLoadingQr(true)
    setError(null)
    const uri = buildUpiPaymentUri({
      upiId,
      payeeName: payout.teacherName,
      amountInr: amount,
      note: `Yogstra payout · ${payout.studentName ?? payout.period}`,
    })

    void generateUpiQrDataUrl(uri)
      .then(setQrDataUrl)
      .catch(() => setError('Could not generate payment QR code.'))
      .finally(() => setLoadingQr(false))
  }, [isOpen, upiId, payout.teacherName, payout.studentName, payout.period, amount])

  const handleMarkPaid = async () => {
    setMarkingPaid(true)
    setError(null)
    try {
      await onMarkPaid(payout.id)
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not mark payout as paid.')
    } finally {
      setMarkingPaid(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-md">
      <h2 className="font-heading text-lg font-medium mb-1">Pay teacher via UPI</h2>
      <p className="text-sm text-muted-foreground mb-4">
        Scan with any UPI app (GPay, PhonePe, Paytm) to pay{' '}
        <strong>₹{amount.toLocaleString('en-IN')}</strong> to {payout.teacherName}.
      </p>

      <div className="rounded-sm border border-border bg-muted p-4 space-y-2 mb-4 text-sm">
        <p>
          <span className="text-muted-foreground">Teacher:</span> {payout.teacherName}
        </p>
        <p>
          <span className="text-muted-foreground">UPI ID:</span>{' '}
          <span className="font-mono">{upiId}</span>
        </p>
        <p>
          <span className="text-muted-foreground">Amount:</span>{' '}
          <span className="font-semibold">₹{amount.toLocaleString('en-IN')}</span>
        </p>
        {payout.studentName && (
          <p>
            <span className="text-muted-foreground">For class:</span> {payout.studentName}
          </p>
        )}
      </div>

      <div className="flex flex-col items-center mb-6">
        {loadingQr && <p className="text-sm text-muted-foreground py-8">Generating QR code…</p>}
        {!loadingQr && qrDataUrl && (
          <img
            src={qrDataUrl}
            alt={`UPI payment QR for ${payout.teacherName}`}
            className="w-[280px] h-[280px] rounded-sm border border-border bg-white"
          />
        )}
        {!loadingQr && !qrDataUrl && !error && (
          <p className="text-sm text-muted-foreground py-8">No UPI ID on file for this teacher.</p>
        )}
      </div>

      {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="secondary" className="flex-1" onClick={onClose}>
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={() => void handleMarkPaid()}
          disabled={markingPaid}
        >
          {markingPaid ? 'Saving…' : 'Mark as Paid'}
        </Button>
      </div>
      <p className="text-xs text-muted-foreground/70 mt-3 text-center">
        Complete the UPI transfer in your app, then click Mark as Paid.
      </p>
    </Modal>
  )
}
