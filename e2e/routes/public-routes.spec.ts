import { test, expect } from '@playwright/test'
import { PUBLIC_ROUTES } from '../data/routes'
import { attachPageListeners, auditPage } from '../helpers/page-audit'

test.describe('Public route crawl', () => {
  for (const route of PUBLIC_ROUTES) {
    test(`loads ${route.name} (${route.path})`, async ({ page }, testInfo) => {
      const listeners = await attachPageListeners(page)
      const result = await auditPage(page, route.path, testInfo, listeners)

      expect(result.isBlank, `Page ${route.path} appears blank`).toBe(false)
      expect(result.loadMs, `Page ${route.path} load time`).toBeLessThan(15_000)
    })
  }
})

test.describe('Public navigation', () => {
  test('landing page has working nav links', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/', testInfo, listeners)

    const navLinks = page.locator('header a[href], nav a[href]')
    const count = await navLinks.count()
    expect(count).toBeGreaterThan(3)

    for (let i = 0; i < Math.min(count, 6); i++) {
      const href = await navLinks.nth(i).getAttribute('href')
      if (!href || href.startsWith('http') || href === '#') continue
      const response = await page.goto(href)
      expect(response?.status() ?? 200).toBeLessThan(400)
    }
  })
})

test.describe('404 handling', () => {
  test('unknown route shows app shell or redirect', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await page.goto('/this-route-does-not-exist-xyz')
    await page.waitForTimeout(500)
    await auditPage(page, '/this-route-does-not-exist-xyz', testInfo, listeners)

    const body = await page.locator('body').innerText()
    expect(body.length).toBeGreaterThan(10)
  })
})
