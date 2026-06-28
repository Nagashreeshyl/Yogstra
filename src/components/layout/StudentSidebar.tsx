import { NavLink } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { useMessageNotifications } from '../../hooks/useMessageNotifications'
import { useStudentCoachingAccess } from '../../hooks/useStudentCoachingAccess'
import { Avatar } from '../ui/Avatar'
import { InstallAppPrompt } from '../pwa/InstallAppPrompt'

const baseStudentNav = [
  { to: '/dashboard/student/explore', label: 'Explore', end: true },
  { to: '/dashboard/student/teachers', label: 'Find Teachers' },
  { to: '/dashboard/student/community', label: 'Community' },
  { to: '/dashboard/student/messages', label: 'Messages', notify: true },
  { to: '/dashboard/student/settings', label: 'Profile' },
]

export function StudentSidebar() {
  const { user, logout } = useApp()
  const { unreadTotal, incomingRequests } = useMessageNotifications(user?.id, 'student')
  const { hasAccess: hasClasses } = useStudentCoachingAccess(user?.id)

  const messageBadge = unreadTotal > 0 ? unreadTotal : incomingRequests

  const studentNav = hasClasses
    ? [
        ...baseStudentNav.slice(0, 3),
        { to: '/dashboard/student/classes', label: 'Classes', notify: false as const },
        ...baseStudentNav.slice(3),
      ]
    : baseStudentNav

  return (
    <aside className="w-56 shrink-0 bg-charcoal flex flex-col h-full">
      <div className="p-6 border-b border-charcoal/20">
        <NavLink to="/dashboard/student/explore" className="block">
          <h1 className="font-heading text-xl font-semibold text-cream">Yogstra</h1>
        </NavLink>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {studentNav.map(({ to, label, end, notify }) => (
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
            {notify && messageBadge > 0 && (
              <span
                className={`min-w-[18px] h-[18px] px-1 inline-flex items-center justify-center rounded-full text-[10px] font-bold text-cream ${
                  unreadTotal > 0 ? 'bg-teal' : 'bg-amber-500'
                }`}
              >
                {messageBadge > 99 ? '99+' : messageBadge}
              </span>
            )}
          </NavLink>
        ))}
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
