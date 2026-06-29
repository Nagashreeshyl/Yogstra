# Security Report

**Date:** 2026-06-29  
**Scope:** Client app, Vercel API routes, Supabase RLS (from consolidated migrations)

---

## Executive summary

Yogstra follows a **defense-in-depth** pattern: Supabase RLS on data, React route guards on UI, server-side secrets for payments/LiveKit, and input sanitization on uploads/text. No critical secrets were found in client bundles. Remaining gaps are documented as medium/low risk.

| Area | Status | Notes |
|---|---|---|
| RLS coverage | ✅ Strong | All domain tables in migrations `001`–`007` have RLS enabled |
| Route protection | ✅ Good | Role, verified-teacher, guest, academy/competition guards |
| Input validation | ✅ Good | `sanitize.ts`, `server/validateInput.ts`, file type/size checks |
| File uploads | ✅ Good | MIME allowlist + size caps |
| Rate limiting | ✅ Partial | In-memory limiter on Vercel API routes |
| Secrets exposure | ✅ Good | Service role / Razorpay secret server-only |
| XSS | ✅ Low risk | React escaping; text sanitization strips null bytes |
| CSRF | ⚠️ N/A typical | Bearer JWT + Supabase; API uses origin checks |
| Permission checks | ✅ Good | Domain helpers + RLS |

---

## RLS coverage

Consolidated schema (`supabase/migrations/`) enables RLS on:

- Core: profiles, teachers, bookings, schedules, community
- Chat: threads, messages, reads, reports
- Marketplace: orders, payouts, platform settings
- Teacher platform: coupons, notifications, class sessions
- Academy: academies, batches, members
- Competition: 12 tables with role-scoped policies

**Client assumption:** All Supabase queries use the anon key; authorization is enforced by RLS, not client checks alone.

---

## Route protection

| Guard | Routes | Behavior |
|---|---|---|
| `RequireGuest` | `/auth/student`, `/auth/teacher/*` | Redirects logged-in users |
| `RequireRole` | Student, admin dashboards | Role match or redirect |
| `RequireVerifiedTeacher` | Teacher dashboard | Blocks pending/rejected teachers |
| `RequireAcademyFoundationAccess` | `/dashboard/academy/*` | Authenticated + academy permission |
| `RequireCompetitionFoundationAccess` | Competition/judge/organizer routes | Role-based competition access |
| `LoggedInRedirect` | Public shell | Post-login routing |

**Gap (low):** Public routes (`/teachers/:id`, `/community`) expose read-only data by design — RLS must allow anon/authenticated reads as intended.

---

## Input validation & uploads

| Layer | Implementation |
|---|---|
| Text fields | `sanitizeText()` — trim, null-byte strip, max length |
| Avatar upload | JPEG/PNG/WebP/GIF, 5 MB max |
| Post media | Images + MP4/WebM/MOV, 25 MB max |
| Server API | `server/validateInput.ts` mirrors client rules |

---

## API security (`server/apiSecurity.ts`)

- **CORS:** Production limited to `https://yogstra.vercel.app`
- **Headers:** `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`
- **Rate limiting:** Per-IP buckets on payment/LiveKit endpoints
- **Bearer token extraction** for authenticated server routes

**Gap (medium):** In-memory rate limiter resets on cold starts — acceptable for MVP; use Redis/Upstash for strict production SLAs.

---

## Secrets

| Variable | Exposure |
|---|---|
| `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` | Client (expected) |
| `VITE_RAZORPAY_KEY_ID` | Client (public key only) |
| `SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `LIVEKIT_API_SECRET` | Server-only ✅ |

No service-role keys found in `src/`.

---

## XSS & injection

- React JSX auto-escapes rendered text
- Chat content should continue using sanitized/plain rendering (verify rich content paths if markdown added later)
- SQL injection mitigated by Supabase parameterized queries

---

## CSRF

- Supabase Auth uses JWT in Authorization header / session — classic CSRF on JSON API is low risk
- Vercel API routes validate `Origin` in production
- Razorpay webhook should verify signature (`RAZORPAY_WEBHOOK_SECRET`) — configured in server

---

## Recommendations

1. Add CSP headers at Vercel edge when domain is finalized.
2. Move rate limiting to durable store for multi-instance deployments.
3. Audit Supabase storage bucket policies (`007_realtime_storage_admin.sql`) before public launch.
4. Pen-test competition registration payment flow end-to-end in staging.
