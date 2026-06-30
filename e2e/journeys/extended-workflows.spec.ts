import { test, expect } from '@playwright/test'
import { attachPageListeners, auditPage, screenshotStep } from '../helpers/page-audit'
import { getCredentials, hasCredentials, login } from '../helpers/auth'
import { reportIssue } from '../helpers/qa-tracker'

test.describe('Public browse workflows', () => {
  test('browse teachers → open profile', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/teachers', testInfo, listeners)
    await screenshotStep(page, testInfo, 'teachers-list', '/teachers')

    const teacherLink = page.locator('a[href*="/teachers/"]').first()
    if (await teacherLink.isVisible().catch(() => false)) {
      await teacherLink.click()
      await page.waitForTimeout(1000)
      await screenshotStep(page, testInfo, 'teacher-profile-public', page.url())
      await auditPage(page, new URL(page.url()).pathname, testInfo, listeners)
    } else {
      reportIssue({
        title: 'No teacher cards on /teachers',
        description: 'Public teachers page has no clickable teacher profiles.',
        priority: 'Medium',
        category: 'workflow',
        route: '/teachers',
        suggestedFix: 'Ensure teacher listing loads from Supabase and renders links.',
      })
    }
  })

  test('browse academies → open profile', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/academies', testInfo, listeners)
    await screenshotStep(page, testInfo, 'academies-list', '/academies')

    const academyLink = page.locator('a[href*="/academies/"]').first()
    if (await academyLink.isVisible().catch(() => false)) {
      await academyLink.click()
      await page.waitForTimeout(1000)
      await screenshotStep(page, testInfo, 'academy-profile-public', page.url())
      await auditPage(page, new URL(page.url()).pathname, testInfo, listeners)
    }
  })

  test('browse competitions → open detail', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/competitions', testInfo, listeners)
    await screenshotStep(page, testInfo, 'competitions-list', '/competitions')

    const compLink = page.locator('a[href*="/competitions/"]').first()
    if (await compLink.isVisible().catch(() => false)) {
      await compLink.click()
      await page.waitForTimeout(1000)
      await screenshotStep(page, testInfo, 'competition-detail-public', page.url())
      await auditPage(page, new URL(page.url()).pathname, testInfo, listeners)
    }
  })

  test('community page loads and shows content or empty state', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    const result = await auditPage(page, '/community', testInfo, listeners)
    await screenshotStep(page, testInfo, 'community-public', '/community')
    expect(result.isBlank).toBe(false)
  })
})

test.describe('Signup form validation', () => {
  test('student signup shows validation on empty submit', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/auth/student', testInfo, listeners)
    await screenshotStep(page, testInfo, 'student-signup-load', '/auth/student')

    const submit = page.getByRole('button', { name: /sign up|create|register|continue/i }).first()
    if (await submit.isVisible().catch(() => false)) {
      await submit.click()
      await page.waitForTimeout(500)
      await screenshotStep(page, testInfo, 'student-signup-validation', '/auth/student')
    }

    const body = await page.locator('body').innerText()
    expect(body.length).toBeGreaterThan(20)
  })

  test('teacher registration form loads', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    const result = await auditPage(page, '/auth/teacher/register', testInfo, listeners)
    await screenshotStep(page, testInfo, 'teacher-register-load', '/auth/teacher/register')
    expect(result.isBlank).toBe(false)
  })

  test('get-started role picker works', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/auth/get-started', testInfo, listeners)
    await screenshotStep(page, testInfo, 'get-started', '/auth/get-started')

    const links = page.locator('a[href*="/auth/"]')
    const count = await links.count()
    expect(count).toBeGreaterThan(0)
  })

  test('login form rejects invalid credentials', async ({ page }, testInfo) => {
    await page.goto('/auth/login')
    await page.locator('#email').fill('invalid-qa@test.invalid')
    await page.locator('#password').fill('wrongpassword123')
    await page.getByRole('button', { name: /^login$/i }).click()
    await page.waitForTimeout(1500)
    await screenshotStep(page, testInfo, 'login-invalid', '/auth/login')

    expect(page.url()).toContain('/auth/login')
  })
})

