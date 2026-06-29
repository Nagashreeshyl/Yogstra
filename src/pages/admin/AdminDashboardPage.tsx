import { useEffect } from 'react'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useApp } from '../../context/AppContext'
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
import { AdminTable } from '../../components/admin/AdminTable'
import { DashboardWorkspaceHeader } from '../../components/shell/DashboardWorkspaceHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { InstructionPanel } from '../../components/ui/InstructionPanel'
import { HelpTooltip } from '../../components/ui/HelpTooltip'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { AdminDashboardSkeleton } from '../../components/ui/Skeleton'
import { updateTeacherStatus } from '../../services/teachers'

function StatWithHelp({
  label,
  value,
  help,
}: {
  label: string
  value: string | number
  help: { description: string; example?: string }
}) {
  return (
    <div className="rounded-[16px] border border-border bg-elevated p-4">
      <div className="flex items-center gap-1.5 mb-2">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</span>
        <HelpTooltip label={label} description={help.description} example={help.example} />
      </div>
      <p className="font-heading text-2xl font-semibold text-foreground">{value}</p>
    </div>
  )
}

export function AdminDashboardPage() {
  const { user } = useApp()
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
    <div className="space-y-8">
      <DashboardWorkspaceHeader
        workspaceTitle="Platform Admin"
        description="Platform overview, pending approvals, and recent activity."
        userName={user?.name ?? 'Admin'}
      />

      <InstructionPanel
        storageKey="admin-dashboard"
        title="Admin control center"
        steps={[
          { label: 'Review pending teacher approvals' },
          { label: 'Monitor platform statistics' },
          { label: 'Manage academies and competitions' },
          { label: 'Process payouts and reports' },
        ]}
      />

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <StatWithHelp
          label="Teachers"
          value={teacherCount ?? 0}
          help={{ description: 'Total registered coaches on the platform.', example: '142 verified coaches' }}
        />
        <StatWithHelp
          label="Students"
          value={studentCount ?? 0}
          help={{ description: 'Active student accounts.', example: '1,240 students' }}
        />
        <StatWithHelp
          label="Active enrollments"
          value={activeBookings ?? 0}
          help={{ description: 'Currently active program enrollments.', example: '86 active' }}
        />
        <StatWithHelp
          label="Pending approvals"
          value={pending?.length ?? 0}
          help={{ description: 'Coach applications awaiting verification.', example: '3 pending' }}
        />
        <StatWithHelp
          label="Monthly revenue"
          value={`₹${(revenue ?? 0).toLocaleString('en-IN')}`}
          help={{ description: 'Platform commission from paid enrollments this month.' }}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Recent activity</h2>
          {(activities ?? []).length === 0 ? (
            <EmptyState
              title="No recent activity"
              description="Platform events such as new enrollments and verifications appear here."
              className="py-8"
            />
          ) : (
            <div className="rounded-[16px] border border-border divide-y divide-border">
              {activities!.map((a) => (
                <div key={a.id} className="px-4 py-3 flex justify-between gap-4">
                  <span className="text-sm">{a.text}</span>
                  <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="font-heading text-lg font-medium mb-4">Pending teacher verifications</h2>
          {(pending ?? []).length === 0 ? (
            <EmptyState
              title="All caught up"
              description="No coach applications are waiting for review."
              className="py-8"
            />
          ) : (
            <AdminTable headers={['Name', 'Email', 'City', 'Status', 'Actions']}>
              {pending!.map((t) => (
                <tr key={t.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">{t.email || '—'}</td>
                  <td className="px-4 py-3">{t.city}</td>
                  <td className="px-4 py-3"><Badge variant="primary">{t.status}</Badge></td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => void handleApprove(t.id)}>Approve</Button>
                      <Button variant="secondary" size="sm" onClick={() => void handleReject(t.id)}>Reject</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </AdminTable>
          )}
        </div>
      </div>
    </div>
  )
}
