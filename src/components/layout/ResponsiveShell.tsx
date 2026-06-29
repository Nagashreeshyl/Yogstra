import type { ReactNode } from 'react'
import { AppShell } from '../shell/AppShell'
import type { AppShellProps } from '../shell/types'

interface ResponsiveShellProps {
  sidebar: ReactNode
  children: ReactNode
  title?: string
  headerClassName?: string
  mainClassName?: string
}

/**
 * @deprecated Use AppShell from `components/shell` directly.
 * Thin compatibility wrapper — ignores legacy `sidebar` prop.
 */
export function ResponsiveShell({
  children,
  title,
  mainClassName,
}: ResponsiveShellProps) {
  const shellProps: AppShellProps = {
    variant: 'public',
    title: title ?? 'Yogstra',
    navItems: [],
    children,
    mainClassName,
  }
  return <AppShell {...shellProps} />
}
