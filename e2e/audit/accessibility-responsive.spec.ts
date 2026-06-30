import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'
import { PUBLIC_ROUTES, VIEWPORTS } from '../data/routes'
import { attachPageListeners, auditPage, screenshotStep } from '../helpers/page-audit'
import { reportIssue } from '../helpers/qa-tracker'

test.describe('Accessibility audit', () => {
  for (const route of PUBLIC_ROUTES.slice(0, 8)) {
    test(`a11y scan — ${route.name}`, async ({ page }, testInfo) => {
      const listeners = await attachPageListeners(page)
      await auditPage(page, route.path, testInfo, listeners)

      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'best-practice'])
        .analyze()

      const serious = results.violations.filter((v) => v.impact === 'critical' || v.impact === 'serious')

      for (const violation of serious) {
        reportIssue({
          title: `A11y: ${violation.id} on ${route.path}`,
          description: violation.description,
          priority: violation.impact === 'critical' ? 'Critical' : 'High',
          category: 'accessibility',
          route: route.path,
          suggestedFix: violation.help,
        })
      }

      expect(serious.length, `Critical/serious a11y violations on ${route.path}`).toBeLessThan(10)
    })
  }

  test('skip link and keyboard focus on landing', async ({ page }) => {
    await page.goto('/')
    const skipLink = page.locator('a[href="#main-content"]')
    if (!(await skipLink.count())) {
      reportIssue({
        title: 'Missing skip navigation link',
        description: 'Landing page has no skip-to-content link.',
        priority: 'High',
        category: 'accessibility',
        route: '/',
        suggestedFix: 'Add skip link in AppShell targeting #main-content.',
      })
    }

    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })
})

test.describe('Responsive audit', () => {
  for (const viewport of VIEWPORTS) {
    test(`landing at ${viewport.name}`, async ({ page }, testInfo) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const listeners = await attachPageListeners(page)
      const result = await auditPage(page, '/', testInfo, listeners)
      await screenshotStep(page, testInfo, `responsive-${viewport.name}`, '/')

      const overflow = await page.evaluate(() => {
        return document.documentElement.scrollWidth > window.innerWidth + 2
      })

      if (overflow) {
        reportIssue({
          title: `Horizontal overflow on ${viewport.name}`,
          description: `Landing page overflows viewport ${viewport.width}x${viewport.height}.`,
          priority: 'Medium',
          category: 'responsive',
          route: '/',
          suggestedFix: 'Fix fixed-width elements or missing responsive breakpoints.',
        })
      }

      expect(result.isBlank).toBe(false)
    })
  }
})

test.describe('UI consistency audit', () => {
  test('buttons have visible labels on discover', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/discover', testInfo, listeners)

    const iconOnlyButtons = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('button')).filter((btn) => {
        const text = btn.textContent?.trim() ?? ''
        const aria = btn.getAttribute('aria-label')
        return text.length === 0 && !aria
      }).length
    })

    if (iconOnlyButtons > 5) {
      reportIssue({
        title: 'Multiple icon-only buttons without aria-label',
        description: `Found ${iconOnlyButtons} buttons without text or aria-label on /discover.`,
        priority: 'Medium',
        category: 'ui',
        route: '/discover',
        suggestedFix: 'Add aria-label to icon buttons.',
      })
    }
  })

  test('forms have associated labels on login', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/auth/login', testInfo, listeners)

    const unlabeled = await page.evaluate(() => {
      return Array.from(document.querySelectorAll('input:not([type="hidden"])')).filter((input) => {
        const id = input.getAttribute('id')
        if (!id) return true
        return !document.querySelector(`label[for="${id}"]`)
      }).length
    })

    if (unlabeled > 0) {
      reportIssue({
        title: 'Unlabeled form inputs on login',
        description: `${unlabeled} inputs missing associated labels.`,
        priority: 'Medium',
        category: 'ui',
        route: '/auth/login',
        suggestedFix: 'Use Label component with htmlFor matching input id.',
      })
    }
  })
})
