import { Outlet } from 'react-router-dom'
import { IncomingCallProvider } from '../classes/IncomingCallProvider'
import { StudentSidebar } from './StudentSidebar'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function StudentDashboardLayout() {
  return (
    <IncomingCallProvider>
      <div className="flex h-full bg-cream">
        <StudentSidebar />
        <main className="flex-1 overflow-y-auto bg-surface min-h-full">
          <Outlet />
        </main>
        <RoleSelectionModal />
      </div>
    </IncomingCallProvider>
  )
}
