import { Link } from 'react-router-dom'
import { Menu } from 'lucide-react'
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
  onOpenMobileNav?: () => void
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
  onOpenMobileNav,
}: TopBarProps) {
  const autoBreadcrumbs = useBreadcrumbs()
  const breadcrumbs = breadcrumbsOverride ?? autoBreadcrumbs

  return (
    <header className="sticky top-0 z-40 shrink-0 border-b border-border bg-background/90 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      <div className="flex items-center gap-3 px-4 h-14 sm:px-6 lg:px-8">
        <div className="lg:hidden min-w-0 flex-1 flex items-center gap-2">
          {onOpenMobileNav && (
            <button
              type="button"
              onClick={onOpenMobileNav}
              className="shrink-0 p-2 -ml-1 rounded-[12px] text-foreground hover:bg-muted cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30"
              aria-label="Open navigation menu"
            >
              <Menu size={22} strokeWidth={1.75} />
            </button>
          )}
          <Link to={homeLink} className="font-heading text-lg font-semibold text-foreground truncate block min-w-0">
            {title}
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

        <div className="flex items-center gap-1 sm:gap-2 ml-auto shrink-0">
          <InstallAppPrompt variant="header" />
          {showNotifications && variant !== 'public' && (
            <NotificationDropdown count={notificationCount} />
          )}
          {showRoleSwitcher && variant !== 'public' && <RoleSwitcher />}
          <UserMenu showAuthActions={variant === 'public'} />
        </div>
      </div>

      <div className="lg:hidden px-4 pb-3 sm:px-6">
        <Breadcrumb items={breadcrumbs} />
      </div>
    </header>
  )
}
