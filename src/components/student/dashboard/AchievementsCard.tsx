import { Award, Medal } from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import { EmptyState } from '../../shell/EmptyState'

export function AchievementsCard() {
  return (
    <DashboardCard title="Achievements">
      <EmptyState
        icon={<Medal size={24} />}
        title="No medals yet"
        description="Compete, practice consistently, and complete milestones to earn certificates and badges."
        className="py-8"
      />
      <div className="mt-2 flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Award size={14} aria-hidden />
        Certificates and rankings arrive with the competition module
      </div>
    </DashboardCard>
  )
}
