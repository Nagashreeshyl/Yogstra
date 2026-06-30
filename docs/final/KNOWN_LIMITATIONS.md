# Known Limitations — Yogstra MVP

**Date:** 2026-06-30  
**Sprint:** 16

This document lists intentional MVP scope boundaries and known gaps that do **not** block beta launch but should be communicated to users and tracked post-launch.

---

## Product / workflow

| Limitation | Impact | Planned |
|---|---|---|
| Competition registration payment | Uses MVP stub, not full Razorpay flow | Post-beta |
| Authenticated E2E tests skipped without QA env | 10 Playwright tests need credentials | CI setup |
| Batch auto-assignment | First active batch selected when multiple exist | Manual assignment UI exists |
| Delete account | Not exposed in student settings | Post-beta |
| Offline judge scoring | Partial offline support; full sync needs field testing | Post-beta |

---

## QA / accessibility

| Limitation | Impact |
|---|---|
| Color contrast on 6 public pages | WCAG AA failures on muted text; functional but not compliant |
| Teacher listing empty without seed data | `/teachers` shows no cards in empty DB |
| Firefox/WebKit not in default CI | Only Chromium run in `npm run test:e2e` |

---

## Performance

| Limitation | Impact |
|---|---|
| LiveKit bundle ~603 KB | Lazy-loaded; only affects video routes |
| Landing page 4× duplicate Supabase queries | Extra latency on homepage |
| No React Query global cache | Some pages refetch on navigation |

---

## Security / ops

| Limitation | Impact |
|---|---|
| Admin email allowlist hardcoded | Ops must deploy to change admins |
| Student can UPDATE own class_orders via RLS | Mitigated by server-side fulfillment; defense-in-depth gap |
| No Sentry/error monitoring configured | Manual log review required |
| Rate limits on API routes only | No global DDoS beyond Vercel defaults |

---

## Deployment

| Limitation | Impact |
|---|---|
| Migrations forward-only | Rollback requires Supabase point-in-time recovery |
| DEV Razorpay bypass removed for null order | Dev must have API routes running (`vercel dev` or similar) |
| Webhook required for payment recovery | If client fulfill fails AND webhook misconfigured, manual intervention needed |

---

## Help tooltips

HelpTooltip coverage exists on key flows but is **not exhaustive** across every admin/competition field. Expansion is ongoing post-launch polish, not a launch blocker.

---

## What IS production-ready

- Class/program payment → enrollment (Razorpay + idempotent fulfillment)
- Student, teacher, academy, admin, competition workspaces
- Realtime dashboard updates (bookings, orders, notifications, batch_students)
- Auth, RLS, storage, video classes (LiveKit)
- 110 automated E2E tests on Chromium
- Full documentation in `docs/final/` and `docs/production/`

---

## Reporting issues post-launch

1. Check Vercel function logs for payment errors
2. Query `class_orders` where `payment_status = paid` but no matching `bookings`
3. Re-run fulfillment via webhook replay in Razorpay Dashboard
4. File bugs with order ID + Razorpay payment ID
