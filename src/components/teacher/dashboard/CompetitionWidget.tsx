import { Link } from 'react-router-dom'
import { Trophy } from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { QuickActionButton } from '../../shell/QuickActionButton'
import { EmptyState } from '../../shell/EmptyState'
import type { TeacherDashboardCompetition } from '../../../services/teacherDashboard'

interface CompetitionWidgetProps {
  competition: TeacherDashboardCompetition | null
}

export function CompetitionWidget({ competition }: CompetitionWidgetProps) {
  if (!competition) {
    return (
      <DashboardCard title="Competition preparation">
        <EmptyState
          icon={<Trophy size={24} />}
          title="No competitions yet"
          description="When competitions are announced, student registration progress will appear here."
          action={
            <Link to="/dashboard/teacher/students">
              <QuickActionButton showIcon={false}>View students</QuickActionButton>
            </Link>
          }
          className="py-8"
        />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Competition preparation" description={`${competition.daysUntil} days remaining`}>
      <div className="space-y-4">
        <h3 className="font-heading text-xl font-semibold text-foreground">{competition.name}</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-[12px] bg-muted/60 px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">Registered</p>
            <p className="mt-1 text-lg font-semibold">{competition.studentsRegistered}</p>
          </div>
          <div className="rounded-[12px] bg-muted/60 px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">Pending</p>
            <p className="mt-1 text-lg font-semibold">{competition.pendingRegistrations}</p>
          </div>
          <div className="rounded-[12px] bg-muted/60 px-3 py-3 text-center">
            <p className="text-xs text-muted-foreground">Docs missing</p>
            <p className="mt-1 text-lg font-semibold">{competition.missingDocuments}</p>
          </div>
        </div>
        <Link to="/dashboard/teacher/students">
          <QuickActionButton showIcon={false} className="w-full sm:w-auto">
            Manage competition
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
