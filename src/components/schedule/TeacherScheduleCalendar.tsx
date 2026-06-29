import { useEffect, useMemo, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Badge } from '../ui/Badge'
import { ScheduleCalendarSkeleton } from '../ui/Skeleton'

type ScheduleItem = {
  id: string
  scheduled_at: string
  class_type: string
  student?: { full_name?: string | null } | { full_name?: string | null }[] | null
}

interface TeacherScheduleCalendarProps {
  schedules: ScheduleItem[]
  loading?: boolean
  onMonthChange?: (year: number, month: number) => void
}

function getStudentName(student: ScheduleItem['student']) {
  if (!student) return 'Student'
  const row = Array.isArray(student) ? student[0] : student
  return row?.full_name ?? 'Student'
}

export function TeacherScheduleCalendar({ schedules, loading, onMonthChange }: TeacherScheduleCalendarProps) {
  const today = new Date()
  const [viewDate, setViewDate] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selectedDay, setSelectedDay] = useState<string | null>(null)

  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const onMonthChangeRef = useRef(onMonthChange)
  onMonthChangeRef.current = onMonthChange

  useEffect(() => {
    onMonthChangeRef.current?.(year, month)
  }, [year, month])

  const byDate = useMemo(() => {
    const map = new Map<string, ScheduleItem[]>()
    for (const item of schedules) {
      const key = item.scheduled_at.slice(0, 10)
      const list = map.get(key) ?? []
      list.push(item)
      map.set(key, list)
    }
    return map
  }, [schedules])

  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const monthLabel = viewDate.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' })

  const cells: (number | null)[] = [
    ...Array.from({ length: firstDay }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const selectedItems = selectedDay ? byDate.get(selectedDay) ?? [] : []

  if (loading) {
    return <ScheduleCalendarSkeleton />
  }

  return (
    <div className="rounded-[16px] border border-border bg-elevated overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted">
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month - 1, 1))}
          className="p-1.5 rounded-sm hover:bg-elevated cursor-pointer text-muted-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="font-heading text-base font-medium">{monthLabel}</h2>
        <button
          type="button"
          onClick={() => setViewDate(new Date(year, month + 1, 1))}
          className="p-1.5 rounded-sm hover:bg-elevated cursor-pointer text-muted-foreground"
          aria-label="Next month"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-px bg-border p-px">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
          <div key={d} className="bg-elevated text-center text-[10px] font-semibold text-muted-foreground/70 py-2">
            {d}
          </div>
        ))}
        {cells.map((day, idx) => {
          if (!day) {
            return <div key={`empty-${idx}`} className="bg-elevated min-h-[72px]" />
          }
          const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
          const items = byDate.get(dateKey) ?? []
          const isToday =
            day === today.getDate() && month === today.getMonth() && year === today.getFullYear()
          const isSelected = selectedDay === dateKey

          return (
            <button
              key={dateKey}
              type="button"
              onClick={() => setSelectedDay(isSelected ? null : dateKey)}
              className={`bg-elevated min-h-[72px] p-1.5 text-left cursor-pointer transition-colors hover:bg-muted ${
                isSelected ? 'ring-2 ring-inset ring-teal bg-primary/10/40' : ''
              }`}
            >
              <span
                className={`inline-flex w-6 h-6 items-center justify-center rounded-full text-xs font-medium ${
                  isToday ? 'bg-primary text-primary-foreground' : 'text-foreground'
                }`}
              >
                {day}
              </span>
              {items.length > 0 && (
                <div className="mt-1 space-y-0.5">
                  {items.slice(0, 2).map((item) => (
                    <div
                      key={item.id}
                      className="text-[9px] leading-tight truncate bg-primary/15 text-primary-dark px-1 py-0.5 rounded-sm"
                    >
                      {new Date(item.scheduled_at).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  ))}
                  {items.length > 2 && (
                    <p className="text-[9px] text-muted-foreground/70">+{items.length - 2} more</p>
                  )}
                </div>
              )}
            </button>
          )
        })}
      </div>

      {selectedDay && (
        <div className="border-t border-border p-4 bg-muted/50">
          <p className="text-sm font-semibold mb-3">
            {new Date(selectedDay).toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No bookings on this date.</p>
          ) : (
            <div className="space-y-2">
              {selectedItems
                .sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at))
                .map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between gap-3 bg-elevated rounded-[16px] border border-border px-3 py-2.5"
                  >
                    <div>
                      <p className="text-sm font-medium">
                        {new Date(item.scheduled_at).toLocaleTimeString('en-IN', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                      <p className="text-xs text-foreground/55 mt-0.5">
                        {getStudentName(item.student)}
                      </p>
                    </div>
                    <Badge variant="mode">{item.class_type}</Badge>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
