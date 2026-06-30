/** Routes that use AppShell with a fixed mobile bottom tab bar. */
export function isAppShellRoute(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/dashboard/')
}
