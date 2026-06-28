import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useMessageNotifications } from '../../hooks/useMessageNotifications'
import { useTeacherNotificationCount } from '../../hooks/useTeacherNotificationCount'
import { Avatar } from '../ui/Avatar'
import { InstallAppPrompt } from '../pwa/InstallAppPrompt'

const teacherNav = [
  { to: '/dashboard/teacher', label: 'Dashboard', end: true },
  { to: '/dashboard/teacher/students', label: 'My Students' },
  { to: '/dashboard/teacher/classes', label: 'Classes' },
  { to: '/dashboard/teacher/schedule', label: 'Schedule' },
  { to: '/dashboard/teacher/community', label: 'Community' },
  { to: '/dashboard/teacher/messages', label: 'Messages', notify: 'messages' as const },
  { to: '/dashboard/teacher/notifications', label: 'Notifications', notify: 'notifications' as const },
  { to: '/dashboard/teacher/coupons', label: 'Coupons' },
  { to: '/dashboard/teacher/earnings', label: 'Earnings' },
  { to: '/dashboard/teacher/settings', label: 'Profile Settings' },
]

export function TeacherSidebar() {
  const { user, logout } = useApp()
  const { unreadTotal, incomingRequests } = useMessageNotifications(user?.id, 'teacher')
  const { count: notificationCount } = useTeacherNotificationCount(user?.id)

  const messageBadge = unreadTotal > 0 ? unreadTotal : incomingRequests

  return (
    <aside className="w-56 shrink-0 bg-charcoal flex flex-col h-full">
      <div className="p-6 border-b border-charcoal/20">
        <NavLink to="/dashboard/teacher" className="block">
          <h1 className="font-heading text-xl font-semibold text-cream">Yogstra</h1>
        </NavLink>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
        {teacherNav.map(({ to, label, end, notify }) => {
          const badge =
            notify === 'messages'
              ? messageBadge
              : notify === 'notifications'
                ? notificationCount
                : 0

          return (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center justify-between px-3 py-2.5 text-sm rounded-sm transition-colors ${
                isActive
                  ? 'bg-teal/20 text-cream font-medium'
                  : 'text-cream/60 hover:text-cream hover:bg-charcoal/50'
              }`
            }
          >
            <span>{label}</span>
            {badge > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full bg-teal text-cream text-[10px] font-bold">
                {badge > 99 ? '99+' : badge}
              </span>
            )}
          </NavLink>
          )
        })}
      </nav>
      <div className="p-4 border-t border-charcoal/20 space-y-3 pb-[max(1rem,env(safe-area-inset-bottom))]">
        <InstallAppPrompt variant="sidebar" />
        {user && (
          <div className="flex items-center gap-3 px-2">
            <Avatar src={user.avatar} name={user.name} size={36} />
            <div className="min-w-0">
              <p className="text-sm font-medium truncate text-cream">{user.name}</p>
              <p className="text-xs text-cream/50 capitalize">{user.role}</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => logout()}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm text-cream/60 hover:text-cream hover:bg-charcoal/50 rounded-sm transition-colors cursor-pointer"
        >
          <LogOut size={16} />
          Logout
        </button>
      </div>
    </aside>
  )
}
