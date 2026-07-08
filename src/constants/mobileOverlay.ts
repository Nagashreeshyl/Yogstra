import { isAppShellRoute } from '../utils/appShellRoutes'

/** Bottom padding for mobile overlays above the app-shell tab bar (1rem + tab bar clearance). */
export const MOBILE_OVERLAY_BOTTOM_PADDING =
  'calc(1rem + var(--mobile-tab-bar-clearance))'

/** Full-screen overlay shell that clears the floating mobile tab bar on app-shell routes. */
export function appShellModalOverlayClasses(isOpen: boolean): string {
  const aboveTabBar =
    isOpen && typeof window !== 'undefined' && isAppShellRoute(window.location.pathname)

  return [
    'fixed inset-0 z-[100] flex p-4',
    'max-lg:items-end lg:items-center lg:justify-center',
    aboveTabBar
      ? `max-lg:pb-[${MOBILE_OVERLAY_BOTTOM_PADDING}]`
      : 'max-lg:pb-[max(1rem,env(safe-area-inset-bottom))]',
  ].join(' ')
}
