import {
  Award,
  CalendarPlus,
  Megaphone,
  Plus,
  Scale,
  Send,
  Trophy,
  Users,
} from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'
import { Button } from '../../ui/Button'

interface OrganizerQuickActionsProps {
  onCreateCompetition: () => void
  onPublishSchedule: () => void
  onAssignJudges: () => void
  onGenerateCertificates: () => void
  onPublishResults: () => void
  onSendAnnouncement: () => void
  disabled?: boolean
}

export function OrganizerQuickActions({
  onCreateCompetition,
  onPublishSchedule,
  onAssignJudges,
  onGenerateCertificates,
  onPublishResults,
  onSendAnnouncement,
  disabled,
}: OrganizerQuickActionsProps) {
  const actions = [
    { label: 'Create competition', icon: Plus, onClick: onCreateCompetition },
    { label: 'Publish schedule', icon: CalendarPlus, onClick: onPublishSchedule },
    { label: 'Assign judges', icon: Scale, onClick: onAssignJudges },
    { label: 'Generate certificates', icon: Award, onClick: onGenerateCertificates },
    { label: 'Publish results', icon: Trophy, onClick: onPublishResults },
    { label: 'Send announcement', icon: Megaphone, onClick: onSendAnnouncement },
  ]

  return (
    <DashboardCard title="Quick actions" description="Common organizer workflows.">
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {actions.map(({ label, icon: Icon, onClick }) => (
          <Button
            key={label}
            variant="secondary"
            size="sm"
            disabled={disabled}
            onClick={onClick}
            className="justify-start gap-2 h-auto py-3 px-3"
          >
            <Icon size={16} aria-hidden />
            <span className="text-left text-xs sm:text-sm">{label}</span>
          </Button>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Users size={12} aria-hidden />
        Run your entire event without spreadsheets.
      </p>
      <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
        <Send size={12} aria-hidden />
        All actions sync to your selected competition.
      </p>
    </DashboardCard>
  )
}