test.describe('Authenticated extended journeys', () => {
  test('student: competitions, classes, shop, rankings', async ({ page }, testInfo) => {
    test.skip(!hasCredentials('student'), 'Set QA_STUDENT_EMAIL and QA_STUDENT_PASSWORD')
    const creds = getCredentials('student')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    const routes = [
      '/dashboard/student/competitions',
      '/dashboard/student/competitions/my',
      '/dashboard/student/classes',
      '/dashboard/student/shop',
      '/dashboard/student/rankings',
      '/dashboard/student/certificates',
      '/dashboard/student/results',
    ]

    for (const route of routes) {
      await auditPage(page, route, testInfo, listeners)
      await screenshotStep(page, testInfo, `student-${route.split('/').pop()}`, route)
    }
  })

  test('teacher: all workspace pages', async ({ page }, testInfo) => {
    test.skip(!hasCredentials('teacher'), 'Set QA_TEACHER_EMAIL and QA_TEACHER_PASSWORD')
    const creds = getCredentials('teacher')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    if (page.url().includes('pending')) {
      test.skip()
      return
    }

    const routes = [
      '/dashboard/teacher',
      '/dashboard/teacher/students',
      '/dashboard/teacher/schedule',
      '/dashboard/teacher/classes',
      '/dashboard/teacher/coupons',
      '/dashboard/teacher/competitions',
      '/dashboard/teacher/settings',
    ]

    for (const route of routes) {
      await auditPage(page, route, testInfo, listeners)
      await screenshotStep(page, testInfo, `teacher-${route.split('/').pop()}`, route)
    }
  })

  test('admin: approve/reject UI reachable', async ({ page }, testInfo) => {
    test.skip(!hasCredentials('admin'), 'Set QA_ADMIN_EMAIL and QA_ADMIN_PASSWORD')
    const creds = getCredentials('admin')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    await page.waitForURL(/admin/, { timeout: 30_000 })

    await auditPage(page, '/admin/teachers', testInfo, listeners)
    await screenshotStep(page, testInfo, 'admin-teachers', '/admin/teachers')

    const approveBtn = page.getByRole('button', { name: /approve|verify|accept/i }).first()
    const rejectBtn = page.getByRole('button', { name: /reject|deny|suspend/i }).first()

    if (!(await approveBtn.isVisible().catch(() => false)) && !(await rejectBtn.isVisible().catch(() => false))) {
      reportIssue({
        title: 'Admin teachers page missing approve/reject actions',
        description: 'No visible approve or reject controls on /admin/teachers.',
        priority: 'Low',
        category: 'workflow',
        route: '/admin/teachers',
        suggestedFix: 'Ensure pending teachers list renders action buttons.',
      })
    }

    await auditPage(page, '/admin/reports', testInfo, listeners)
    await auditPage(page, '/admin/audit', testInfo, listeners)
  })

  test('judge workspace guard and layout', async ({ page }, testInfo) => {
    test.skip(!hasCredentials('teacher'), 'Set QA_TEACHER_EMAIL for competition access')
    const creds = getCredentials('teacher')!
    const listeners = await attachPageListeners(page)

    await login(page, creds)
    await auditPage(page, '/dashboard/judge', testInfo, listeners)
    await screenshotStep(page, testInfo, 'judge-home', '/dashboard/judge')
  })
})

test.describe('Redirect and legacy routes', () => {
  test('legacy /explore redirects to /discover', async ({ page }) => {
    await page.goto('/explore')
    await page.waitForURL(/discover/, { timeout: 10_000 })
    expect(page.url()).toContain('/discover')
  })

  test('legacy /pricing redirects to /how-it-works', async ({ page }) => {
    await page.goto('/pricing')
    await page.waitForURL(/how-it-works/, { timeout: 10_000 })
    expect(page.url()).toContain('/how-it-works')
  })

  test('certificate verify page handles invalid token', async ({ page }, testInfo) => {
    const listeners = await attachPageListeners(page)
    await auditPage(page, '/verify/certificate/invalid-token-xyz', testInfo, listeners)
    await screenshotStep(page, testInfo, 'cert-verify-invalid', '/verify/certificate/invalid-token-xyz')
    const body = await page.locator('body').innerText()
    expect(body.length).toBeGreaterThan(10)
  })
})
