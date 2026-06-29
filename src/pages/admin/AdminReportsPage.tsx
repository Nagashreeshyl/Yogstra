import { useAsyncData } from '../../hooks/useAsyncData'
import { fetchAdminReportStats } from '../../services/admin'
import { StatCard } from '../../components/admin/AdminTable'
import { AdminDashboardSkeleton } from '../../components/ui/Skeleton'

export function AdminReportsPage() {
  const { data: stats, loading, error } = useAsyncData(() => fetchAdminReportStats())

  if (loading) return <AdminDashboardSkeleton />

  if (error || !stats) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <h1 className="font-heading text-3xl font-medium mb-8">Reports</h1>
        <p className="text-sm text-red-600 border border-red-200 bg-red-50 px-4 py-3 rounded-sm">
          Unable to load report data. Please refresh the page.
        </p>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <h1 className="font-heading text-3xl font-medium mb-2">Reports</h1>
      <p className="text-charcoal/60 mb-8">
        Platform aggregates from bookings, payouts, and competition registrations.
      </p>

      <section className="mb-10">
        <h2 className="font-heading text-lg font-medium mb-4">Bookings</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total bookings" value={stats.totalBookings} />
          <StatCard label="Active bookings" value={stats.activeBookings} />
          <StatCard
            label="Monthly revenue (active paid)"
            value={`₹${stats.monthlyRevenue.toLocaleString('en-IN')}`}
          />
        </div>
      </section>

      <section className="mb-10">
        <h2 className="font-heading text-lg font-medium mb-4">Payouts</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total payout records" value={stats.totalPayouts} />
          <StatCard label="Pending payouts" value={stats.pendingPayouts} />
          <StatCard
            label="Paid payout amount"
            value={`₹${stats.paidPayoutAmount.toLocaleString('en-IN')}`}
          />
        </div>
      </section>

      <section>
        <h2 className="font-heading text-lg font-medium mb-4">Competition registrations</h2>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard label="Total registrations" value={stats.totalRegistrations} />
          <StatCard label="Confirmed registrations" value={stats.confirmedRegistrations} />
          <StatCard
            label="Confirmation rate"
            value={
              stats.totalRegistrations > 0
                ? `${Math.round((stats.confirmedRegistrations / stats.totalRegistrations) * 100)}%`
                : '—'
            }
          />
        </div>
      </section>
    </div>
  )
}
