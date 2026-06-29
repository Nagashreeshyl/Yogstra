import { Link, Outlet } from 'react-router-dom'
import { AppShell, adminNavItems, PageContainer } from '../shell'

const adminFooter = (
  <Link
    to="/"
    className="block text-sidebar-muted hover:text-sidebar-foreground transition-colors"
  >
    Return to Yogstra
  </Link>
)

export function AdminLayout() {
  return (
    <AppShell
      variant="admin"
      title="Yogstra Admin"
      navItems={adminNavItems}
      footer={adminFooter}
    >
      <PageContainer width="wide">
        <Outlet />
      </PageContainer>
    </AppShell>
  )
}
