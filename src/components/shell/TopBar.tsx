import { Link } from 'react-router-dom'
import { Breadcrumb } from './Breadcrumb'
import { SearchBar } from './SearchBar'
import { NotificationDropdown } from './NotificationDropdown'
import { UserMenu } from './UserMenu'
import { RoleSwitcher } from './RoleSwitcher'
import { useBreadcrumbs } from './useBreadcrumbs'
import { InstallAppPrompt } from '../pwa/InstallAppPrompt'
import type { BreadcrumbItem, ShellVariant } from './types'

interface TopBarProps {
  variant: ShellVariant
  title: string
  homeLink: string
  breadcrumbs?: BreadcrumbItem[]
  showSearch?: boolean
  showNotifications?: boolean
  showRoleSwitcher?: boolean
  notificationCount?: number
}

export function TopBar({
  variant,
  title,
  homeLink,
  breadcrumbs: breadcrumbsOverride,
  showSearch = true,
  showNotifications = true,
  showRoleSwitcher = true,
  notificationCount = 0,
}: TopBarProps) {
  const autoBreadcrumbs = useBreadcrumbs()
  const breadcrumbs = breadcrumbsOverride ?? autoBreadcrumbs
  const mobileTitle =
    variant === 'admin' ? 'Admin' : variant === 'teacher' ? 'Teacher' : variant === 'student' ? 'Student' : title
  const showMobileBreadcrumbs = variant === 'public'

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top)] overflow-visible">
      <div className="flex items-center gap-2 px-4 h-14 sm:gap-3 sm:px-6 lg:px-8">
        <div className="lg:hidden min-w-0 flex-1">
          <Link
            to={homeLink}
            className="font-heading text-base sm:text-lg font-semibold text-foreground truncate block min-w-0"
          >
            <span className="sm:hidden">{mobileTitle}</span>
            <span className="hidden sm:inline">{title}</span>
          </Link>
        </div>

        <div className="hidden lg:block min-w-0 flex-1">
          <Breadcrumb items={breadcrumbs} />
        </div>

        {showSearch && (
          <div className="hidden md:block flex-1 max-w-md">
            <SearchBar />
          </div>
        )}

        <div className="flex items-center gap-0.5 sm:gap-2 ml-auto shrink-0">
          <InstallAppPrompt variant="header" />
          {showNotifications && variant !== 'public' && (
            <NotificationDropdown count={notificationCount} />
          )}
          {showRoleSwitcher && variant !== 'public' && <RoleSwitcher compactOnMobile />}
          <UserMenu showAuthActions={variant === 'public'} />
        </div>
      </div>

      {showMobileBreadcrumbs && (
        <div className="lg:hidden px-4 pb-3 sm:px-6">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}
    </header>
  )
}
