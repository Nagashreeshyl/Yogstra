import { Link, Outlet } from 'react-router-dom'
import { AppShell, competitionNavItems, PageContainer } from '../shell'

const competitionFooter = (
  <Link
    to="/"
    className="block text-sidebar-muted hover:text-sidebar-foreground transition-colors"
  >
    Return to Yogstra
  </Link>
)

export function CompetitionRouteLayout() {
  return (
    <AppShell
      variant="teacher"
      title="Competitions"
      navItems={competitionNavItems}
      footer={competitionFooter}
    >
      <PageContainer width="wide">
        <Outlet />
      </PageContainer>
    </AppShell>
  )
}
