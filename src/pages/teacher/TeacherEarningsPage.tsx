import { IndianRupee, TrendingUp, Calendar } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useAsyncData } from '../../hooks/useAsyncData'
import { useLiveDataRefresh } from '../../hooks/useLiveDataRefresh'
import { fetchTeacherPayouts } from '../../services/admin'
import { Card } from '../../components/ui/Card'
import { Badge } from '../../components/ui/Badge'
import { TeacherEarningsSkeleton, TeacherTableSkeleton } from '../../components/ui/Skeleton'

export function TeacherEarningsPage() {
  const { user } = useApp()
  const { data: payouts, loading, refetch } = useAsyncData(
    () => (user ? fetchTeacherPayouts(user.id) : Promise.resolve([])),
    [user?.id],
  )

  useLiveDataRefresh(refetch, ['payouts', 'bookings'], Boolean(user?.id))

  const history = payouts ?? []
  const thisMonth = history[0]

  if (loading && history.length === 0) {
    return <TeacherEarningsSkeleton />
  }

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-medium mb-8">Earnings</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <IndianRupee size={16} className="text-teal" />
            <span className="text-xs">Latest Period</span>
          </div>
          <p className="font-heading text-2xl font-medium">
            {thisMonth ? `₹${thisMonth.amount.toLocaleString('en-IN')}` : '₹0'}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <TrendingUp size={16} className="text-teal" />
            <span className="text-xs">Total Records</span>
          </div>
          <p className="font-heading text-2xl font-medium">{history.length}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-2 text-charcoal/50">
            <Calendar size={16} className="text-teal" />
            <span className="text-xs">Latest Period</span>
          </div>
          <p className="font-heading text-2xl font-medium">{thisMonth?.period ?? '—'}</p>
        </Card>
      </div>

      <h2 className="font-heading text-lg font-medium mb-4">Payment History</h2>
      {loading ? (
        <TeacherTableSkeleton rows={4} />
      ) : history.length === 0 ? (
        <p className="text-charcoal/50">No payout records yet.</p>
      ) : (
        <div className="border border-border rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-cream-dark border-b border-border">
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Period</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Amount</th>
                <th className="text-left px-4 py-3 font-medium text-charcoal/70">Status</th>
              </tr>
            </thead>
            <tbody>
              {history.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{row.period}</td>
                  <td className="px-4 py-3 font-medium">₹{row.amount.toLocaleString('en-IN')}</td>
                  <td className="px-4 py-3">
                    <Badge variant={row.status === 'Paid' ? 'verified' : 'teal'}>{row.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
