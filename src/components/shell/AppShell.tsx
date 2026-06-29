import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileNavigation } from './MobileNavigation'
import { useNavBadges } from './useNavBadges'
import { useApp } from '../../context/AppContext'
import { getDashboardPath } from '../../utils/authRouting'
import type { AppShellProps } from './types'

function resolveHomeLink(variant: AppShellProps['variant'], isLoggedIn: boolean, user: ReturnType<typeof useApp>['user']) {
  if (variant === 'admin') return '/admin'
  if (variant === 'teacher') return '/dashboard/teacher'
  if (variant === 'student') return '/dashboard/student/explore'
  if (isLoggedIn && user) return getDashboardPath(user)
  return '/'
}

export function AppShell({
  variant,
  title = 'Yogstra',
  navItems,
  children,
  mainClassName = '',
  fullBleed = false,
  footer,
}: AppShellProps) {
  const { isLoggedIn, user } = useApp()
  const badges = useNavBadges(variant)
  const homeLink = resolveHomeLink(variant, isLoggedIn, user)
  const notificationCount = badges.notifications ?? 0

  return (
    <div className="flex h-full min-h-0 lg:flex-row flex-col bg-background">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[12px] focus:bg-background focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary"
      >
        Skip to main content
      </a>
      <div className="hidden lg:flex shrink-0 h-full min-h-0">
        <Sidebar
          variant={variant}
          title={title}
          homeLink={homeLink}
          navItems={navItems}
          badges={badges}
          footer={footer}
        />
      </div>

      <div className="flex flex-1 flex-col min-h-0 min-w-0">
        <TopBar
          variant={variant}
          title={title}
          homeLink={homeLink}
          showRoleSwitcher={isLoggedIn}
          notificationCount={notificationCount}
        />

        <main
          id="main-content"
          className={`flex-1 min-h-0 min-w-0 overflow-y-auto pb-16 lg:pb-0 ${mainClassName}`}
        >
          {fullBleed ? children : <div className="min-h-full">{children}</div>}
        </main>

        <MobileNavigation navItems={navItems} badges={badges} />
      </div>
    </div>
  )
}
