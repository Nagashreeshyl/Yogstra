import { Outlet } from 'react-router-dom'
import { PublicWebsiteLayout } from '../public/PublicWebsiteLayout'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function AppLayout() {
  return (
    <>
      <PublicWebsiteLayout>
        <Outlet />
      </PublicWebsiteLayout>
      <RoleSelectionModal />
    </>
  )
}
