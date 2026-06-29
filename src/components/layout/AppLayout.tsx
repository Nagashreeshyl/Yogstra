import { Link, Outlet } from 'react-router-dom'
import { useMemo } from 'react'
import { AppShell, publicNavItems, publicStudentNavItem } from '../shell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'
import { PublicFooter } from './PublicFooter'
import { useApp } from '../../context/AppContext'

const legalFooter = (
  <>
    <Link to="/privacy-policy" className="block text-sidebar-muted hover:text-sidebar-foreground transition-colors">
      Privacy Policy
    </Link>
    <Link to="/terms-of-service" className="block text-sidebar-muted hover:text-sidebar-foreground transition-colors">
      Terms of Service
    </Link>
    <Link to="/refund-policy" className="block text-sidebar-muted hover:text-sidebar-foreground transition-colors">
      Refund Policy
    </Link>
  </>
)

export function AppLayout() {
  const { user } = useApp()

  const navItems = useMemo(() => {
    if (user?.role === 'student') {
      return [...publicNavItems, publicStudentNavItem]
    }
    return publicNavItems
  }, [user?.role])

  return (
    <>
      <AppShell variant="public" navItems={navItems} footer={legalFooter}>
        <div className="flex flex-col min-h-full">
          <Outlet />
          <PublicFooter />
        </div>
      </AppShell>
      <RoleSelectionModal />
    </>
  )
}
