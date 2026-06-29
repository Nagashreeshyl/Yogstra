import { useEffect } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import {
  fetchActiveBookingCount,
  fetchMonthlyRevenue,
} from '../../services/bookings'
import {
  fetchPendingTeachers,
  fetchTeacherCount,
} from '../../services/teachers'
import { fetchStudentCount } from '../../services/students'
import { fetchRecentActivity, subscribeToAdminDashboard } from '../../services/admin'
import { AdminTable, StatCard } from '../../components/admin/AdminTable'
import { PageHeader } from '../../components/shell/PageHeader'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { AdminDashboardSkeleton } from '../../components/ui/Skeleton'
import { updateTeacherStatus } from '../../services/teachers'

export function AdminDashboardPage() {
  const { data: teacherCount, loading: teachersLoading, refetch: refetchTeachers } = useAsyncData(() => fetchTeacherCount())
  const { data: studentCount, loading: studentsLoading, refetch: refetchStudents } = useAsyncData(() => fetchStudentCount())
  const { data: activeBookings, refetch: refetchBookings } = useAsyncData(() =>
    fetchActiveBookingCount(),
  )
  const { data: revenue, refetch: refetchRevenue } = useAsyncData(() => fetchMonthlyRevenue())
  const { data: pending, refetch: refetchPending } = useAsyncData(() => fetchPendingTeachers())
  const { data: activities, refetch: refetchActivity } = useAsyncData(() => fetchRecentActivity())

  useEffect(() => {
    const refresh = () => {
      void refetchTeachers(true)
      void refetchStudents(true)
      void refetchBookings(true)
      void refetchRevenue(true)
      void refetchPending(true)
      void refetchActivity(true)
    }
    const unsubscribe = subscribeToAdminDashboard(refresh)
    return unsubscribe
  }, [refetchTeachers, refetchStudents, refetchBookings, refetchRevenue, refetchPending, refetchActivity])

  const handleApprove = async (id: string) => {
    await updateTeacherStatus(id, 'verified')
    await refetchPending(true)
  }

  const handleReject = async (id: string) => {
    await updateTeacherStatus(id, 'rejected')
    await refetchPending(true)
  }

  if (teachersLoading && studentsLoading) {
    return <AdminDashboardSkeleton />
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Platform overview and pending actions." />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Teachers" value={teacherCount ?? 0} />
        <StatCard label="Total Students" value={studentCount ?? 0} />
        <StatCard label="Active Bookings" value={activeBookings ?? 0} />
        <StatCard label="Pending Verifications" value={pending?.length ?? 0} />
        <StatCard label="Monthly Revenue" value={`₹${(revenue ?? 0).toLocaleString('en-IN')}`} />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Recent Activity</h2>
          <div className="rounded-[16px] border border-border divide-y divide-border">
            {(activities ?? []).length === 0 ? (
              <p className="px-4 py-3 text-sm text-muted-foreground">No recent activity.</p>
            ) : (
              activities!.map((a) => (
                <div key={a.id} className="px-4 py-3 flex justify-between gap-4">
                  <span className="text-sm">{a.text}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                </div>
              ))
            )}
          </div>
        </div>

        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Pending Teacher Verifications</h2>
          <AdminTable headers={['Name', 'Email', 'City', 'Status', 'Actions']}>
            {(pending ?? []).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-3 text-sm text-muted-foreground">No pending verifications.</td>
              </tr>
            ) : (
              pending!.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email || '—'}</td>
                  <td className="px-4 py-3">{t.city}</td>
                  <td className="px-4 py-3"><Badge variant="primary">{t.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleApprove(t.id)}>Approve</Button>
                      <Button variant="secondary" size="sm" onClick={() => handleReject(t.id)}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </AdminTable>
        </div>
      </div>
    </div>
  )
}
