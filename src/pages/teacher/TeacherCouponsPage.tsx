import { useState } from 'react'
import { Copy, Send, Tag } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import type { ClassDuration, ClassType } from '../../services/classOrders'
import {
  fetchTeacherCoupons,
  formatCouponLimits,
  formatCouponSummary,
  generateTeacherCoupon,
  getCouponAvailability,
  type TeacherCoupon,
} from '../../services/coupons'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { SendCouponModal } from '../../components/coupons/SendCouponModal'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Select } from '../../components/ui/Select'
import { Toast } from '../../components/ui/Toast'
import { SimplePageSkeleton } from '../../components/ui/Skeleton'
import { formatRelativeDate } from '../../utils/format'

const VALIDITY_OPTIONS = [
  { value: '', label: 'No expiry' },
  { value: '3', label: '3 days' },
  { value: '7', label: '7 days' },
  { value: '14', label: '14 days' },
  { value: '30', label: '30 days' },
  { value: '60', label: '60 days' },
  { value: '90', label: '90 days' },
] as const

function availabilityLabel(coupon: TeacherCoupon) {
  switch (getCouponAvailability(coupon)) {
    case 'expired':
      return 'Expired'
    case 'depleted':
      return 'Limit reached'
    case 'inactive':
      return 'Deactivated'
    default:
      return null
  }
}

function availabilityClass(coupon: TeacherCoupon) {
  switch (getCouponAvailability(coupon)) {
    case 'active':
      return 'bg-primary/10 text-primary'
    case 'expired':
      return 'bg-sidebar/10 text-muted-foreground'
    case 'depleted':
      return 'bg-amber-100 text-amber-900'
    default:
      return 'bg-sidebar/10 text-muted-foreground'
  }
}

