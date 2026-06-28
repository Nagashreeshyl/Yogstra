import { useCallback, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchTeacherSchedulesForMonth } from '../../services/classOrders'
import { TeacherScheduleCalendar } from '../../components/schedule/TeacherScheduleCalendar'

export function TeacherSchedulePage() {
  const { user } = useApp()
  const today = new Date()
  const [monthKey, setMonthKey] = useState({
    year: today.getFullYear(),
    month: today.getMonth(),
  })

  const { data: schedules, loading, refetch } = useAsyncData(
    () =>
      user
        ? fetchTeacherSchedulesForMonth(user.id, monthKey.year, monthKey.month)
        : Promise.resolve([]),
    [user?.id, monthKey.year, monthKey.month],
  )

  useLiveDataRefresh(refetch, ['schedules'], Boolean(user?.id))

  const handleMonthChange = useCallback((year: number, month: number) => {
    setMonthKey((prev) =>
      prev.year === year && prev.month === month ? prev : { year, month },
    )
  }, [])

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-medium mb-2">Schedule</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Your calendar updates automatically when students book and pay for classes.
      </p>

      <TeacherScheduleCalendar
        schedules={schedules ?? []}
        loading={loading}
        onMonthChange={handleMonthChange}
      />
    </div>
  )
}
