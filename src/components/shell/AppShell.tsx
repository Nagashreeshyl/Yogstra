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
  if (variant === 'student') return '/dashboard/student'
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
    <div className="flex min-h-screen flex-col bg-background lg:h-full lg:min-h-0 lg:flex-row">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[90] focus:rounded-[12px] focus:bg-elevated focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-primary/30"
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
          className={`flex flex-1 flex-col min-h-0 min-w-0 overflow-y-auto max-lg:pb-[calc(3.75rem+1.25rem+max(0.75rem,env(safe-area-inset-bottom)))] lg:pb-0 ${mainClassName}`}
        >
          {fullBleed ? (
            children
          ) : (
            <div className="flex flex-1 flex-col min-h-full">{children}</div>
          )}
        </main>

        <MobileNavigation navItems={navItems} badges={badges} />
      </div>
    </div>
  )
}
