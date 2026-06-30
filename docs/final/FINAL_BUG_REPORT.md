# Final Bug Report — Yogstra MVP

**Date:** 2026-06-30  
**Sprint:** 16

---

## Fixed in Sprint 16

### BUG-001 — Enrollment incomplete after successful payment (Critical) ✅ FIXED

**Symptoms:** Payment succeeded; student sometimes not enrolled; teacher/academy dashboards empty.

**Root causes:**
1. `fulfillPaidClassOrder` returned early when `payment_status === 'paid'`, skipping bookings, batch enrollment, notifications on retry
2. `batch_students.enrollment_type: 'paid'` violated DB check constraint (`academy` | `independent`) — silent failure
3. `bookings` and `batch_students` inserts ignored Supabase errors

**Fix:** `server/fulfillPayment.ts` — idempotent `completePaidOrderSideEffects()`, valid enum, error propagation, re-enrollment after batch removal.

---

### BUG-002 — Blank page on unknown routes (High) ✅ FIXED

**Symptoms:** Navigating to invalid URL showed empty body.

**Fix:** `NotFoundPage` + catch-all route in `App.tsx`.

---

### BUG-003 — Admin enrollment notification broken link (Low) ✅ FIXED

**Fix:** Notification href corrected to `/admin/bookings`.

---

## Open (non-blocking)

### BUG-004 — Color contrast failures (High) — OPEN

**Routes:** `/discover`, `/teachers`, `/academies`, `/community`, `/competitions`, `/about`  
**Source:** axe WCAG 2 AA scan  
**Impact:** Accessibility compliance; does not block core workflows  
**Suggested fix:** Adjust muted text / badge colors to meet 4.5:1 ratio

---

### BUG-005 — Duplicate Supabase queries on landing (Low) — OPEN

**Impact:** 4× calls to profiles, academies, competitions on `/`  
**Suggested fix:** Shared React Query cache or deduplicated fetch in landing sections

---

### BUG-006 — Empty teacher listing in staging (Medium) — DATA

**Impact:** `/teachers` shows no cards when no verified teachers exist  
**Not a code defect** — requires seeded production/staging data

---

## Not bugs (by design / MVP scope)

| Item | Notes |
|---|---|
| Competition registration payment | MVP stub; class payments use full Razorpay flow |
| 10 skipped Playwright tests | Require QA credential env vars |
| LiveKit bundle 603 KB | Expected for video; lazy-loaded |

---

## Verification

After fixes:

```
npm run test:e2e → 110 passed, 0 failed
```

Payment fulfillment path manually traceable via `docs/production/ENROLLMENT_FLOW_AUDIT.md`.
