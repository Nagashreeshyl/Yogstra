import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { ResponsiveShell } from './ResponsiveShell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function AppLayout() {
  return (
    <>
      <ResponsiveShell sidebar={<AppSidebar />} mainClassName="bg-cream">
        <Outlet />
      </ResponsiveShell>
      <RoleSelectionModal />
    </>
  )
}
