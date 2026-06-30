# Beta Operations Guide — Yogstra

**Sprint:** 17  
**Purpose:** Run closed beta with observability, feedback loops, and incident response.

---

## Daily operations

1. Check `/admin/system` — all services green, error count low
2. Review `/admin/feedback` — triage open items
3. Review `/admin/audit` — verify admin actions logged
4. Monitor Vercel function logs for `razorpay-fulfill` 500s
5. Supabase Dashboard → Logs for RLS or API errors

---

## Incident response

| Symptom | Action |
|---------|--------|
| Payment succeeded, no enrollment | Check `class_orders` + `bookings`; replay Razorpay webhook |
| User white screen | Check `platform_activity_log` for `error` actions; Error Boundary should recover |
| Admin can't approve teacher | Verify migration 014 applied; check RLS on `admin_audit_log` |
| Realtime stale | User refresh; check Supabase Realtime status |

---

## Beta user onboarding

1. Invite via email with staging/production URL
2. Ensure teacher account pre-approved OR guide through registration
3. Share feedback widget (bottom-right) for bug reports
4. Set `QA_*` credentials for automated regression before each release

---

## Key admin routes

| Route | Purpose |
|-------|---------|
| `/admin/system` | Health, analytics, recent errors |
| `/admin/feedback` | User-submitted beta feedback |
| `/admin/audit` | Immutable admin action log |
| `/admin/bookings` | Payment/enrollment transactions |

---

## Migration requirement

Apply `014_beta_operations.sql` before beta launch for logging, audit, feedback, and analytics tables.

See also: `SYSTEM_MONITORING.md`, `ERROR_HANDLING.md`, `BETA_TEST_PLAN.md`.
