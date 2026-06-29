import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export type ShellVariant = 'public' | 'student' | 'teacher' | 'admin'

export type NavBadgeKey = 'messages' | 'notifications'

export type NavPlacement = 'sidebar' | 'tab' | 'more'

export interface ShellNavItem {
  to: string
  label: string
  icon: LucideIcon
  end?: boolean
  /** Static badge label (e.g. "Soon") */
  badge?: string
  /** Dynamic badge from useNavBadges */
  badgeKey?: NavBadgeKey
  placement: NavPlacement[]
}

export interface BreadcrumbItem {
  label: string
  to?: string
}

export interface AppShellProps {
  variant: ShellVariant
  title?: string
  navItems: ShellNavItem[]
  children: ReactNode
  /** Main content background override */
  mainClassName?: string
  /** Skip default page padding (e.g. full-bleed chat) */
  fullBleed?: boolean
  /** Optional footer below main content */
  footer?: ReactNode
}
