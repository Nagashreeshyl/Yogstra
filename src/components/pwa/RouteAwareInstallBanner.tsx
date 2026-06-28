import { useLocation } from 'react-router-dom'
import { InstallAppPrompt } from './InstallAppPrompt'

/** Hide install banner on auth flows where it overlaps forms on mobile. */
export function RouteAwareInstallBanner() {
  const { pathname } = useLocation()
  if (pathname.startsWith('/auth')) return null
  return <InstallAppPrompt variant="banner" />
}
