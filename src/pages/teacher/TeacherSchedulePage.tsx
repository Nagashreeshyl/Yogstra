import { useEffect, useState } from 'react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherSchedulesForMonth } from '../../services/classOrders'
import { TeacherScheduleCalendar } from '../../components/schedule/TeacherScheduleCalendar'
import { supabase } from '../../lib/supabase'

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

  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel(`teacher_schedule:${user.id}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'schedules', filter: `teacher_id=eq.${user.id}` },
        () => void refetch(true),
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'class_orders', filter: `teacher_id=eq.${user.id}` },
        () => void refetch(true),
      )
      .subscribe()

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [user?.id, refetch])

  return (
    <div className="p-8 max-w-4xl">
      <h1 className="font-heading text-3xl font-medium mb-2">Schedule</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Your calendar updates automatically when students book and pay for classes.
      </p>

      <TeacherScheduleCalendar
        schedules={schedules ?? []}
        loading={loading}
        onMonthChange={(year, month) => setMonthKey({ year, month })}
      />
    </div>
  )
}