export function TeacherCouponsPage() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''
  const teacherName = user?.name ?? 'Teacher'

  const [classType, setClassType] = useState<ClassType>('1:1')
  const [duration, setDuration] = useState<ClassDuration>('month')
  const [discountPercent, setDiscountPercent] = useState('10')
  const [validForDays, setValidForDays] = useState('')
  const [maxUses, setMaxUses] = useState('')
  const [generated, setGenerated] = useState<TeacherCoupon | null>(null)
  const [generating, setGenerating] = useState(false)
  const [sendTarget, setSendTarget] = useState<TeacherCoupon | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const { data: coupons, loading, refetch } = useAsyncData(
    () => (teacherId ? fetchTeacherCoupons(teacherId) : Promise.resolve([])),
    [teacherId],
  )

  const handleGenerate = async () => {
    const percent = Number(discountPercent)
    if (!Number.isFinite(percent) || percent <= 0 || percent > 100) {
      setToast({ message: 'Enter a discount between 1 and 100.', type: 'error' })
      return
    }

    const parsedMaxUses = maxUses.trim() ? Number(maxUses) : null
    if (parsedMaxUses != null && (!Number.isInteger(parsedMaxUses) || parsedMaxUses <= 0)) {
      setToast({ message: 'Max redemptions must be a whole number of at least 1.', type: 'error' })
      return
    }

    const parsedValidDays = validForDays ? Number(validForDays) : null
    if (parsedValidDays != null && (!Number.isInteger(parsedValidDays) || parsedValidDays <= 0)) {
      setToast({ message: 'Choose a valid duration.', type: 'error' })
      return
    }

    setGenerating(true)
    try {
      const coupon = await generateTeacherCoupon({
        teacherId,
        teacherName,
        classType,
        duration,
        discountPercent: percent,
        validForDays: parsedValidDays,
        maxUses: parsedMaxUses,
      })
      setGenerated(coupon)
      await refetch(true)
      setToast({ message: 'Coupon generated!', type: 'success' })
    } catch (err) {
      setToast({
        message: err instanceof Error ? err.message : 'Could not generate coupon.',
        type: 'error',
      })
    } finally {
      setGenerating(false)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setToast({ message: 'Coupon code copied.', type: 'success' })
    } catch {
      setToast({ message: 'Could not copy code.', type: 'error' })
    }
  }

  if (loading && !coupons?.length) {
    return <SimplePageSkeleton />
  }

  return (
    <>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      <PageContainer width="narrow">
        <div className="space-y-6">
          <PageHeader
            title="Coupon Codes"
            description="Create discount codes for your students to use when booking classes."
          />

          <DashboardCard title="Create a new coupon">
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Select
              label="Class type"
              value={classType}
              onChange={(e) => setClassType(e.target.value as ClassType)}
            >
              <option value="1:1">1-on-1 (1v1)</option>
              <option value="group">Group (1-to-many)</option>
            </Select>

            <Select
              label="Duration"
              value={duration}
              onChange={(e) => setDuration(e.target.value as ClassDuration)}
            >
              <option value="week">1 week</option>
              <option value="month">1 month</option>
            </Select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <Input
              label="Discount (%)"
              type="number"
              min={1}
              max={100}
              value={discountPercent}
              onChange={(e) => setDiscountPercent(e.target.value)}
              placeholder="e.g. 15"
            />

            <Select
              label="Valid for"
              value={validForDays}
              onChange={(e) => setValidForDays(e.target.value)}
            >
              {VALIDITY_OPTIONS.map((opt) => (
                <option key={opt.value || 'none'} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </Select>
          </div>

          <Input
            label="Max redemptions (optional)"
            type="number"
            min={1}
            value={maxUses}
            onChange={(e) => setMaxUses(e.target.value)}
            placeholder="Unlimited — e.g. 5 for first 5 enrollees"
          />
          <p className="text-xs text-muted-foreground/70 mt-1.5">
            Coupon stops working after the validity period ends or when the redemption limit is reached.
          </p>

          <Button
            className="mt-5 w-full sm:w-auto"
            onClick={() => void handleGenerate()}
            disabled={generating}
          >
            {generating ? 'Generating...' : 'Generate code'}
          </Button>

          {generated && (
            <div className="mt-6 border border-primary/20 bg-primary/10/40 rounded-[16px] p-4">
              <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Your new code</p>
              <div className="flex flex-wrap items-center gap-3">
                <p className="font-mono text-lg font-bold text-primary tracking-wide">{generated.code}</p>
                <button
                  type="button"
                  onClick={() => void copyCode(generated.code)}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-muted-foreground hover:text-primary cursor-pointer"
                >
                  <Copy size={14} />
                  Copy
                </button>
              </div>
              <p className="text-sm text-muted-foreground mt-2">{formatCouponSummary(generated)}</p>
              <p className="text-xs text-muted-foreground mt-1">{formatCouponLimits(generated)}</p>
              <Button
                className="mt-4 gap-1.5"
                onClick={() => setSendTarget(generated)}
              >
                <Send size={16} />
                Send to students
              </Button>
            </div>
          )}
          </DashboardCard>

          <section>
            <h2 className="text-sm font-semibold text-muted-foreground mb-3">Your coupons</h2>
            {!coupons?.length ? (
              <EmptyState
                icon={<Tag size={24} />}
                title="No coupons yet"
                description="Generate one above to share with your students."
              />
            ) : (
            <ul className="space-y-3">
              {coupons.map((c) => {
                const status = availabilityLabel(c)
                const isActive = getCouponAvailability(c) === 'active'

                return (
                  <li
                    key={c.id}
                    className={`rounded-[16px] border border-border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                      isActive ? 'border-border' : 'border-border/60 opacity-80'
                    }`}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-mono font-semibold text-primary">{c.code}</p>
                        {status && (
                          <span
                            className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full ${availabilityClass(c)}`}
                          >
                            {status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">{formatCouponSummary(c)}</p>
                      <p className="text-xs text-muted-foreground mt-1">{formatCouponLimits(c)}</p>
                      <p className="text-xs text-muted-foreground/70 mt-0.5">
                        Created {formatRelativeDate(c.createdAt)}
                        {typeof c.sentCount === 'number' && c.sentCount > 0
                          ? ` · Sent to ${c.sentCount} student${c.sentCount === 1 ? '' : 's'}`
                          : ''}
                        {c.useCount > 0 ? ` · ${c.useCount} redeemed` : ''}
                      </p>
                    </div>
                    <div className="flex gap-2 shrink-0">
                      <Button variant="secondary" size="sm" onClick={() => void copyCode(c.code)}>
                        Copy
                      </Button>
                      <Button
                        size="sm"
                        className="gap-1"
                        disabled={!isActive}
                        onClick={() => setSendTarget(c)}
                      >
                        <Send size={14} />
                        Send
                      </Button>
                    </div>
                  </li>
                )
              })}
            </ul>
          )}
          </section>
        </div>
      </PageContainer>

      <SendCouponModal
        isOpen={Boolean(sendTarget)}
        onClose={() => setSendTarget(null)}
        coupon={sendTarget}
        teacherId={teacherId}
        teacherName={teacherName}
        onSent={(result) => {
          void refetch(true)
          setToast({
            message:
              result.skipped > 0
                ? `Sent to ${result.sent} student${result.sent === 1 ? '' : 's'} (${result.skipped} already had it).`
                : `Sent to ${result.sent} student${result.sent === 1 ? '' : 's'}.`,
            type: 'success',
          })
        }}
      />
    </>
  )
}
