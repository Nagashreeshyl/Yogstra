import { Link } from 'react-router-dom'
import { IndianRupee } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { QuickActionButton } from '../../shell/QuickActionButton'
import type { TeacherDashboardRevenue } from '../../../services/teacherDashboard'

interface RevenueWidgetProps {
  revenue: TeacherDashboardRevenue
}

function formatCurrency(value: number) {
  return `₹${value.toLocaleString('en-IN')}`
}

export function RevenueWidget({ revenue }: RevenueWidgetProps) {
  return (
    <DashboardCard title="Revenue snapshot" description="This month">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Monthly earnings</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatCurrency(revenue.monthlyEarnings)}
          </p>
        </div>
        <div className="rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Pending fees</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatCurrency(revenue.pendingFees)}
          </p>
        </div>
        <div className="rounded-[12px] bg-muted/60 px-4 py-3">
          <p className="text-xs text-muted-foreground">Pending payout</p>
          <p className="mt-1 text-xl font-semibold text-foreground">
            {formatCurrency(revenue.pendingPayout)}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <Link to="/dashboard/teacher/earnings">
          <QuickActionButton showIcon={false}>
            <span className="inline-flex items-center gap-2">
              <IndianRupee size={16} aria-hidden />
              View finance
            </span>
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
