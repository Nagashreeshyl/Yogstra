import { Outlet } from 'react-router-dom'
import { MessageSoundListener } from './MessageSoundListener'
import { TeacherClassTimeProvider } from '../classes/TeacherClassTimeProvider'
import { TeacherSidebar } from './TeacherSidebar'
import { ResponsiveShell } from './ResponsiveShell'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function TeacherDashboardLayout() {
  return (
    <TeacherClassTimeProvider>
      <MessageSoundListener />
      <ResponsiveShell sidebar={<TeacherSidebar />}>
        <Outlet />
      </ResponsiveShell>
      <RoleSelectionModal />
    </TeacherClassTimeProvider>
  )
}
