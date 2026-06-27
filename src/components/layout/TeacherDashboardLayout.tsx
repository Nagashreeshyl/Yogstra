import { Outlet } from 'react-router-dom'
import { MessageSoundListener } from './MessageSoundListener'
import { TeacherClassTimeProvider } from '../classes/TeacherClassTimeProvider'
import { TeacherSidebar } from './TeacherSidebar'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'

export function TeacherDashboardLayout() {
  return (
    <TeacherClassTimeProvider>
      <div className="flex h-full bg-cream">
        <MessageSoundListener />
        <TeacherSidebar />
        <main className="flex-1 overflow-y-auto bg-surface min-h-full">
          <Outlet />
        </main>
        <RoleSelectionModal />
      </div>
    </TeacherClassTimeProvider>
  )
}
