import { Link } from 'react-router-dom'
import {
  Calendar,
  MessageCircle,
  Trophy,
  Upload,
  Video,
} from 'lucide-react'
import { DashboardCard } from './DashboardCard'
import type { StudentDashboardCoach } from '../../../services/studentDashboard'

interface QuickActionsProps {
  coach: StudentDashboardCoach | null
  hasLiveClass: boolean
}

type QuickActionItem = {
  key: string
  label: string
  href: string
  icon: typeof Video
  disabled?: boolean
}

const actions: QuickActionItem[] = [
  {
    key: 'live',
    label: 'Join live class',
    href: '/dashboard/student/classes',
    icon: Video,
  },
  {
    key: 'upload',
    label: 'Upload practice',
    href: '/dashboard/student/competitions',
    icon: Upload,
  },
  {
    key: 'message',
    label: 'Message coach',
    href: '/dashboard/student/messages',
    icon: MessageCircle,
  },
  {
    key: 'schedule',
    label: 'View schedule',
    href: '/dashboard/student/classes',
    icon: Calendar,
  },
  {
    key: 'competition',
    label: 'Register competition',
    href: '/dashboard/student/competitions',
    icon: Trophy,
  },
] 

export function QuickActions({ coach, hasLiveClass }: QuickActionsProps) {
  return (
    <DashboardCard title="Quick actions" description="Common tasks, one tap away">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(({ key, label, href, icon: Icon, disabled }) => {
          const content = (
            <>
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                <Icon size={18} aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </>
          )

          if (disabled) {
            return (
              <div
                key={key}
                className="flex flex-col items-start gap-3 rounded-[12px] border border-border px-4 py-4 opacity-50 cursor-not-allowed"
                aria-disabled="true"
              >
                {content}
              </div>
            )
          }

          const linkHref =
            key === 'message' && coach
              ? '/dashboard/student/messages'
              : href

          const state = key === 'message' && coach ? { openUserId: coach.id } : undefined

          return (
            <Link
              key={key}
              to={linkHref}
              state={state}
              className={`flex flex-col items-start gap-3 rounded-[12px] border border-border px-4 py-4 hover:bg-muted/50 transition-colors ${
                key === 'live' && hasLiveClass ? 'ring-2 ring-primary/30' : ''
              }`}
            >
              {content}
            </Link>
          )
        })}
      </div>
    </DashboardCard>
  )
}
