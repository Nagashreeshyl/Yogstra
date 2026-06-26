import { Calendar, BookOpen, Flame, Clock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchPosts } from '../services/posts'
import { fetchStudentActiveBooking } from '../services/bookings'
import { fetchTeacherById } from '../services/teachers'
import { fetchStudentSessionCount, fetchStudentUpcomingSchedules } from '../services/schedules'
import { CategoryFlashCards } from '../components/categories/CategoryFlashCards'
import { CommunityFeed } from '../components/community/CommunityFeed'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'

export function StudentDashboardPage() {
  const { user } = useApp()
  const { data: posts, loading: postsLoading } = useAsyncData(() => fetchPosts())
  const { data: booking } = useAsyncData(
    () => (user ? fetchStudentActiveBooking(user.id) : Promise.resolve(null)),
    [user?.id],
  )
  const { data: myTeacher } = useAsyncData(
    () => (booking ? fetchTeacherById(booking.teacherId) : Promise.resolve(null)),
    [booking?.teacherId],
  )
  const { data: upcomingClasses } = useAsyncData(
    () => (user ? fetchStudentUpcomingSchedules(user.id) : Promise.resolve([])),
    [user?.id],
  )
  const { data: sessionCount } = useAsyncData(
    () => (user ? fetchStudentSessionCount(user.id) : Promise.resolve(0)),
    [user?.id],
  )

  const nextClass = upcomingClasses?.[0]
  const stats = [
    { label: 'Sessions Completed', value: String(sessionCount ?? 0), icon: BookOpen },
    { label: 'Active Plan', value: booking?.status ?? 'None', icon: Flame },
    { label: 'Next Class', value: nextClass?.time ?? 'Not scheduled', icon: Clock },
    { label: 'This Week', value: String(upcomingClasses?.length ?? 0), icon: Calendar },
  ]

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">
        Welcome, {user?.name || 'Student'}
      </h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon size={18} className="text-teal" />
              <span className="text-xs text-charcoal/50">{label}</span>
            </div>
            <p className="font-heading text-xl font-medium">{value}</p>
          </Card>
        ))}
      </div>

      {myTeacher && (
        <Card className="p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <img src={myTeacher.photo} alt={myTeacher.name} className="w-16 h-16 rounded-full object-cover" />
          <div className="flex-1">
            <p className="text-xs text-charcoal/50 mb-1">My Teacher</p>
            <h2 className="font-heading text-lg font-medium">{myTeacher.name}</h2>
            <p className="text-sm text-charcoal/60 mt-1">
              {nextClass ? `Next class: ${nextClass.time}` : 'Active enrollment'}
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" size="sm">Open Chat</Button>
            <Button size="sm">Join Class</Button>
          </div>
        </Card>
      )}

      {(upcomingClasses ?? []).length > 0 && (
        <div className="mb-8">
          <h2 className="font-heading text-lg font-medium mb-4">Upcoming Schedule</h2>
          <div className="space-y-3">
            {upcomingClasses!.map((cls) => (
              <Card key={cls.id} className="p-4 flex items-center justify-between gap-4">
                <div>
                  <p className="font-medium text-sm">{cls.time}</p>
                  <p className="text-xs text-charcoal/50 mt-0.5">{cls.date}</p>
                  <Badge variant="mode" className="mt-2">{cls.type}</Badge>
                </div>
                <Button size="sm">Join Class</Button>
              </Card>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-8">
        <CategoryFlashCards />
        {postsLoading ? (
          <p className="text-charcoal/50 text-sm">Loading feed...</p>
        ) : (
          <CommunityFeed posts={posts ?? []} />
        )}
      </div>
    </div>
  )
}
