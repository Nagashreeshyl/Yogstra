import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchTeacherEarningsSnapshot } from '../../services/teacherEarnings'
import { PageContainer } from '../../components/shell/PageContainer'
import { PageHeader } from '../../components/shell/PageHeader'
import { EmptyState } from '../../components/shell/EmptyState'
import { DashboardCard } from '../../components/student/dashboard/DashboardCard'
import { Badge } from '../../components/ui/Badge'
import { TeacherEarningsSkeleton, TeacherTableSkeleton } from '../../components/ui/Skeleton'
import { formatRelativeDate } from '../../utils/format'

export function TeacherEarningsPage() {
  const { user } = useApp()
  const { data: earnings, loading, refetch } = useAsyncData(
    () => (user ? fetchTeacherEarningsSnapshot(user.id) : Promise.resolve(null)),
    [user?.id],
  )

  useLiveDataRefresh(refetch, ['schedules', 'bookings', 'payouts'], Boolean(user?.id))

  const history = earnings?.history ?? []

  if (loading && !earnings) {
    return <TeacherEarningsSkeleton />
  }

  return (
    <PageContainer>
      <div className="space-y-6">
        <PageHeader
          title="Earnings"
          description={`Student payments update in realtime.${
            earnings?.commissionPercent != null
              ? ` Platform commission: ${earnings.commissionPercent}%.`
              : ''
          }`}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <DashboardCard title="Total Income" description="Gross from student payments">
            <p className="font-heading text-2xl font-medium">
              ₹{(earnings?.totalIncome ?? 0).toLocaleString('en-IN')}
            </p>
          </DashboardCard>
          <DashboardCard title="Paid Out" description="Transferred to your account">
            <p className="font-heading text-2xl font-medium">
              ₹{(earnings?.totalPaidOut ?? 0).toLocaleString('en-IN')}
            </p>
          </DashboardCard>
          <DashboardCard title="Pending Payout" description="Awaiting transfer">
            <p className="font-heading text-2xl font-medium">
              ₹{(earnings?.totalPendingPayout ?? 0).toLocaleString('en-IN')}
            </p>
          </DashboardCard>
          <DashboardCard title="Latest Payment" description={`Active monthly ₹${(earnings?.activeMonthlyRecurring ?? 0).toLocaleString('en-IN')}`}>
            <p className="font-heading text-2xl font-medium">{earnings?.latestPaymentLabel ?? '—'}</p>
          </DashboardCard>
        </div>

        <DashboardCard title="Payment History">
          {loading ? (
            <TeacherTableSkeleton rows={4} />
          ) : history.length === 0 ? (
            <EmptyState
              title="No payments yet"
              description="Add your UPI ID in Settings → Payouts so admin can pay you when earnings are ready."
            />
          ) : (
        <div className="rounded-[16px] border border-border overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-muted border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Student / Period</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Details</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Gross</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Your Share</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 text-muted-foreground">{row.detail}</td>
                  <td className="px-4 py-3">₹{row.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-muted-foreground">₹{row.commissionAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-medium">₹{row.netAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === 'Paid' || row.status === 'Received' ? 'verified' : 'primary'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatRelativeDate(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
          )}
        </DashboardCard>
      </div>
    </PageContainer>
  )
}
