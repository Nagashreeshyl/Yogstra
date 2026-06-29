import { Outlet, useLocation } from 'react-router-dom'
import { IncomingCallProvider } from '../classes/IncomingCallProvider'
import { MessageSoundListener } from './MessageSoundListener'
import { RoleSelectionModal } from '../auth/RoleSelectionModal'
import { AppShell, getStudentNavItems } from '../shell'
import { useStudentCoachingAccess } from '../../hooks/useStudentCoachingAccess'
import { useApp } from '../../context/AppContext'

export function StudentDashboardLayout() {
  const { user } = useApp()
  const location = useLocation()
  const { hasAccess: hasClasses } = useStudentCoachingAccess(user?.id)
  const navItems = getStudentNavItems(hasClasses)

  const fullBleed =
    location.pathname.includes('/messages') ||
    location.pathname.includes('/classes/room/')

  return (
    <IncomingCallProvider>
      <MessageSoundListener />
      <AppShell
        variant="student"
        navItems={navItems}
        fullBleed={fullBleed}
        mainClassName={fullBleed ? 'flex flex-col' : ''}
      >
        <Outlet />
      </AppShell>
      <RoleSelectionModal />
    </IncomingCallProvider>
  )
}
