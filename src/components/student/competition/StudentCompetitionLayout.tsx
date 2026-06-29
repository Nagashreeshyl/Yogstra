import { NavLink, Outlet } from 'react-router-dom'
import { Award, Home, List, Trophy } from 'lucide-react'

const tabs = [
  { to: '/dashboard/student/competitions', label: 'Discover', icon: Home, end: true },
  { to: '/dashboard/student/competitions/my', label: 'My events', icon: List, end: false },
  { to: '/dashboard/student/competitions/rankings', label: 'Rankings', icon: Trophy, end: false },
  { to: '/dashboard/student/competitions/certificates', label: 'Certificates', icon: Award, end: false },
]

export function StudentCompetitionLayout() {
  return (
    <div className="student-competition py-4 sm:py-6">
      <nav
        className="mb-6 flex gap-1 overflow-x-auto rounded-[12px] border border-border bg-muted/40 p-1"
        aria-label="Competition sections"
      >
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                isActive
                  ? 'bg-elevated text-primary shadow-sm'
                  : 'text-muted-foreground hover:bg-elevated/60 hover:text-foreground'
              }`
            }
          >
            <Icon className="h-4 w-4" aria-hidden />
            {label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  )
}
