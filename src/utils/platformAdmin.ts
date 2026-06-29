import type { AuthUser } from '../services/auth'

/** Only this account may access /admin and see Admin in the role switcher. */
export const PLATFORM_ADMIN_EMAIL = 'nagashreeshyl@gmail.com'

export function isPlatformAdmin(user: Pick<AuthUser, 'email'> | null | undefined): boolean {
  if (!user?.email) return false
  return user.email.trim().toLowerCase() === PLATFORM_ADMIN_EMAIL.toLowerCase()
}
