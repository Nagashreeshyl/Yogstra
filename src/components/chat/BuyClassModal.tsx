import { useEffect, useMemo, useState } from 'react'
import { ShoppingBag, Tag } from 'lucide-react'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Textarea } from '../ui/Textarea'
import { Select } from '../ui/Select'
import { useApp } from '../../context/AppContext'
import type { ClassDuration, ClassType } from '../../services/classOrders'
import {
  fetchTeacherFee,
  type ClassOrderInput,
} from '../../services/classOrders'
import { formatCouponSummary, validateStudentCoupon } from '../../services/coupons'
import { openRazorpayCheckout } from '../../services/payments'

interface BuyClassModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  studentName: string
  teacherId: string
  teacherName: string
  threadId: string
  onEnrollmentComplete?: () => void | Promise<void>
}

import {
  DEFAULT_SESSION_TIME,
  SESSION_TIME_OPTIONS,
} from '../../utils/sessionTimeOptions'

function todayDateInputValue(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function BuyClassModal({
  isOpen,
  onClose,
  studentId,
  studentName,
  teacherId,
  teacherName,
  threadId,
  onEnrollmentComplete,
}: BuyClassModalProps) {
  const { user } = useApp()
  const [classType, setClassType] = useState<ClassType>('1:1')
  const [duration, setDuration] = useState<ClassDuration>('month')
  const [startDate, setStartDate] = useState('')
  const [time, setTime] = useState(DEFAULT_SESSION_TIME)
  const [notes, setNotes] = useState('')
  const [baseFee, setBaseFee] = useState(0)
  const [loadingFee, setLoadingFee] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [couponInput, setCouponInput] = useState('')
  const [applyingCoupon, setApplyingCoupon] = useState(false)
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string
    couponId: string
    deliveryId: string
    discountPercent: number
    finalAmount: number
  } | null>(null)

  const minStartDate = useMemo(() => todayDateInputValue(), [isOpen])

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setAppliedCoupon(null)
    setCouponInput('')
    setTime(DEFAULT_SESSION_TIME)
    setStartDate((prev) => (prev && prev >= minStartDate ? prev : ''))
    setLoadingFee(true)
    void fetchTeacherFee(teacherId, classType, duration)
      .then(setBaseFee)
      .catch(() => setBaseFee(0))
      .finally(() => setLoadingFee(false))
  }, [isOpen, teacherId, classType, duration, minStartDate])

  const amountDue = appliedCoupon?.finalAmount ?? baseFee

  const couponHint = useMemo(() => {
    if (!appliedCoupon) return null
    return formatCouponSummary({
      classType,
      duration,
      discountPercent: appliedCoupon.discountPercent,
    })
  }, [appliedCoupon, classType, duration])

  if (!isOpen) return null

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return
    setApplyingCoupon(true)
    setError(null)
    try {
      const result = await validateStudentCoupon({
        code: couponInput,
        studentId,
        teacherId,
        classType,
        duration,
      })
      const finalAmount = result.discountedAmount(baseFee)
      if (baseFee <= 0) {
        setError('Set class type and duration with valid pricing before applying a coupon.')
        return
      }
      setAppliedCoupon({
        code: result.coupon.code,
        couponId: result.coupon.id,
        deliveryId: result.deliveryId,
        discountPercent: result.coupon.discountPercent,
        finalAmount,
      })
    } catch (err) {
      setAppliedCoupon(null)
      setError(err instanceof Error ? err.message : 'Invalid coupon.')
    } finally {
      setApplyingCoupon(false)
    }
  }

  const handleProceed = async () => {
    if (submitting) return
    if (!startDate || !time) {
      setError('Please choose a start date and preferred time for your first session.')
      return
    }

    if (startDate < minStartDate) {
      setError('Start date must be today or a future date.')
      return
    }

    const scheduledAt = new Date(`${startDate}T${time}`).toISOString()
    if (Number.isNaN(new Date(scheduledAt).getTime())) {
      setError('Invalid date or time.')
      return
    }

    if (amountDue <= 0) {
      setError('This teacher has not set pricing for this class type and duration yet.')
      return
    }

    setSubmitting(true)
    setError(null)

    let couponPayload = appliedCoupon
    if (appliedCoupon) {
      try {
        const result = await validateStudentCoupon({
          code: appliedCoupon.code,
          studentId,
          teacherId,
          classType,
          duration,
        })
        const finalAmount = result.discountedAmount(baseFee)
        couponPayload = {
          code: result.coupon.code,
          couponId: result.coupon.id,
          deliveryId: result.deliveryId,
          discountPercent: result.coupon.discountPercent,
          finalAmount,
        }
        setAppliedCoupon(couponPayload)
      } catch (err) {
        setAppliedCoupon(null)
        setError(err instanceof Error ? err.message : 'Coupon is no longer valid.')
        setSubmitting(false)
        return
      }
    }

    const payableAmount = couponPayload?.finalAmount ?? baseFee

    const orderInput: ClassOrderInput = {
      studentId,
      studentName,
      teacherId,
      teacherName,
      threadId,
      classType,
      duration,
      startDate,
      scheduledAt,
      notes: notes.trim(),
      amount: payableAmount,
      originalAmount: couponPayload ? baseFee : undefined,
      discountPercent: couponPayload?.discountPercent,
      couponId: couponPayload?.couponId,
      couponDeliveryId: couponPayload?.deliveryId,
    }

    try {
      const receiptId = crypto.randomUUID()

      await openRazorpayCheckout({
        amountInr: payableAmount,
        studentName,
        studentEmail: user?.email,
        teacherId,
        teacherName,
        classType: classType === '1:1' ? '1-on-1' : 'Group',
        orderInput,
        receipt: receiptId,
        onSuccess: async () => {
          await onEnrollmentComplete?.()
          setSubmitting(false)
          onClose()
        },
        onDismiss: () => {
          setSubmitting(false)
        },
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not complete booking.')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/30" onClick={onClose} />
      <div className="relative bg-elevated rounded-[16px] border border-border w-full max-w-md p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-2 mb-1">
          <ShoppingBag size={20} className="text-primary" />
          <h3 className="font-heading text-lg font-medium">Enroll in Program</h3>
        </div>
        <p className="text-sm text-foreground/55 mb-5">
          Confirm your enrollment with {teacherName}. Your coach is notified after payment succeeds.
        </p>

        <div className="space-y-4">
          <Select
            label="Program type"
            value={classType}
            onChange={(e) => {
              setClassType(e.target.value as ClassType)
              setAppliedCoupon(null)
            }}
          >
            <option value="1:1">Personal Coaching</option>
            <option value="group">Training Batch</option>
          </Select>

          <Select
            label="Duration"
            value={duration}
            onChange={(e) => {
              setDuration(e.target.value as ClassDuration)
              setAppliedCoupon(null)
            }}
          >
            <option value="week">1 week</option>
            <option value="month">1 month</option>
          </Select>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Start date"
              type="date"
              value={startDate}
              min={minStartDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <Select
              label="Preferred time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            >
              {SESSION_TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <Textarea
            label="Anything else? (optional)"
            placeholder="Goals, experience level, preferred style..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1.5">
              Coupon code (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                placeholder="e.g. YOGA-A1B2C3"
                className="flex-1 min-w-0 px-3 py-2.5 text-sm rounded-[16px] border border-border bg-elevated focus:outline-none focus:border-primary font-mono uppercase"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => void handleApplyCoupon()}
                disabled={applyingCoupon || !couponInput.trim() || baseFee <= 0}
              >
                {applyingCoupon ? '…' : 'Apply'}
              </Button>
            </div>
            {appliedCoupon && (
              <p className="text-xs text-primary mt-1.5 flex items-center gap-1">
                <Tag size={12} />
                {appliedCoupon.code} applied — {couponHint}
              </p>
            )}
          </div>

          <div className="rounded-sm border border-surface-inset bg-muted px-4 py-3">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Amount due</p>
            {appliedCoupon && baseFee > amountDue && (
              <p className="text-sm text-muted-foreground/70 line-through mt-0.5">
                ₹{baseFee.toLocaleString('en-IN')}
              </p>
            )}
            <p className="text-xl font-semibold mt-0.5">
              {loadingFee ? '…' : `₹${amountDue.toLocaleString('en-IN')}`}
            </p>
            {!loadingFee && baseFee <= 0 && (
              <p className="text-xs text-amber-800 mt-1">
                Teacher has not set this pricing yet. Ask them to add it in Settings → Pricing.
              </p>
            )}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 mt-4 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
            {error}
          </p>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="secondary" className="flex-1" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => void handleProceed()}
            disabled={submitting || loadingFee || amountDue <= 0}
          >
            {submitting ? 'Processing…' : 'Confirm Enrollment'}
          </Button>
        </div>
      </div>
    </div>
  )
}
