import { useLocation } from 'react-router-dom'
import { isAppShellRoute } from '../../utils/appShellRoutes'
import { InstallAppPrompt } from './InstallAppPrompt'

/** Hide install banner where it overlaps forms or the app-shell bottom tab bar. */
export function RouteAwareInstallBanner() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/auth') || isAppShellRoute(pathname)) return null
  return <InstallAppPrompt variant="banner" />
}
