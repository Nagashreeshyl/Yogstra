import { Link } from 'react-router-dom'
import { Users, Calendar, IndianRupee, Star, MessageCircle } from 'lucide-react'
import { useApp } from '../context/AppContext'
import { useAsyncData } from '../hooks/useAsyncData'
import { fetchPosts } from '../services/posts'
import { fetchTodaySchedules } from '../services/schedules'
import {
  fetchTeacherActiveStudentCount,
  fetchTeacherMonthlyEarnings,
  fetchTeacherPendingBookings,
  updateBookingStatus,
} from '../services/bookings'
import { fetchTeacherById } from '../services/teachers'
import { Avatar } from '../components/ui/Avatar'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Badge } from '../components/ui/Badge'
import { TeacherDashboardSkeleton } from '../components/ui/Skeleton'

export function TeacherDashboardPage() {
  const { user } = useApp()
  const teacherId = user?.id ?? ''

  const { data: studentCount, loading: studentsLoading, refetch: refetchStudents } = useAsyncData(
    () => (teacherId ? fetchTeacherActiveStudentCount(teacherId) : Promise.resolve(0)),
    [teacherId],
  )
  const { data: todayClasses } = useAsyncData(
    () => (teacherId ? fetchTodaySchedules(teacherId) : Promise.resolve([])),
    [teacherId],
  )
  const { data: monthlyEarnings } = useAsyncData(
    () => (teacherId ? fetchTeacherMonthlyEarnings(teacherId) : Promise.resolve(0)),
    [teacherId],
  )
  const { data: teacherProfile, loading: profileLoading } = useAsyncData(
    () => (teacherId ? fetchTeacherById(teacherId) : Promise.resolve(null)),
    [teacherId],
  )
  const { data: pendingBookings, refetch: refetchPending } = useAsyncData(
    () => (teacherId ? fetchTeacherPendingBookings(teacherId) : Promise.resolve([])),
    [teacherId],
  )
  const { data: posts } = useAsyncData(() => fetchPosts(5))

  const handleBookingAction = async (bookingId: string, status: 'active' | 'cancelled') => {
    await updateBookingStatus(bookingId, status)
    await refetchPending()
    await refetchStudents()
  }

  const stats = [
    { label: 'Total Students', value: String(studentCount ?? 0), icon: Users },
    { label: 'Classes Today', value: String(todayClasses?.length ?? 0), icon: Calendar },
    {
      label: 'Earnings This Month',
      value: `₹${(monthlyEarnings ?? 0).toLocaleString('en-IN')}`,
      icon: IndianRupee,
    },
    {
      label: 'Rating',
      value: teacherProfile?.rating ? teacherProfile.rating.toFixed(1) : '—',
      icon: Star,
    },
  ]

  if (studentsLoading && profileLoading) {
    return <TeacherDashboardSkeleton />
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="p-5">
            <div className="flex items-center gap-3 mb-2">
              <Icon size={18} className="text-teal" />
              <span className="text-xs text-charcoal/50">{label}</span>
            </div>
            <p className="font-heading text-2xl font-medium">{value}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Today&apos;s Schedule</h2>
          <div className="space-y-3">
            {(todayClasses ?? []).length === 0 ? (
              <p className="text-sm text-charcoal/50">No classes scheduled for today.</p>
            ) : (
              todayClasses!.map((cls) => (
                <Card key={cls.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{cls.time}</p>
                    <p className="text-xs text-charcoal/50 mt-0.5">
                      {cls.studentNames.join(', ')}
                    </p>
                    <Badge variant="mode" className="mt-2">{cls.type}</Badge>
                  </div>
                  <Button size="sm">Start Class</Button>
                </Card>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Pending Requests</h2>
          <div className="space-y-3 mb-8">
            {(pendingBookings ?? []).length === 0 ? (
              <p className="text-sm text-charcoal/50">No pending booking requests.</p>
            ) : (
              pendingBookings!.map((req) => (
                <Card key={req.id} className="p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-medium text-sm">{req.studentName}</p>
                    <p className="text-xs text-charcoal/50">
                      ₹{req.monthlyFee.toLocaleString('en-IN')} / month · {req.startDate}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleBookingAction(req.id, 'active')}>
                      Accept
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => handleBookingAction(req.id, 'cancelled')}
                    >
                      Decline
                    </Button>
                  </div>
                </Card>
              ))
            )}
          </div>

          <h2 className="font-heading text-lg font-medium mb-4">Recent Community Posts</h2>
          <div className="space-y-3">
            {(posts ?? []).length === 0 ? (
              <p className="text-sm text-charcoal/50">No community posts yet.</p>
            ) : (
              <>
                {posts!.map((post) => (
                  <Card key={post.id} className="p-4 overflow-hidden">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar src={post.studentAvatar} name={post.studentName} size={28} />
                      <span className="text-sm font-medium">{post.studentName}</span>
                    </div>
                    {post.image && !post.video && (
                      <div className="w-full aspect-[4/5] overflow-hidden rounded-sm mb-2 bg-cream-dark">
                        <img
                          src={post.image}
                          alt=""
                          className="w-full h-full object-cover object-center"
                        />
                      </div>
                    )}
                    {post.video && (
                      <video
                        src={post.video}
                        controls
                        className="w-full aspect-[4/5] max-h-[280px] rounded-sm mb-2 object-cover bg-cream-dark"
                      />
                    )}
                    {post.text && (
                      <p className="text-sm text-charcoal/70 line-clamp-2">{post.text}</p>
                    )}
                    <Link
                      to="/dashboard/teacher/community"
                      className="flex items-center gap-1.5 text-xs text-teal mt-3"
                    >
                      <MessageCircle size={14} /> View in Community
                    </Link>
                  </Card>
                ))}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
