# QA Report — Yogstra

**Date:** 2026-06-30  
**Playwright status:** passed  
**Tests:** 120 total · 110 passed · 0 failed · 10 skipped  
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

- [passed] a11y scan — Landing (6344ms)
- [passed] a11y scan — Discover (3460ms)
- [passed] a11y scan — Find Teachers (3206ms)
- [passed] a11y scan — Academies (3463ms)
- [passed] a11y scan — Community (3058ms)
- [passed] a11y scan — Competitions (3199ms)
- [passed] a11y scan — How It Works (3301ms)
- [passed] a11y scan — About (3117ms)
- [passed] skip link and keyboard focus on landing (1789ms)
- [passed] landing at desktop (2394ms)
- [passed] landing at laptop (2593ms)
- [passed] landing at tablet (2271ms)
- [passed] landing at phone (2436ms)
- [passed] landing at phone-landscape (2377ms)
- [passed] buttons have visible labels on discover (2089ms)
- [passed] forms have associated labels on login (1490ms)
- [passed] navigation timing — Landing (4125ms)
- [passed] navigation timing — Discover (3694ms)
- [passed] navigation timing — Find Teachers (3731ms)
- [passed] navigation timing — Academies (3427ms)
- [passed] navigation timing — Community (3730ms)
- [passed] navigation timing — Competitions (3490ms)
- [passed] no duplicate identical API calls on landing (3070ms)
- [passed] XSS payload in login email is escaped (3191ms)
- [passed] invalid admin URL segments do not expose data (1724ms)
- [passed] double submit on login is handled (3223ms)
- [passed] expired session redirects from protected route (1932ms)
- [passed] browse teachers → open profile (1855ms)
- [passed] browse academies → open profile (1790ms)
- [passed] browse competitions → open detail (2194ms)
- [passed] community page loads and shows content or empty state (1975ms)
- [passed] student signup shows validation on empty submit (2232ms)
- [passed] teacher registration form loads (1941ms)
- [passed] get-started role picker works (1816ms)
- [passed] login form rejects invalid credentials (2608ms)
- [skipped] student: competitions, classes, shop, rankings (121ms)
- [skipped] teacher: all workspace pages (117ms)
- [skipped] admin: approve/reject UI reachable (106ms)
- [skipped] judge workspace guard and layout (109ms)
- [passed] legacy /explore redirects to /discover (1958ms)
- [passed] legacy /pricing redirects to /how-it-works (1908ms)
- [passed] certificate verify page handles invalid token (2266ms)
- [passed] redirects unauthenticated user from /dashboard/student (2234ms)
- [passed] redirects unauthenticated user from /dashboard/student/explore (1976ms)
- [passed] redirects unauthenticated user from /dashboard/student/teachers (1994ms)
- [passed] redirects unauthenticated user from /dashboard/student/community (1896ms)
- [passed] redirects unauthenticated user from /dashboard/student/competitions (1848ms)
- [passed] redirects unauthenticated user from /dashboard/student/competitions/my (1871ms)
- [passed] redirects unauthenticated user from /dashboard/student/results (1859ms)
- [passed] redirects unauthenticated user from /dashboard/student/certificates (1876ms)
- [passed] redirects unauthenticated user from /dashboard/student/rankings (2182ms)
- [passed] redirects unauthenticated user from /dashboard/student/classes (2099ms)
- [passed] redirects unauthenticated user from /dashboard/student/messages (2023ms)
- [passed] redirects unauthenticated user from /dashboard/student/settings (2458ms)
- [passed] redirects unauthenticated user from /dashboard/teacher (2102ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/students (2151ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/schedule (1933ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/classes (1787ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/community (1864ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/messages (2028ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/notifications (2088ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/coupons (1906ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/earnings (2326ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/competitions (1816ms)
- [passed] redirects unauthenticated user from /dashboard/teacher/settings (1863ms)
- [passed] redirects unauthenticated user from /admin (1823ms)
- [passed] redirects unauthenticated user from /admin/teachers (1824ms)
- [passed] redirects unauthenticated user from /admin/students (1896ms)
- [passed] redirects unauthenticated user from /admin/community (1794ms)
- [passed] redirects unauthenticated user from /admin/bookings (1823ms)
- [passed] redirects unauthenticated user from /admin/schedules (1792ms)
- [passed] redirects unauthenticated user from /admin/chats (1787ms)
- [passed] redirects unauthenticated user from /admin/payouts (1751ms)
- [passed] redirects unauthenticated user from /admin/categories (1799ms)
- [passed] redirects unauthenticated user from /admin/competitions (1894ms)
- [passed] redirects unauthenticated user from /admin/academies (1939ms)
- [passed] redirects unauthenticated user from /admin/reports (1926ms)
- [passed] redirects unauthenticated user from /admin/users (1850ms)
- [passed] redirects unauthenticated user from /admin/audit (1818ms)
- [passed] redirects unauthenticated user from /admin/settings (1854ms)
- [passed] redirects unauthenticated user from /dashboard/academy (1770ms)
- [passed] redirects unauthenticated user from /dashboard/academy/teachers (1916ms)
- [passed] redirects unauthenticated user from /dashboard/academy/students (2021ms)
- [passed] redirects unauthenticated user from /dashboard/academy/batches (2183ms)
- [passed] redirects unauthenticated user from /dashboard/academy/finance (2000ms)
- [passed] redirects unauthenticated user from /dashboard/academy/timetable (1825ms)
- [passed] redirects unauthenticated user from /dashboard/academy/attendance (1968ms)
- [passed] redirects unauthenticated user from /dashboard/academy/competitions (2088ms)
- [passed] redirects unauthenticated user from /dashboard/academy/members (1932ms)
- [passed] redirects unauthenticated user from /dashboard/academy/settings (1893ms)
- [passed] redirects unauthenticated user from /dashboard/competitions (2108ms)
- [passed] redirects unauthenticated user from /dashboard/organizer (1778ms)
- [passed] redirects unauthenticated user from /dashboard/judge (1973ms)
- [passed] redirects unauthenticated user from /dashboard/results (1745ms)
- [passed] redirects unauthenticated user from /dashboard/rankings (2139ms)
- [passed] redirects unauthenticated user from /dashboard/certificates (1884ms)
- [skipped] login → dashboard → browse teachers → profile → settings (101ms)
- [skipped] logout and re-login preserves session flow (112ms)
- [skipped] login → dashboard → students → schedule → earnings (0ms)
- [skipped] login → admin console pages (0ms)
- [skipped] academy dashboard accessible when logged in as teacher (105ms)
- [skipped] competition workspace pages (95ms)
- [passed] loads Landing (/) (2081ms)
- [passed] loads Discover (/discover) (2043ms)
- [passed] loads Find Teachers (/teachers) (2153ms)
- [passed] loads Academies (/academies) (1773ms)
- [passed] loads Community (/community) (1659ms)
- [passed] loads Competitions (/competitions) (1612ms)
- [passed] loads How It Works (/how-it-works) (1617ms)
- [passed] loads About (/about) (2098ms)
- [passed] loads Help Center (/help) (1709ms)
- [passed] loads Privacy Policy (/privacy-policy) (1806ms)
- [passed] loads Terms of Service (/terms-of-service) (2107ms)
- [passed] loads Refund Policy (/refund-policy) (1827ms)
- [passed] loads Login (/auth/login) (2033ms)
- [passed] loads Student Signup (/auth/student) (1744ms)
- [passed] loads Teacher Register (/auth/teacher/register) (1595ms)
- [passed] loads Get Started (/auth/get-started) (1647ms)
- [passed] landing page has working nav links (5396ms)
- [passed] unknown route shows app shell or redirect (2523ms)

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


