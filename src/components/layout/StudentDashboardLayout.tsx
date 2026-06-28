import { Outlet } from 'react-router-dom'
import { IncomingCallProvider } from '../classes/IncomingCallProvider'
import { DirectVideoCallProvider } from '../chat/DirectVideoCallProvider'
import { MessageSoundListener } from './MessageSoundListener'
import { StudentSidebar } from './StudentSidebar'
import { ResponsiveShell } from './ResponsiveShell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function StudentDashboardLayout() {
  return (
    <IncomingCallProvider>
      <DirectVideoCallProvider>
        <MessageSoundListener />
        <ResponsiveShell sidebar={<StudentSidebar />}>
          <Outlet />
        </ResponsiveShell>
        <RoleSelectionModal />
      </DirectVideoCallProvider>
    </IncomingCallProvider>
  )
}
