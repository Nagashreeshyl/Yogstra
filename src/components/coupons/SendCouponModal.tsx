import { useMemo, useState } from 'react'
import { Search, Send } from 'lucide-react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchStudentList } from '../../services/students'
import type { TeacherCoupon } from '../../services/coupons'
import { formatCouponLimits, formatCouponSummary, sendCouponToStudents } from '../../services/coupons'
import { Avatar } from '../ui/Avatar'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { TeacherTableSkeleton } from '../ui/Skeleton'

interface SendCouponModalProps {
  isOpen: boolean
  onClose: () => void
  coupon: TeacherCoupon | null
  teacherId: string
  teacherName: string
  onSent: (result: { sent: number; skipped: number }) => void
}

export function SendCouponModal({
  isOpen,
  onClose,
  coupon,
  teacherId,
  teacherName,
  onSent,
}: SendCouponModalProps) {
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const { data: students, loading } = useAsyncData(
    () => (isOpen ? fetchStudentList() : Promise.resolve([])),
    [isOpen],
  )

  const filtered = useMemo(() => {
    const list = students ?? []
    if (!search.trim()) return list
    const q = search.toLowerCase()
    return list.filter(
      (s) => s.name.toLowerCase().includes(q) || s.phone.toLowerCase().includes(q),
    )
  }, [students, search])

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const toggleAllVisible = () => {
    const visibleIds = filtered.map((s) => s.id)
    const allSelected = visibleIds.length > 0 && visibleIds.every((id) => selected.has(id))
    setSelected((prev) => {
      const next = new Set(prev)
      if (allSelected) {
        visibleIds.forEach((id) => next.delete(id))
      } else {
        visibleIds.forEach((id) => next.add(id))
      }
      return next
    })
  }

  const handleSend = async () => {
    if (!coupon || selected.size === 0) return
    setSending(true)
    setError(null)
    try {
      const result = await sendCouponToStudents({
        coupon,
        teacherId,
        teacherName,
        studentIds: [...selected],
      })
      onSent(result)
      setSelected(new Set())
      setSearch('')
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not send coupon.')
    } finally {
      setSending(false)
    }
  }

  const handleClose = () => {
    if (sending) return
    setSelected(new Set())
    setSearch('')
    setError(null)
    onClose()
  }

  if (!isOpen || !coupon) return null

  const allVisibleSelected =
    filtered.length > 0 && filtered.every((s) => selected.has(s.id))

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-lg p-6">
      <h2 className="font-heading text-lg font-medium mb-1">Send coupon</h2>
      <p className="text-sm text-foreground/55 mb-1">
        Code <span className="font-mono font-semibold text-primary">{coupon.code}</span>
      </p>
      <p className="text-xs text-muted-foreground/70 mb-4">
        {formatCouponSummary(coupon)}
        <span className="block mt-0.5">{formatCouponLimits(coupon)}</span>
      </p>

      <div className="relative mb-3">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/70" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search students..."
          className="w-full pl-9 pr-3 py-2.5 text-sm rounded-[16px] border border-border bg-elevated focus:outline-none focus:border-primary"
        />
      </div>

      <div className="flex items-center justify-between mb-2">
        <p className="text-xs text-muted-foreground">
          {selected.size} selected · {filtered.length} shown
        </p>
        {filtered.length > 0 && (
          <button
            type="button"
            onClick={toggleAllVisible}
            className="text-xs font-semibold text-primary hover:text-primary-dark cursor-pointer"
          >
            {allVisibleSelected ? 'Deselect all' : 'Select all'}
          </button>
        )}
      </div>

      <div className="rounded-[16px] border border-border max-h-64 overflow-y-auto divide-y divide-border">
        {loading ? (
          <div className="p-4">
            <TeacherTableSkeleton rows={4} />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground p-4 text-center">No students match your search.</p>
        ) : (
          filtered.map((student) => {
            const checked = selected.has(student.id)
            return (
              <label
                key={student.id}
                className={`flex items-center gap-3 px-3 py-2.5 cursor-pointer hover:bg-muted/60 ${
                  checked ? 'bg-primary/10/50' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(student.id)}
                  className="accent-teal shrink-0"
                />
                <Avatar src={student.avatar} name={student.name} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium truncate">{student.name}</p>
                  {student.phone && (
                    <p className="text-xs text-muted-foreground/70 truncate">{student.phone}</p>
                  )}
                </div>
              </label>
            )
          })
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-3 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
          {error}
        </p>
      )}

      <div className="flex gap-3 mt-5">
        <Button variant="secondary" className="flex-1" onClick={handleClose} disabled={sending}>
          Cancel
        </Button>
        <Button
          className="flex-1 gap-1.5"
          onClick={() => void handleSend()}
          disabled={sending || selected.size === 0}
        >
          <Send size={16} />
          {sending ? 'Sending...' : `Send to ${selected.size || 0}`}
        </Button>
      </div>
    </Modal>
  )
}
