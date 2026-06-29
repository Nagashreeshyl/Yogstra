import { Link } from 'react-router-dom'
import { MessageCircle } from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import { Avatar } from '../../ui/Avatar'
import { QuickActionButton } from '../../shell/QuickActionButton'
import { EmptyState } from '../../shell/EmptyState'
import { formatRelativeDate } from '../../../utils/format'
import type { StudentDashboardCoachFeedback } from '../../../services/studentDashboard'

interface CoachFeedbackCardProps {
  feedback: StudentDashboardCoachFeedback | null
}

export function CoachFeedbackCard({ feedback }: CoachFeedbackCardProps) {
  if (!feedback) {
    return (
      <DashboardCard title="Coach feedback">
        <EmptyState
          icon={<MessageCircle size={24} />}
          title="No feedback yet"
          description="Messages from your coach will appear here after your first session."
          action={
            <Link to="/dashboard/student/messages">
              <QuickActionButton showIcon={false}>Message coach</QuickActionButton>
            </Link>
          }
          className="py-8"
        />
      </DashboardCard>
    )
  }

  return (
    <DashboardCard title="Coach feedback">
      <div className="flex items-start gap-3">
        <Avatar name={feedback.coachName} size={40} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground">{feedback.coachName}</p>
            <time className="text-xs text-muted-foreground shrink-0">
              {formatRelativeDate(feedback.createdAt)}
            </time>
          </div>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground line-clamp-4">
            {feedback.message}
          </p>
        </div>
      </div>
      <div className="mt-5">
        <Link
          to="/dashboard/student/messages"
          state={{ openUserId: feedback.coachId }}
        >
          <QuickActionButton showIcon={false} className="w-full sm:w-auto">
            Reply to coach
          </QuickActionButton>
        </Link>
      </div>
    </DashboardCard>
  )
}
