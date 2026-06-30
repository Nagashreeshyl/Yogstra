import { test, expect } from '@playwright/test'
import { PUBLIC_ROUTES } from '../data/routes'
import { attachPageListeners, auditPage } from '../helpers/page-audit'
import { reportIssue } from '../helpers/qa-tracker'

test.describe('Performance audit', () => {
  for (const route of PUBLIC_ROUTES.slice(0, 6)) {
    test(`navigation timing — ${route.name}`, async ({ page }, testInfo) => {
      const listeners = await attachPageListeners(page)

      const start = Date.now()
      await page.goto(route.path, { waitUntil: 'networkidle' })
      const loadMs = Date.now() - start

      await auditPage(page, route.path, testInfo, listeners)

      const metrics = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
        return {
          domContentLoaded: nav?.domContentLoadedEventEnd ?? 0,
          loadEvent: nav?.loadEventEnd ?? 0,
          transferSize: nav?.transferSize ?? 0,
        }
      })

      if (loadMs > 8000) {
        reportIssue({
          title: `Slow networkidle on ${route.path}`,
          description: `Reached networkidle in ${loadMs}ms (threshold 8000ms).`,
          priority: 'Medium',
          category: 'performance',
          route: route.path,
          suggestedFix: 'Reduce blocking requests; lazy-load non-critical data.',
        })
      }

      const requests = listeners.networkFailures.length
      if (requests > 20) {
        reportIssue({
          title: `High network failure count on ${route.path}`,
          description: `${requests} failed network responses.`,
          priority: 'High',
          category: 'performance',
          route: route.path,
        })
      }

      expect(loadMs).toBeLessThan(20_000)
      expect(metrics.domContentLoaded).toBeGreaterThan(0)
    })
  }

  test('no duplicate identical API calls on landing', async ({ page }) => {
    const apiCalls: string[] = []
    page.on('request', (req) => {
      if (req.url().includes('supabase.co/rest')) {
        apiCalls.push(req.url().split('?')[0])
      }
    })

    await page.goto('/')
    await page.waitForTimeout(2000)

    const counts = new Map<string, number>()
    for (const url of apiCalls) {
      counts.set(url, (counts.get(url) ?? 0) + 1)
    }

    const duplicates = [...counts.entries()].filter(([, n]) => n > 3)
    for (const [url, count] of duplicates) {
      reportIssue({
        title: 'Duplicate Supabase queries on landing',
        description: `${url} called ${count} times.`,
        priority: 'Low',
        category: 'performance',
        route: '/',
        suggestedFix: 'Deduplicate queries or use shared cache.',
      })
    }
  })
})
