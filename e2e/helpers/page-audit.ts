import type { Page, TestInfo } from '@playwright/test'
import path from 'node:path'
import { reportIssue } from './qa-tracker'

export type PageAuditResult = {
  route: string
  ok: boolean
  consoleErrors: string[]
  networkFailures: string[]
  brokenImages: number
  hasMain: boolean
  isBlank: boolean
  loadMs: number
}

export async function attachPageListeners(page: Page) {
  const consoleErrors: string[] = []
  const networkFailures: string[] = []

  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text())
    }
  })

  page.on('pageerror', (err) => {
    consoleErrors.push(`Uncaught: ${err.message}`)
  })

  page.on('response', (response) => {
    const status = response.status()
    const url = response.url()
    if (status >= 400 && !url.includes('favicon')) {
      networkFailures.push(`${status} ${url}`)
    }
  })

  return { consoleErrors, networkFailures }
}

export async function screenshotStep(
  page: Page,
  testInfo: TestInfo,
  label: string,
  route: string,
) {
  const safe = label.replace(/[^a-z0-9-_]/gi, '-').toLowerCase()
  const file = path.join('screenshots', route.replace(/\//g, '_') || 'root', `${safe}.png`)
  await page.screenshot({ path: path.join(testInfo.outputDir, '..', '..', file), fullPage: true })
  await testInfo.attach(`${label} — ${route}`, {
    path: path.join(testInfo.outputDir, '..', '..', file),
    contentType: 'image/png',
  })
  return file
}

export async function auditPage(
  page: Page,
  route: string,
  testInfo: TestInfo,
  listeners: { consoleErrors: string[]; networkFailures: string[] },
): Promise<PageAuditResult> {
  const start = Date.now()
  const response = await page.goto(route, { waitUntil: 'domcontentloaded' })
  await page.waitForTimeout(800)

  const loadMs = Date.now() - start
  const status = response?.status() ?? 0

  await screenshotStep(page, testInfo, 'page-load', route)

  const bodyText = (await page.locator('body').innerText()).trim()
  const isBlank = bodyText.length < 20
  const hasMain = (await page.locator('main, #main-content, [role="main"]').count()) > 0

  const brokenImages = await page.evaluate(() => {
    return Array.from(document.images).filter((img) => img.complete && img.naturalWidth === 0).length
  })

  const criticalConsole = listeners.consoleErrors.filter(
    (e) =>
      !e.includes('Failed to load resource') &&
      !e.includes('net::ERR') &&
      !e.includes('404') &&
      !e.includes('Supabase') &&
      !e.includes('LiveKit'),
  )

  if (status >= 500) {
    reportIssue({
      title: `HTTP ${status} on ${route}`,
      description: `Server error when loading ${route}`,
      priority: 'Critical',
      category: 'bug',
      route,
      networkFailures: listeners.networkFailures,
      suggestedFix: 'Check server logs and route configuration.',
    })
  }

  if (isBlank) {
    reportIssue({
      title: `Blank page at ${route}`,
      description: 'Page body has fewer than 20 characters of visible text.',
      priority: 'High',
      category: 'bug',
      route,
      consoleErrors: criticalConsole,
      suggestedFix: 'Verify route component renders and data fetching completes.',
    })
  }

  if (brokenImages > 0) {
    reportIssue({
      title: `${brokenImages} broken image(s) on ${route}`,
      description: `Found ${brokenImages} images with zero natural width.`,
      priority: 'Medium',
      category: 'ui',
      route,
      suggestedFix: 'Check image URLs and storage bucket permissions.',
    })
  }

  if (criticalConsole.length > 0) {
    reportIssue({
      title: `Console errors on ${route}`,
      description: criticalConsole.slice(0, 5).join('\n'),
      priority: criticalConsole.some((e) => e.includes('Uncaught')) ? 'High' : 'Medium',
      category: 'bug',
      route,
      consoleErrors: criticalConsole,
    })
  }

  const supabaseFailures = listeners.networkFailures.filter(
    (f) => f.includes('supabase.co') && !f.startsWith('406'),
  )
  if (supabaseFailures.length > 0) {
    reportIssue({
      title: `Supabase API failures on ${route}`,
      description: supabaseFailures.slice(0, 5).join('\n'),
      priority: 'High',
      category: 'bug',
      route,
      networkFailures: supabaseFailures,
      suggestedFix: 'Check RLS policies, auth session, and migration state.',
    })
  }

  if (loadMs > 5000) {
    reportIssue({
      title: `Slow page load on ${route}`,
      description: `Page took ${loadMs}ms to reach domcontentloaded.`,
      priority: 'Medium',
      category: 'performance',
      route,
      suggestedFix: 'Profile bundle size, lazy routes, and Supabase query count.',
    })
  }

  return {
    route,
    ok: status < 400 && !isBlank,
    consoleErrors: listeners.consoleErrors,
    networkFailures: listeners.networkFailures,
    brokenImages,
    hasMain,
    isBlank,
    loadMs,
  }
}
