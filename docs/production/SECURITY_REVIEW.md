# Security Review — Sprint 14

**Date:** 2026-06-30  
**Scope:** Client SPA, Vercel serverless API routes, Supabase RLS & Storage  
**Risk model:** Multi-tenant yoga platform with payments, PII, and role-based workspaces

---

## Executive summary

Yogstra implements **defense in depth**: Supabase RLS as the authoritative data boundary, React route guards for UX-level access control, server-side secrets for payment and video token issuance, and input sanitization on user-generated content.

| Area | Rating | Notes |
|---|---|---|
| Authentication | ✅ Strong | Supabase Auth JWT; no custom session cookies |
| Authorization (RLS) | ✅ Strong | All domain tables protected |
| Authorization (UI) | ✅ Good | Role, verified-teacher, workspace guards |
| Storage | ✅ Good | Scoped buckets; no public write |
| API routes | ✅ Good | Auth + rate limit + CORS |
| Secrets | ✅ Good | Service role / Razorpay server-only |
| Input validation | ✅ Good | Client + server sanitization |
| XSS | ✅ Low risk | React escaping + text sanitization |
| CSRF | ✅ N/A typical | Bearer JWT; no cookie auth |
| Broken access control | ⚠️ Low | Client guards are UX-only; RLS is authoritative |
| Competition payments | ⚠️ Medium | Client can mark paid without Razorpay (MVP stub) |

**No critical vulnerabilities identified.** Competition payment stub is a known product gap, not an accidental bypass of class payment security.

---

## Authentication

### Implementation

- Supabase Auth handles signup, login, password reset, session refresh
- Client stores session via Supabase client (localStorage by default — Supabase SDK behavior)
- `AppContext` subscribes to `onAuthStateChange` for session lifecycle
- Server routes validate Bearer token via `assertAuthenticatedUser()` in `server/supabaseAdmin.ts`

### Session expiry

- Supabase auto-refreshes JWT before expiry
- Failed authenticated requests surface as empty data or redirect to auth routes
- No custom expired-session middleware (relies on Supabase client)

### Platform admin

- `platformAdmin.ts` email allowlist **plus** `profiles.role = 'admin'`
- Admin routes wrapped in `RequireRole role="admin"`
- RLS `is_platform_admin()` function mirrors server-side checks

**Recommendation:** Move admin allowlist to environment variable or DB table for ops flexibility.

---

## Authorization

### Route guards

| Guard | Routes | Enforcement |
|---|---|---|
| `RequireGuest` | Auth pages | Redirect if logged in |
| `RequireRole` | Student/admin dashboards | Role match |
| `RequireVerifiedTeacher` | Teacher dashboard | Blocks pending/rejected |
| `RequireAcademyFoundationAccess` | `/dashboard/academy/*` | Academy permission |
| `RequireCompetitionFoundationAccess` | Competition/judge routes | Competition role |
| `LoggedInRedirect` | Public shell | Post-login routing |

**Important:** Route guards are **not security boundaries**. They prevent UI confusion; RLS prevents data exfiltration.

### RLS coverage

All tables in migrations `001`–`006`, `010` have RLS enabled. Key patterns:

- Users read/write own profile and preferences
- Teachers manage own schedules, coupons, notifications
- Academy access via `can_manage_academy()` membership checks
- Competition data scoped to organizer, judge, or registered participant
- Admin policies use `is_platform_admin()`
- Public reads limited to published competitions, community posts

### Academy bootstrap (`011`)

Fixed RLS chicken-and-egg where new academy owners could not insert membership. Verified secure: policies only allow creator to bootstrap **their own** academy.

---

## Storage security

| Bucket | Read | Write | Delete |
|---|---|---|---|
| `avatars` | Public | Own uid folder only | Own uid folder only |
| `post-media` | Public | Own uid folder only | Own uid folder only |

### Upload validation (`avatars.ts`, community uploads)

- MIME allowlist: JPEG, PNG, WebP, GIF (avatars); + MP4/WebM/MOV (posts)
- Size caps: 5 MB avatars, 25 MB post media
- Filenames scoped to `auth.uid()` folder prefix

**Gap:** No virus scanning — acceptable for MVP; consider ClamAV or cloud scanning at scale.

---

## API security (`server/apiSecurity.ts`, Vercel functions)

### Endpoints

