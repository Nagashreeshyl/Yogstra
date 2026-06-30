# QA Report — Yogstra

**Date:** 2026-06-30  
**Playwright status:** passed  
**Tests:** 122 total · 112 passed · 0 failed · 10 skipped  
**Issues found:** 11 (0 critical, 6 high, 2 medium, 3 low)

## Artifacts

| Artifact | Location |
|---|---|
| HTML report | `qa-artifacts/html-report/index.html` |
| JSON results | `qa-artifacts/results.json` |
| Screenshots | `qa-artifacts/screenshots/` |
| Videos | `qa-artifacts/test-results/` |
| Traces | `qa-artifacts/test-results/` (on failure) |

## Issue summary by category

| Category | Count |
|---|---|
| Bug | 0 |
| Performance | 3 |
| Security | 0 |
| Accessibility | 6 |
| Responsive | 0 |
| UI | 1 |
| Workflow | 1 |

## Test results

- [passed] a11y scan — Landing (4434ms)
- [passed] a11y scan — Discover (3718ms)
- [passed] a11y scan — Find Teachers (3467ms)
- [passed] a11y scan — Academies (3041ms)
- [passed] a11y scan — Community (3060ms)
- [passed] a11y scan — Competitions (3365ms)
- [passed] a11y scan — How It Works (3445ms)
- [passed] a11y scan — About (3191ms)
- [passed] skip link and keyboard focus on landing (2224ms)
- [passed] landing at desktop (2706ms)
- [passed] landing at laptop (2540ms)
- [passed] landing at tablet (2695ms)
- [passed] landing at phone (2311ms)
- [passed] landing at phone-landscape (2348ms)
- [passed] buttons have visible labels on discover (2433ms)
- [passed] forms have associated labels on login (1718ms)
- [passed] navigation timing — Landing (4306ms)
- [passed] navigation timing — Discover (3691ms)
- [passed] navigation timing — Find Teachers (3630ms)
- [passed] navigation timing — Academies (3543ms)
- [passed] navigation timing — Community (3476ms)
- [passed] navigation timing — Competitions (3347ms)
- [passed] no duplicate identical API calls on landing (3111ms)
- [passed] XSS payload in login email is escaped (3071ms)
- [passed] invalid admin URL segments do not expose data (1819ms)
- [passed] double submit on login is handled (3256ms)
- [passed] expired session redirects from protected route (1855ms)
- [passed] browse teachers → open profile (2104ms)
- [passed] browse academies → open profile (1668ms)
- [passed] browse competitions → open detail (1798ms)
- [passed] community page loads and shows content or empty state (1679ms)
- [passed] student signup shows validation on empty submit (2685ms)
- [passed] teacher registration form loads (1840ms)
- [passed] get-started role picker works (1724ms)
- [passed] login form rejects invalid credentials (2512ms)
- [skipped] student: competitions, classes, shop, rankings (115ms)
- [skipped] teacher: all workspace pages (111ms)
- [skipped] admin: approve/reject UI reachable (113ms)
- [skipped] judge workspace guard and layout (113ms)
- [passed] legacy /explore redirects to /discover (1840ms)
- [passed] legacy /pricing redirects to /how-it-works (3080ms)
- [passed] certificate verify page handles invalid token (2109ms)
- [passed] redirects unauthenticated user from /dashboard/student (1974ms)
- [passed] redirects unauthenticated user from /dashboard/student/explore (1992ms)
- [passed] redirects unauthenticated user from /dashboard/student/teachers (1929ms)
- [passed] redirects unauthenticated user from /dashboard/student/community (2086ms)
- [passed] redirects unauthenticated user from /dashboard/student/competitions (2044ms)
- [passed] redirects unauthenticated user from /dashboard/student/competitions/my (1940ms)
- [passed] redirects unauthenticated user from /dashboard/student/results (1882ms)
- [passed] redirects unauthenticated user from /dashboard/student/certificates (1794ms)
- [passed] redirects unauthenticated user from /dashboard/student/rankings (1943ms)
- [passed] redirects unauthenticated user from /dashboard/student/classes (1726ms)
- [passed] redirects unauthenticated user from /dashboard/student/messages (1912ms)
- [passed] redirects unauthenticated user from /dashboard/student/settings (1720ms)
- [passed] redirects unauthenticated user from /dashboard/teacher (1916ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/students (1901ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/schedule (2093ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/classes (1873ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/community (1954ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/messages (1913ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/notifications (1906ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/coupons (1907ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/earnings (1784ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/competitions (1964ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/settings (1954ms)
- [passed] redirects unauthenticated user from /admin (1822ms)
- [passed] redirects unauthenticated user from /admin/teachers (1969ms)
- [passed] redirects unauthenticated user from /admin/students (1951ms)
- [passed] redirects unauthenticated user from /admin/community (1879ms)
- [passed] redirects unauthenticated user from /admin/bookings (2360ms)
- [passed] redirects unauthenticated user from /admin/schedules (1731ms)
- [passed] redirects unauthenticated user from /admin/chats (1998ms)
- [passed] redirects unauthenticated user from /admin/payouts (1694ms)
- [passed] redirects unauthenticated user from /admin/categories (1826ms)
- [passed] redirects unauthenticated user from /admin/competitions (1763ms)
- [passed] redirects unauthenticated user from /admin/academies (1956ms)
- [passed] redirects unauthenticated user from /admin/reports (1917ms)
- [passed] redirects unauthenticated user from /admin/users (1903ms)
- [passed] redirects unauthenticated user from /admin/audit (2184ms)
- [passed] redirects unauthenticated user from /admin/system (1853ms)
- [passed] redirects unauthenticated user from /admin/feedback (2067ms)
- [passed] redirects unauthenticated user from /admin/settings (1950ms)
- [passed] redirects unauthenticated user from /dashboard/academy (2094ms)
- [passed] redirects unauthenticated user from /dashboard/academy/teachers (1797ms)
- [passed] redirects unauthenticated user from /dashboard/academy/students (1862ms)
- [passed] redirects unauthenticated user from /dashboard/academy/batches (1829ms)
- [passed] redirects unauthenticated user from /dashboard/academy/finance (1947ms)
- [passed] redirects unauthenticated user from /dashboard/academy/timetable (1830ms)
- [passed] redirects unauthenticated user from /dashboard/academy/attendance (1871ms)
- [passed] redirects unauthenticated user from /dashboard/academy/competitions (1820ms)
- [passed] redirects unauthenticated user from /dashboard/academy/members (1852ms)
- [passed] redirects unauthenticated user from /dashboard/academy/settings (1915ms)
- [passed] redirects unauthenticated user from /dashboard/competitions (1826ms)
- [passed] redirects unauthenticated user from /dashboard/organizer (1836ms)
- [passed] redirects unauthenticated user from /dashboard/judge (1869ms)
- [passed] redirects unauthenticated user from /dashboard/results (1987ms)
- [passed] redirects unauthenticated user from /dashboard/rankings (1906ms)
- [passed] redirects unauthenticated user from /dashboard/certificates (1854ms)
- [skipped] login → dashboard → browse teachers → profile → settings (98ms)
- [skipped] logout and re-login preserves session flow (94ms)
- [skipped] login → dashboard → students → schedule → earnings (0ms)
- [skipped] login → admin console pages (0ms)
- [skipped] academy dashboard accessible when logged in as teacher (105ms)
- [skipped] competition workspace pages (95ms)
- [passed] loads Landing (/) (2237ms)
- [passed] loads Discover (/discover) (2089ms)
- [passed] loads Find Teachers (/teachers) (1883ms)
- [passed] loads Academies (/academies) (2052ms)
- [passed] loads Community (/community) (2066ms)
- [passed] loads Competitions (/competitions) (2136ms)
- [passed] loads How It Works (/how-it-works) (1809ms)
- [passed] loads About (/about) (1843ms)
- [passed] loads Help Center (/help) (2121ms)
- [passed] loads Privacy Policy (/privacy-policy) (2237ms)
- [passed] loads Terms of Service (/terms-of-service) (2074ms)
- [passed] loads Refund Policy (/refund-policy) (1959ms)
- [passed] loads Login (/auth/login) (1727ms)
- [passed] loads Student Signup (/auth/student) (1895ms)
- [passed] loads Teacher Register (/auth/teacher/register) (1826ms)
- [passed] loads Get Started (/auth/get-started) (2182ms)
- [passed] landing page has working nav links (4904ms)
- [passed] unknown route shows app shell or redirect (2549ms)

## All issues

### QA-0001 — A11y: color-contrast on /discover (High)

- **Category:** accessibility
- **Route:** /discover
- **Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
- **Suggested fix:** Elements must meet minimum color contrast ratio thresholds


### QA-0002 — A11y: color-contrast on /teachers (High)

- **Category:** accessibility
- **Route:** /teachers
- **Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
- **Suggested fix:** Elements must meet minimum color contrast ratio thresholds


### QA-0003 — A11y: color-contrast on /academies (High)

- **Category:** accessibility
- **Route:** /academies
- **Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
- **Suggested fix:** Elements must meet minimum color contrast ratio thresholds


### QA-0004 — A11y: color-contrast on /community (High)

- **Category:** accessibility
- **Route:** /community
- **Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
- **Suggested fix:** Elements must meet minimum color contrast ratio thresholds


### QA-0005 — A11y: color-contrast on /competitions (High)

- **Category:** accessibility
- **Route:** /competitions
- **Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
- **Suggested fix:** Elements must meet minimum color contrast ratio thresholds


### QA-0006 — A11y: color-contrast on /about (High)

- **Category:** accessibility
- **Route:** /about
- **Description:** Ensure the contrast between foreground and background colors meets WCAG 2 AA minimum contrast ratio thresholds
- **Suggested fix:** Elements must meet minimum color contrast ratio thresholds


### QA-0007 — Unlabeled form inputs on login (Medium)

- **Category:** ui
- **Route:** /auth/login
- **Description:** 1 inputs missing associated labels.
- **Suggested fix:** Use Label component with htmlFor matching input id.


### QA-0008 — Duplicate Supabase queries on landing (Low)

- **Category:** performance
- **Route:** /
- **Description:** https://xoonhsoqwkjhilxqkmmm.supabase.co/rest/v1/profiles called 4 times.
- **Suggested fix:** Deduplicate queries or use shared cache.


### QA-0009 — Duplicate Supabase queries on landing (Low)

- **Category:** performance
- **Route:** /
- **Description:** https://xoonhsoqwkjhilxqkmmm.supabase.co/rest/v1/academies called 4 times.
- **Suggested fix:** Deduplicate queries or use shared cache.


### QA-0010 — Duplicate Supabase queries on landing (Low)

- **Category:** performance
- **Route:** /
- **Description:** https://xoonhsoqwkjhilxqkmmm.supabase.co/rest/v1/competitions called 4 times.
- **Suggested fix:** Deduplicate queries or use shared cache.


### QA-0011 — No teacher cards on /teachers (Medium)

- **Category:** workflow
- **Route:** /teachers
- **Description:** Public teachers page has no clickable teacher profiles.
- **Suggested fix:** Ensure teacher listing loads from Supabase and renders links.


