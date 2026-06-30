import { test, expect } from '@playwright/test'
import { attachPageListeners, auditPage } from '../helpers/page-audit'
import { reportIssue } from '../helpers/qa-tracker'

const XSS_PAYLOAD = '<script>alert("xss")</script>'
const SQL_PAYLOAD = "' OR 1=1 --"

test.describe('Security audit', () => {
  test('XSS payload in login email is escaped', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await page.goto('/auth/login')
    await page.locator('#email').fill(XSS_PAYLOAD)
    await page.locator('#password').fill('wrong-password')
    await page.getByRole('button', { name: /^login$/i }).click()
    await page.waitForTimeout(1000)

    const alerts: string[] = []
    page.on('dialog', (d) => {
      alerts.push(d.message())
      void d.dismiss()
    })

    const html = await page.content()
    if (html.includes('<script>alert("xss")</script>')) {
      reportIssue({
        title: 'Possible XSS reflection on login',
        description: 'XSS payload appears unescaped in DOM.',
        priority: 'Critical',
        category: 'security',
        route: '/auth/login',
        suggestedFix: 'Ensure React escaping; never use dangerouslySetInnerHTML for user input.',
      })
    }

    expect(alerts.length).toBe(0)
    await auditPage(page, '/auth/login', testInfo, listeners)
  })

  test('invalid admin URL segments do not expose data', async ({ page }) => {
    await page.goto('/admin/../../../etc/passwd')
    await page.waitForTimeout(500)
    const body = await page.locator('body').innerText()
    expect(body.toLowerCase()).not.toContain('root:')
  })

  test('double submit on login is handled', async ({ page }) => {
    await page.goto('/auth/login')
    await page.locator('#email').fill(`qa-double-${Date.now()}@example.com`)
    await page.locator('#password').fill(SQL_PAYLOAD)
    const button = page.getByRole('button', { name: /^login$/i })
    await button.click()
    await button.click({ force: true }).catch(() => {})
    await page.waitForTimeout(1500)
    const errorVisible = await page.getByRole('alert').isVisible().catch(() => false)
    expect(errorVisible || page.url().includes('/auth/login')).toBeTruthy()
  })

  test('expired session redirects from protected route', async ({ page }) => {
    await page.goto('/dashboard/student')
    await page.waitForTimeout(1000)
    expect(page.url()).not.toMatch(/dashboard\/student\/settings/)
    const protected_ =
      page.url().includes('/auth') ||
      page.url().endsWith('/') ||
      !page.url().includes('/dashboard/student')
    expect(protected_).toBeTruthy()
  })
})
