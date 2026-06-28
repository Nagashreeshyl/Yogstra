import { Outlet } from 'react-router-dom'
import { MessageSoundListener } from './MessageSoundListener'
import { TeacherClassTimeProvider } from '../classes/TeacherClassTimeProvider'
import { DirectVideoCallProvider } from '../chat/DirectVideoCallProvider'
import { TeacherSidebar } from './TeacherSidebar'
import { ResponsiveShell } from './ResponsiveShell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function TeacherDashboardLayout() {
  return (
    <TeacherClassTimeProvider>
      <DirectVideoCallProvider>
        <MessageSoundListener />
        <ResponsiveShell sidebar={<TeacherSidebar />}>
          <Outlet />
        </ResponsiveShell>
        <RoleSelectionModal />
      </DirectVideoCallProvider>
    </TeacherClassTimeProvider>
  )
}
