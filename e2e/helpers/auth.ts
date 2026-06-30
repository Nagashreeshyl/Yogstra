import type { Page } from '@playwright/test'

export type TestCredentials = {
  email: string
  password: string
}

export function getCredentials(role: 'student' | 'teacher' | 'admin'): TestCredentials | null {
  const prefix = `QA_${role.toUpperCase()}`
  const email = process.env[`${prefix}_EMAIL`]
  const password = process.env[`${prefix}_PASSWORD`]
  if (!email || !password) return null
  return { email, password }
}

export function hasCredentials(role: 'student' | 'teacher' | 'admin') {
  return getCredentials(role) !== null
}

export async function login(page: Page, creds: TestCredentials) {
  await page.goto('/auth/login')
  await page.locator('#email').fill(creds.email)
  await page.locator('#password').fill(creds.password)
  await page.getByRole('button', { name: /^login$/i }).click()
  await page.waitForURL(/dashboard|admin|auth\/teacher\/pending/, { timeout: 30_000 })
}

export async function logout(page: Page) {
  const menuButton = page.locator('[aria-label="User menu"], [data-testid="user-menu"]').first()
  if (await menuButton.isVisible().catch(() => false)) {
    await menuButton.click()
    await page.getByRole('menuitem', { name: /log out|sign out/i }).click()
    await page.waitForURL(/auth\/login|^\/$/, { timeout: 15_000 })
    return
  }

  await page.evaluate(() => {
    localStorage.clear()
    sessionStorage.clear()
  })
  await page.goto('/auth/login')
}
