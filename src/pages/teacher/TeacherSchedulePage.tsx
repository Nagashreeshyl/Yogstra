import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchTeacherUpcomingSchedules, fetchTodaySchedules } from '../../services/schedules'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { Button } from '../../components/ui/Button'

export function TeacherSchedulePage() {
  const { user } = useApp()
  const { data: todayClasses, loading: todayLoading } = useAsyncData(
    () => (user ? fetchTodaySchedules(user.id) : Promise.resolve([])),
    [user?.id],
  )
  const { data: allClasses, loading } = useAsyncData(
    () => (user ? fetchTeacherUpcomingSchedules(user.id) : Promise.resolve([])),
    [user?.id],
  )

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Schedule</h1>

      <div className="space-y-3 mb-8">
        <h2 className="font-heading text-lg font-medium">Today</h2>
        {todayLoading ? (
          <p className="text-charcoal/50 text-sm">Loading...</p>
        ) : (todayClasses ?? []).length === 0 ? (
          <p className="text-charcoal/50 text-sm">No classes today.</p>
        ) : (
          todayClasses!.map((cls) => (
            <Card key={cls.id} className="p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-medium text-sm">{cls.time}</p>
                <p className="text-xs text-charcoal/50 mt-0.5">{cls.studentNames.join(', ')}</p>
                <Badge variant="mode" className="mt-2">{cls.type}</Badge>
              </div>
              <Button size="sm">Start Class</Button>
            </Card>
          ))
        )}
      </div>

      <div>
        <h2 className="font-heading text-lg font-medium mb-4">All Upcoming</h2>
        {loading ? (
          <p className="text-charcoal/50 text-sm">Loading...</p>
        ) : (allClasses ?? []).length === 0 ? (
          <p className="text-charcoal/50 text-sm">No scheduled classes.</p>
        ) : (
          <div className="border border-border rounded-sm divide-y divide-border">
            {allClasses!.map((cls) => (
              <div key={cls.id} className="px-4 py-3 flex items-center justify-between text-sm">
                <span className="font-medium w-24">{cls.date}</span>
                <span className="text-charcoal/60 flex-1">
                  {cls.time} · {cls.studentNames.join(', ')} · {cls.type}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
