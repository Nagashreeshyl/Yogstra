import { Outlet } from 'react-router-dom'
import { AppSidebar } from './AppSidebar'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function AppLayout() {
  return (
    <div className="flex h-full bg-cream">
      <AppSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <RoleSelectionModal />
    </div>
  )
}
