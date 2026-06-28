import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { ResponsiveShell } from './ResponsiveShell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'
import { PublicFooter } from './PublicFooter'

export function AppLayout() {
  return (
    <>
      <ResponsiveShell sidebar={<AppSidebar />} mainClassName="bg-cream">
        <div className="flex flex-col min-h-full">
          <Outlet />
          <PublicFooter />
        </div>
      </ResponsiveShell>
      <RoleSelectionModal />
    </>
  )
}
