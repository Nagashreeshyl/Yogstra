import { Outlet } from 'react-router-dom'
import { TeacherSidebar } from './TeacherSidebar'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function TeacherDashboardLayout() {
  return (
    <div className="flex h-full bg-cream">
      <TeacherSidebar />
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
      <RoleSelectionModal />
    </div>
  )
}
