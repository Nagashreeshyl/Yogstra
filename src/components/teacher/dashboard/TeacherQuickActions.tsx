import { Link } from 'react-router-dom'
import {
  Megaphone,
  Trophy,
  Upload,
  UserPlus,
  Users,
  Video,
} from 'lucide-react'
import { DashboardCard } from '../../student/dashboard/DashboardCard'

const actions = [
  { key: 'live', label: 'Start live class', href: '/dashboard/teacher/classes', icon: Video },
  { key: 'batch', label: 'Create batch', href: '/dashboard/academy/batches', icon: Users },
  { key: 'student', label: 'Add student', href: '/dashboard/teacher/students', icon: UserPlus },
  { key: 'competition', label: 'Register competition', href: '/dashboard/teacher/students', icon: Trophy },
  { key: 'announce', label: 'Send announcement', href: '/dashboard/teacher/community', icon: Megaphone },
  { key: 'upload', label: 'Share resource', href: '/dashboard/teacher/community', icon: Upload },
]

export function TeacherQuickActions() {
  return (
    <DashboardCard title="Quick actions" description="Common tasks, one tap away">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {actions.map(({ key, label, href, icon: Icon }) => {
          return (
            <Link
              key={key}
              to={href}
              className="flex flex-col items-start gap-3 rounded-[12px] border border-border px-4 py-4 hover:bg-muted/50 transition-colors"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-primary/10 text-primary">
                <Icon size={18} aria-hidden />
              </span>
              <span className="text-sm font-medium text-foreground">{label}</span>
            </Link>
          )
        })}
      </div>
    </DashboardCard>
  )
}
