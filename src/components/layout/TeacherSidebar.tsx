import { NavLink } from 'react-router-dom'
import { useApp } from '../../context/AppContext'

const teacherNav = [
  { to: '/dashboard/teacher', label: 'Dashboard', end: true },
  { to: '/dashboard/teacher/students', label: 'My Students' },
  { to: '/dashboard/teacher/schedule', label: 'Schedule' },
  { to: '/community', label: 'Community' },
  { to: '/teacher/messages', label: 'Messages' },
  { to: '/dashboard/teacher/earnings', label: 'Earnings' },
  { to: '/dashboard/teacher/settings', label: 'Profile Settings' },
]

export function TeacherSidebar() {
  const { user } = useApp()

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : '—'

  return (
    <aside className="w-56 shrink-0 border-r border-border bg-cream flex flex-col h-full">
      <div className="p-6 border-b border-border">
        <NavLink to="/dashboard/teacher" className="block">
          <h1 className="font-heading text-2xl font-semibold text-charcoal">Yogstra</h1>
        </NavLink>
      </div>
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {teacherNav.map(({ to, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `block px-3 py-2.5 text-sm rounded-sm transition-colors ${
                isActive
                  ? 'bg-teal-soft text-charcoal font-medium'
                  : 'text-charcoal/70 hover:text-charcoal hover:bg-cream-dark'
              }`
            }
          >
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-border">
        {user && (
          <div className="flex items-center gap-3 px-2">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-full object-cover"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-teal-soft flex items-center justify-center text-xs font-medium">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-xs text-charcoal/50 capitalize">{user.role}</p>
            </div>
          </div>
        )}
      </div>
    </aside>
  )
}
