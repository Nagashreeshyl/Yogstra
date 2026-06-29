import { Outlet } from 'react-router-dom'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'
import { AppShell, academyNavItems } from '../shell'
import { AcademyContextProvider } from '../../hooks/useAcademyContext'
import { AcademyPageBoundary } from './AcademyPageBoundary'

export function AcademyRouteLayout() {
  return (
    <AcademyContextProvider>
      <AppShell variant="teacher" title="Academy" navItems={academyNavItems}>
        <AcademyPageBoundary>
          <Outlet />
        </AcademyPageBoundary>
      </AppShell>
      <RoleSelectionModal />
    </AcademyContextProvider>
  )
}
