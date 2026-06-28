import { IndianRupee, TrendingUp, Calendar, Wallet } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchTeacherEarningsSnapshot } from '../../services/teacherEarnings'
import { Card } from '../../components/ui/Card'
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
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-2">Earnings</h1>
      <p className="text-sm text-charcoal/50 mb-8">
        Student payments update in realtime.
        {earnings?.commissionPercent != null
          ? ` Platform commission: ${earnings.commissionPercent}%.`
          : null}
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <IndianRupee size={16} className="text-teal" />
            <span className="text-xs">Total Income</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            ₹{(earnings?.totalIncome ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-charcoal/45 mt-1">Gross from student payments</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <Wallet size={16} className="text-teal" />
            <span className="text-xs">Paid Out</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            ₹{(earnings?.totalPaidOut ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-charcoal/45 mt-1">Transferred to your account</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <TrendingUp size={16} className="text-teal" />
            <span className="text-xs">Pending Payout</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            ₹{(earnings?.totalPendingPayout ?? 0).toLocaleString('en-IN')}
          </p>
          <p className="text-xs text-charcoal/45 mt-1">Awaiting transfer</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <Calendar size={16} className="text-teal" />
            <span className="text-xs">Latest Payment</span>
          </div>
          <p className="font-heading text-2xl font-medium">{earnings?.latestPaymentLabel ?? '—'}</p>
          <p className="text-xs text-charcoal/45 mt-1">
            Active monthly ₹{(earnings?.activeMonthlyRecurring ?? 0).toLocaleString('en-IN')}
          </p>
        </Card>
      </div>

      <h2 className="font-heading text-lg font-medium mb-4">Payment History</h2>
      {loading ? (
        <TeacherTableSkeleton rows={4} />
      ) : history.length === 0 ? (
        <p className="text-charcoal/50">
          No payments yet. Add your UPI ID in Settings → Payouts so admin can pay you when earnings are ready.
        </p>
      ) : (
        <div className="border border-border rounded-sm overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-cream-dark border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Student / Period</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Details</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Gross</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Commission</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Your Share</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Status</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Date</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.label}</td>
                  <td className="px-4 py-3 text-charcoal/60">{row.detail}</td>
                  <td className="px-4 py-3">₹{row.grossAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 text-charcoal/60">₹{row.commissionAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3 font-medium">₹{row.netAmount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === 'Paid' || row.status === 'Received' ? 'verified' : 'teal'}>
                      {row.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-charcoal/60">{formatRelativeDate(row.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
