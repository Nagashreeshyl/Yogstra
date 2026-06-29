import { Link } from 'react-router-dom'
import { Play, Sparkles } from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import { QuickActionButton } from '../../shell/QuickActionButton'
import { EmptyState } from '../../shell/EmptyState'
import type { StudentDashboardPractice } from '../../../services/studentDashboard'

interface TodaysPracticeCardProps {
  practice: StudentDashboardPractice | null
}

export function TodaysPracticeCard({ practice }: TodaysPracticeCardProps) {
  if (!practice) {
    return (
      <DashboardCard title="Today's focus">
        <EmptyState
          icon={<Sparkles size={24} />}
          title="No practice assigned yet"
          description="Connect with a coach to receive personalized daily practice guidance."
          action={
            <Link to="/dashboard/student/teachers">
              <QuickActionButton showIcon={false}>Find a coach</QuickActionButton>
            </Link>
          }
          className="py-8"
        />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard
      title="Today's focus"
      description="Your coach's recommendation for today"
    >
      <div className="space-y-4">
        <div>
          <h3 className="font-heading text-xl font-semibold text-foreground">
            {practice.name}
          </h3>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span className="rounded-full bg-muted px-3 py-1">{practice.durationMinutes} min</span>
            <span className="rounded-full bg-muted px-3 py-1">{practice.difficulty}</span>
          </div>
        </div>
        <p className="text-sm leading-relaxed text-muted-foreground">{practice.coachNotes}</p>
        <Link to="/dashboard/student/classes" aria-label="Start practice">
          <QuickActionButton showIcon={false} className="w-full sm:w-auto">
            <span className="inline-flex items-center gap-2">
              <Play size={16} aria-hidden />
              Start practice
            </span>
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
