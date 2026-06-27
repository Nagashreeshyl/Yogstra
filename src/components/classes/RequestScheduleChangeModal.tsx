import { useEffect, useState } from 'react'
import { CalendarClock } from 'lucide-react'
import { Modal } from '../ui/Modal'
import { Button } from '../ui/Button'
import { Input } from '../ui/Input'
import { Select } from '../ui/Select'
import { Textarea } from '../ui/Textarea'
import {
  createScheduleChangeRequest,
  fetchScheduleContext,
  getScheduleChangeDateBounds,
  SCHEDULE_CHANGE_SCOPE_LABELS,
  type ScheduleChangeScope,
} from '../../services/scheduleChangeRequests'
import {
  DEFAULT_SESSION_TIME,
  SESSION_TIME_OPTIONS,
} from '../../utils/sessionTimeOptions'
import { formatTime } from '../../utils/format'

interface RequestScheduleChangeModalProps {
  isOpen: boolean
  onClose: () => void
  studentId: string
  teacherId: string
  teacherName: string
  onSubmitted: () => void
}

export function RequestScheduleChangeModal({
  isOpen,
  onClose,
  studentId,
  teacherId,
  teacherName,
  onSubmitted,
}: RequestScheduleChangeModalProps) {
  const [scope, setScope] = useState<ScheduleChangeScope>('1_day')
  const [requestedDate, setRequestedDate] = useState('')
  const [requestedTime, setRequestedTime] = useState(DEFAULT_SESSION_TIME)
  const [studentNote, setStudentNote] = useState('')
  const [currentScheduledAt, setCurrentScheduledAt] = useState<string | null>(null)
  const [planStartDate, setPlanStartDate] = useState<string | null>(null)
  const [planEndDate, setPlanEndDate] = useState<string | null>(null)
  const [hasPending, setHasPending] = useState(false)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!isOpen) return
    setError(null)
    setScope('1_day')
    setStudentNote('')
    setRequestedTime(DEFAULT_SESSION_TIME)
    setLoading(true)

    void fetchScheduleContext(studentId, teacherId)
      .then((context) => {
        if (!context) {
          setError('No active coaching plan found for this teacher.')
          setCurrentScheduledAt(null)
          setPlanStartDate(null)
          setPlanEndDate(null)
          setHasPending(false)
          return
        }
        setCurrentScheduledAt(context.currentScheduledAt)
        setPlanStartDate(context.planStartDate)
        setPlanEndDate(context.planEndDate)
        setHasPending(Boolean(context.pendingRequest))
        if (context.currentScheduledAt) {
          const bounds = getScheduleChangeDateBounds(context)
          const datePart = context.currentScheduledAt.slice(0, 10)
          const initialDate =
            datePart >= bounds.min && datePart <= bounds.max ? datePart : bounds.min
          setRequestedDate(initialDate)
          const timePart = new Date(context.currentScheduledAt)
            .toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false })
          setRequestedTime(timePart)
        }
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Could not load schedule.')
      })
      .finally(() => setLoading(false))
  }, [isOpen, studentId, teacherId])

  const dateBounds =
    planStartDate && planEndDate
      ? getScheduleChangeDateBounds({ planStartDate, planEndDate })
      : null

  const handleSubmit = async () => {
    if (!requestedDate) {
      setError('Choose a start date for the new timing.')
      return
    }

    setSubmitting(true)
    setError(null)
    try {
      await createScheduleChangeRequest({
        studentId,
        teacherId,
        scope,
        requestedDate,
        requestedTime,
        studentNote,
      })
      onSubmitted()
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit request.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="flex items-center gap-2 mb-2">
        <CalendarClock size={20} className="text-teal" />
        <h2 className="font-heading text-xl font-medium">Change class timing</h2>
      </div>
      <p className="text-sm text-charcoal/55 mb-6">
        Request a new time with {teacherName}. Your teacher must approve before it takes effect.
      </p>

      {loading ? (
        <p className="text-sm text-charcoal/50">Loading your schedule…</p>
      ) : hasPending ? (
        <div className="border border-amber-200 bg-amber-50 rounded-sm px-4 py-3 text-sm text-amber-900">
          You already have a pending timing change request for this coach. Wait for your teacher
          to respond before submitting another.
        </div>
      ) : (
        <div className="space-y-4">
          {planStartDate && planEndDate && (
            <div className="text-xs text-charcoal/50 border border-border rounded-sm px-3 py-2 bg-surface-muted/30">
              Your coaching plan runs{' '}
              {new Date(`${planStartDate}T12:00:00`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
              })}{' '}
              to{' '}
              {new Date(`${planEndDate}T12:00:00`).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })}
              . Timing changes must fall within this period.
            </div>
          )}

          {currentScheduledAt && (
            <div className="text-sm border border-border rounded-sm px-3 py-2.5 bg-surface-muted/50">
              <span className="text-charcoal/50">Current next session: </span>
              <span className="font-medium">
                {formatTime(currentScheduledAt)}{' '}
                {new Date(currentScheduledAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </div>
          )}

          <Select
            label="How long should this change apply?"
            value={scope}
            onChange={(e) => setScope(e.target.value as ScheduleChangeScope)}
          >
            {(Object.entries(SCHEDULE_CHANGE_SCOPE_LABELS) as [ScheduleChangeScope, string][]).map(
              ([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ),
            )}
          </Select>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label={scope === 'permanent' ? 'Effective from' : 'Start date'}
              type="date"
              value={requestedDate}
              min={dateBounds?.min}
              max={dateBounds?.max}
              onChange={(e) => setRequestedDate(e.target.value)}
            />
            <Select
              label="New preferred time"
              value={requestedTime}
              onChange={(e) => setRequestedTime(e.target.value)}
            >
              {SESSION_TIME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <p className="text-xs text-charcoal/45 -mt-1">
            {scope === 'permanent'
              ? 'Permanent changes apply to all remaining sessions until your plan ends.'
              : `This updates your class time for ${SCHEDULE_CHANGE_SCOPE_LABELS[scope].toLowerCase()} starting on the selected date.`}
          </p>

          <Textarea
            label="Message to teacher (optional)"
            placeholder="Reason for the change, timezone, etc."
            value={studentNote}
            onChange={(e) => setStudentNote(e.target.value)}
            rows={3}
          />

          {error && (
            <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-3 py-2 rounded-sm">
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" className="flex-1" onClick={onClose}>
              Cancel
            </Button>
            <Button
              className="flex-1"
              disabled={submitting || !currentScheduledAt}
              onClick={() => void handleSubmit()}
            >
              {submitting ? 'Sending…' : 'Send request'}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  )
}
