import { Outlet, useLocation } from 'react-router-dom'
import { MessageSoundListener } from './MessageSoundListener'
import { TeacherClassTimeProvider } from '../classes/TeacherClassTimeProvider'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'
import { AppShell, teacherNavItems } from '../shell'

export function TeacherDashboardLayout() {
  const location = useLocation()

  const fullBleed =
    location.pathname.includes('/messages') ||
    location.pathname.includes('/classes/room/')

  return (
    <TeacherClassTimeProvider>
      <MessageSoundListener />
      <AppShell
        variant="teacher"
        navItems={teacherNavItems}
        fullBleed={fullBleed}
        mainClassName={fullBleed ? 'flex flex-col' : ''}
      >
        <Outlet />
      </AppShell>
      <RoleSelectionModal />
    </TeacherClassTimeProvider>
  )
}
