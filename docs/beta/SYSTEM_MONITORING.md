# System Monitoring — Yogstra Beta

---

## Health dashboard

**Location:** `/admin/system`

| Check | Source |
|-------|--------|
| Database | Supabase query latency |
| Authentication | Session API |
| Realtime | Client connection state |
| Storage | Avatar bucket list |
| Payments | `VITE_RAZORPAY_KEY_ID` configured |
| Errors (24h) | `platform_activity_log` where status=error |
| Analytics | `platform_analytics_events` aggregates |

---

## Logging tables

| Table | Purpose |
|-------|---------|
| `platform_activity_log` | User actions, errors, enrollments |
| `admin_audit_log` | Admin before/after changes |
| `platform_analytics_events` | Anonymous usage metrics |

---

## Client-side capture

- React `AppErrorBoundary` — render crashes
- `window.unhandledrejection` / `window.error` — global handlers
- `logActivity()` — payment, login, logout, errors
- Payment failures logged via `payments.ts`

---

## Server-side capture

- `fulfillPayment.ts` — enrollment success → activity log
- Vercel function logs — all `/api/*` routes

---

## Recommended external monitoring (post-beta)

- Sentry for React + API errors
- Vercel Analytics for Web Vitals
- Supabase point-in-time recovery alerts

---

## Charts & export

Admin System page shows 30-day DAU/WAU/MAU and event counts. **Export CSV** button downloads analytics summary.
