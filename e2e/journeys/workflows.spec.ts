import { test, expect } from '@playwright/test'
import {
  STUDENT_ROUTES,
  TEACHER_ROUTES,
  ADMIN_ROUTES,
  ACADEMY_ROUTES,
  COMPETITION_ROUTES,
} from '../data/routes'
import { attachPageListeners, auditPage, screenshotStep } from '../helpers/page-audit'
import { getCredentials, hasCredentials, login } from '../helpers/auth'
import { reportIssue } from '../helpers/qa-tracker'

const PROTECTED = [
  ...STUDENT_ROUTES,
  ...TEACHER_ROUTES,
  ...ADMIN_ROUTES,
  ...ACADEMY_ROUTES,
  ...COMPETITION_ROUTES,
]

test.describe('Unauthenticated access guards', () => {
  for (const route of PROTECTED) {
    test(`redirects unauthenticated user from ${route.path}`, async ({ page }) => {
      await page.goto(route.path)
      await page.waitForTimeout(1000)
      const url = page.url()
      const redirected =
        url.includes('/auth/login') ||
        url.includes('/auth/student') ||
        url.includes('/get-started') ||
        url === `${process.env.QA_BASE_URL ?? 'http://localhost:5173'}/`
      if (!redirected) {
        reportIssue({
          title: `Unprotected route: ${route.path}`,
          description: `Unauthenticated user reached ${url} without redirect.`,
          priority: 'Critical',
          category: 'security',
          route: route.path,
          suggestedFix: 'Add RequireRole or auth guard to this route.',
        })
      }
      expect(redirected).toBeTruthy()
    })
  }
})

test.describe('Student journey', () => {
  test.beforeEach(({ page: _page }) => {
    test.skip(!hasCredentials('student'), 'Set QA_STUDENT_EMAIL and QA_STUDENT_PASSWORD')
  })

  test('login → dashboard → browse teachers → profile → settings', async ({ page }, testInfo) => {
    const creds = getCredentials('student')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    await screenshotStep(page, testInfo, 'student-login', '/dashboard/student')

    await auditPage(page, '/dashboard/student', testInfo, listeners)

    await page.goto('/dashboard/student/teachers')
    await page.waitForTimeout(1000)
    await screenshotStep(page, testInfo, 'student-teachers', '/dashboard/student/teachers')

    const teacherLink = page.locator('a[href*="/teachers/"]').first()
    if (await teacherLink.isVisible().catch(() => false)) {
      await teacherLink.click()
      await page.waitForTimeout(1000)
      await screenshotStep(page, testInfo, 'teacher-profile', page.url())
    }

    await page.goto('/dashboard/student/competitions')
    await page.waitForTimeout(1000)
    await screenshotStep(page, testInfo, 'student-competitions', '/dashboard/student/competitions')

    await page.goto('/dashboard/student/settings')
    await page.waitForTimeout(500)
    await screenshotStep(page, testInfo, 'student-settings', '/dashboard/student/settings')

    await page.goto('/dashboard/student/messages')
    await page.waitForTimeout(1000)
    await screenshotStep(page, testInfo, 'student-messages', '/dashboard/student/messages')

    for (const route of STUDENT_ROUTES.slice(0, 8)) {
      await auditPage(page, route.path, testInfo, listeners)
    }
  })

  test('logout and re-login preserves session flow', async ({ page }, testInfo) => {
    const creds = getCredentials('student')!
    await login(page, creds)
    await page.goto('/dashboard/student')
    await expect(page).toHaveURL(/dashboard\/student/)

    await page.goto('/auth/login')
    await login(page, creds)
    await expect(page).toHaveURL(/dashboard/)
    await screenshotStep(page, testInfo, 'student-relogin', page.url())
  })
})

test.describe('Teacher journey', () => {
  test.beforeEach(() => {
    test.skip(!hasCredentials('teacher'), 'Set QA_TEACHER_EMAIL and QA_TEACHER_PASSWORD')
  })

  test('login → dashboard → students → schedule → earnings', async ({ page }, testInfo) => {
    const creds = getCredentials('teacher')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    if (page.url().includes('pending')) {
      reportIssue({
        title: 'Teacher account pending approval',
        description: 'QA teacher cannot access dashboard — pending verification.',
        priority: 'Medium',
        category: 'workflow',
        route: '/auth/teacher/pending',
        suggestedFix: 'Approve teacher in admin console before QA run.',
      })
      test.skip()
      return
    }

    await auditPage(page, '/dashboard/teacher', testInfo, listeners)
    await screenshotStep(page, testInfo, 'teacher-dashboard', '/dashboard/teacher')

    for (const route of TEACHER_ROUTES) {
      await auditPage(page, route.path, testInfo, listeners)
    }
  })
})

test.describe('Admin journey', () => {
  test.beforeEach(() => {
    test.skip(!hasCredentials('admin'), 'Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD')
  })

  test('login → admin console pages', async ({ page }, testInfo) => {
    const creds = getCredentials('admin')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    await page.waitForURL(/admin|dashboard/, { timeout: 30_000 })

    if (!page.url().includes('/admin')) {
      reportIssue({
        title: 'Admin credentials did not reach /admin',
        description: `Landed on ${page.url()} — verify admin role on profile.`,
        priority: 'High',
        category: 'workflow',
        suggestedFix: 'Set profiles.role=admin for QA admin account.',
      })
      return
    }

    for (const route of ADMIN_ROUTES) {
      await auditPage(page, route.path, testInfo, listeners)
      await screenshotStep(page, testInfo, `admin-${route.name}`, route.path)
    }
  })
})

test.describe('Academy journey', () => {
  test('academy dashboard accessible when logged in as teacher', async ({ page }, testInfo) => {
    test.skip(!hasCredentials('teacher'), 'Set QA_TEACHER_EMAIL and QA_TEACHER_PASSWORD')
    const creds = getCredentials('teacher')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    await auditPage(page, '/dashboard/academy', testInfo, listeners)
    await screenshotStep(page, testInfo, 'academy-dashboard', '/dashboard/academy')
  })
})

test.describe('Competition journey', () => {
  test('competition workspace pages', async ({ page }, testInfo) => {
    test.skip(!hasCredentials('teacher'), 'Set QA_TEACHER_EMAIL and QA_TEACHER_PASSWORD')
    const creds = getCredentials('teacher')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    for (const route of COMPETITION_ROUTES) {
      await auditPage(page, route.path, testInfo, listeners)
    }
  })
})
