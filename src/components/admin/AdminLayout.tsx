import { NavLink, Outlet, Link } from 'react-router-dom'
import {
  LayoutDashboard, Users, GraduationCap, MessageSquare, Calendar,
  Clock, MessageCircle, IndianRupee, Grid3X3, Settings, LogOut, Home,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'

const adminNav = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/teachers', label: 'Teachers', icon: Users },
  { to: '/admin/students', label: 'Students', icon: GraduationCap },
  { to: '/admin/community', label: 'Community Posts', icon: MessageSquare },
  { to: '/admin/bookings', label: 'Bookings', icon: Calendar },
  { to: '/admin/schedules', label: 'Schedules', icon: Clock },
  { to: '/admin/chats', label: 'Chats', icon: MessageCircle },
  { to: '/admin/payouts', label: 'Payouts', icon: IndianRupee },
  { to: '/admin/categories', label: 'Categories', icon: Grid3X3 },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
]

export function AdminLayout() {
  const { user, logout } = useApp()

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className="flex h-full">
      <aside className="w-60 shrink-0 bg-charcoal flex flex-col h-full">
        <div className="p-6 border-b border-charcoal/20">
          <NavLink to="/admin" className="block">
            <h1 className="font-heading text-xl font-semibold text-cream">Yogstra Admin</h1>
          </NavLink>
        </div>
        <nav className="flex-1 py-4 px-3 space-y-0.5 overflow-y-auto">
          {adminNav.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                  isActive
                    ? 'bg-teal/20 text-cream font-medium'
                    : 'text-cream/60 hover:text-cream hover:bg-charcoal/50'
                }`
              }
            >
              <Icon size={18} strokeWidth={1.5} />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-charcoal/20 space-y-1">
          {user && (
            <p className="px-3 py-2 text-xs text-cream/50 truncate">{user.email}</p>
          )}
          <Link
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm text-cream/60 hover:text-cream hover:bg-charcoal/50 transition-colors"
          >
            <Home size={18} strokeWidth={1.5} />
            Return to Yogstra
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-3 w-full px-3 py-2.5 rounded-sm text-sm text-cream/60 hover:text-cream hover:bg-charcoal/50 transition-colors cursor-pointer"
          >
            <LogOut size={18} strokeWidth={1.5} />
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-cream">
        <Outlet />
      </main>
    </div>
  )
}
