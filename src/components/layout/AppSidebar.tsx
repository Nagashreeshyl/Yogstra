import { Link, NavLink } from 'react-router-dom'
import {
  Compass, Users, MessageSquare, Trophy, ShoppingBag, LogIn, UserPlus, LogOut, MessageCircle, LayoutDashboard,
} from 'lucide-react'
import { useApp } from '../../context/AppContext'
import { getDashboardPath, formatRoleLabel } from '../../utils/authRouting'
import { Avatar } from '../ui/Avatar'
import { InstallAppPrompt } from '../pwa/InstallAppPrompt'

const navItems = [
  { to: '/', label: 'Explore', icon: Compass },
  { to: '/teachers', label: 'Teachers', icon: Users },
  { to: '/community', label: 'Community Feed', icon: MessageSquare },
  { to: '/competitions', label: 'Competitions', icon: Trophy, badge: 'v2' },
  { to: '/shop', label: 'Shop', icon: ShoppingBag, badge: 'v2' },
]

const studentOnlyNav = [
  { to: '/dashboard/student/messages', label: 'Messages', icon: MessageCircle },
]

export function AppSidebar() {
  const { isLoggedIn, user, logout, setShowRoleModal, authLoading } = useApp()

  const handleAuth = () => setShowRoleModal(true)
  const homeLink = user ? getDashboardPath(user) : '/'

  return (
    <aside className="w-56 shrink-0 bg-charcoal flex flex-col h-full">
      <div className="p-6 border-b border-cream/10">
        <Link to={homeLink} className="block">
          <h1 className="font-heading text-xl font-semibold text-cream tracking-tight">
            Yogstra
          </h1>
        </Link>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors ${
                isActive
                  ? 'bg-teal/20 text-cream font-medium'
                  : 'text-cream/60 hover:text-cream hover:bg-charcoal/50'
              }`
            }
          >
            <Icon size={18} strokeWidth={1.5} />
            <span className="flex-1">{label}</span>
            {badge && (
              <span className="text-[10px] px-1.5 py-0.5 border border-cream/20 rounded-sm text-cream/50">
                v2
              </span>
            )}
          </NavLink>
        ))}
        {user?.role === 'student' && studentOnlyNav.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm transition-colors text-cream/60 hover:text-cream hover:bg-charcoal/50"
          >
            <Icon size={18} strokeWidth={1.5} />
            <span className="flex-1">{label}</span>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-cream/10 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {authLoading ? (
          <p className="text-xs text-cream/40 px-2">Loading...</p>
        ) : isLoggedIn && user ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 px-2">
              <Avatar src={user.avatar} name={user.name} size={36} />
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-cream">{user.name}</p>
                <p className="text-xs text-cream/50">{formatRoleLabel(user)}</p>
              </div>
            </div>
            {user.role !== 'student' && (
              <Link
                to={getDashboardPath(user)}
                className="flex items-center gap-2 w-full px-3 py-2 text-sm font-medium text-cream hover:bg-teal/20 rounded-sm transition-colors"
              >
                <LayoutDashboard size={16} />
                Go to Dashboard
              </Link>
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
        ) : (
          <div className="space-y-1">
            <InstallAppPrompt variant="sidebar" />
            <button
              onClick={handleAuth}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm text-cream/60 hover:text-cream hover:bg-charcoal/50 rounded-sm transition-colors cursor-pointer"
            >
              <LogIn size={16} />
              Login
            </button>
            <button
              onClick={handleAuth}
              className="flex items-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-cream hover:bg-teal/20 rounded-sm transition-colors cursor-pointer"
            >
              <UserPlus size={16} />
              Sign Up
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