| Route | Auth | Purpose |
|---|---|---|
| `api/razorpay-order.ts` | Bearer JWT | Create payment order |
| `api/razorpay-fulfill.ts` | Bearer JWT | Client-side fulfillment callback |
| `api/razorpay-webhook.ts` | HMAC signature | Server-side payment confirmation |
| `api/livekit-token.ts` | Bearer JWT + room access | Video class tokens |
| `api/teacher-payout-setup.ts` | Bearer JWT | Razorpay Route onboarding |

### Controls

- **CORS:** Production limited to deployment origin
- **Security headers:** `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy` (via `vercel.json`)
- **Rate limiting:** In-memory per-IP buckets on API routes
- **Webhook verification:** Razorpay HMAC with `RAZORPAY_WEBHOOK_SECRET`

### Rate limiter limitation

In-memory limiter resets on Vercel cold starts. **Medium risk** for payment abuse at scale. Recommend Upstash Redis for production SLAs.

---

## Secrets management

| Variable | Client exposure | Risk |
|---|---|---|
| `VITE_SUPABASE_URL` | Public | Expected |
| `VITE_SUPABASE_ANON_KEY` | Public | Expected (RLS protects) |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | ✅ |
| `RAZORPAY_KEY_SECRET` | Server only | ✅ |
| `RAZORPAY_WEBHOOK_SECRET` | Server only | ✅ |
| `LIVEKIT_API_SECRET` | Server only | ✅ |
| `VITE_RAZORPAY_KEY_ID` | Public | Expected (checkout) |

No service role key found in client bundle (verified by build artifact inspection).

---

## Input validation & sanitization

| Layer | File | Behavior |
|---|---|---|
| Client text | `utils/sanitize.ts` | Trim, strip null bytes, max length |
| Server text | `server/validateInput.ts` | Mirrors client rules |
| File uploads | Service layer | MIME + size checks |
| SQL injection | Supabase client | Parameterized queries only |

---

## XSS

- React JSX auto-escapes rendered text
- User content (posts, comments, bios) rendered as text nodes, not `dangerouslySetInnerHTML`
- `sanitizeText()` strips control characters before persistence

**Low risk** unless future rich-text editor added without sanitization.

---

## CSRF

- Authentication uses Supabase JWT in Authorization header / client session
- No cookie-based session auth on API routes
- Standard CSRF against cookie sessions does not apply

---

## Broken access control — findings

| Finding | Severity | Mitigation |
|---|---|---|
| Competition `markRegistrationPaid()` client-side only | Medium | Documented MVP gap; RLS still requires authenticated user; add Razorpay before production competition fees |
| Client route guards bypassable via direct Supabase API | Low | RLS is authoritative — verified |
| Admin allowlist hardcoded emails | Low | Move to env/DB |
| Student notification read state in localStorage | Low | UX only; no security impact |
| Public competition/community reads | Info | By design; RLS limits to published content |

---

## Sensitive data

| Data type | Storage | Protection |
|---|---|---|
| User email, phone | `profiles` | RLS; own profile or admin |
| Teacher payout details | `teacher_payout_private` | RLS; teacher + admin only |
| Razorpay linked accounts | Server-side Route API | Not in client DB |
| Chat messages | `direct_messages`, `chat_threads` | Thread participant RLS |
| Payment records | `class_orders`, `payouts` | Participant + admin RLS |

PII is not logged to console in production paths (dev-only error logging).

---

## Competition payment stub — security note

`studentCompetitionOperations.markRegistrationPaid()` updates `payment_status` without payment verification. Any authenticated user who owns the registration could mark it paid.

**Mitigation for production launch with paid competitions:**

1. Integrate Razorpay order flow (mirror class booking)
2. RLS policy: only service role or webhook can set `payment_status = 'paid'`
3. Remove client-side `markRegistrationPaid()` or restrict to `payment_status = 'pending'` → webhook only

Until then, keep competition entry fees at ₹0 or treat as beta.

---

## Security checklist (pre-launch)

- [x] RLS enabled on all domain tables
- [x] Service role key server-only
- [x] Razorpay webhook HMAC verification
- [x] LiveKit token requires room access check
- [x] Security headers in `vercel.json`
- [x] File upload MIME/size validation
- [ ] Redis rate limiting (recommended)
- [ ] Competition payment RLS hardening (when fees enabled)
- [ ] Admin allowlist externalized
- [ ] Error reporting (Sentry) without PII leakage

---

## Monitoring recommendations

1. **Supabase Dashboard** — failed RLS policy logs, auth anomalies
2. **Razorpay Dashboard** — failed payments, webhook delivery
3. **Vercel Logs** — API 4xx/5xx rates
4. **Sentry or similar** — client + server exceptions (scrub PII)
