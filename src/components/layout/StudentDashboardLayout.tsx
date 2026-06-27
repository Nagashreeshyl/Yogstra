import { Outlet } from 'react-router-dom'
import { IncomingCallProvider } from '../classes/IncomingCallProvider'
import { MessageSoundListener } from './MessageSoundListener'
import { StudentSidebar } from './StudentSidebar'
import { ResponsiveShell } from './ResponsiveShell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function StudentDashboardLayout() {
  return (
    <IncomingCallProvider>
      <MessageSoundListener />
      <ResponsiveShell sidebar={<StudentSidebar />}>
        <Outlet />
      </ResponsiveShell>
      <RoleSelectionModal />
    </IncomingCallProvider>
  )
}
