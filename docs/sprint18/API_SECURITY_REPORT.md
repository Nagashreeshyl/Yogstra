# API_SECURITY_REPORT — Sprint 18

**Runtime:** Vercel Serverless Functions  
**Shared middleware:** `server/apiSecurity.ts`

---

## Route inventory

| Route | Method | Auth | Rate limit | Validation | Service role |
|-------|--------|------|------------|------------|--------------|
| `/api/razorpay-order` | POST | Bearer + student | 20/min/IP | Amount, teacher, thread, `validatePendingOrderRequest` | Creates pending order |
| `/api/razorpay-fulfill` | POST | Bearer + order owner | 30/min/IP | Razorpay HMAC signature | Fulfill payment |
| `/api/razorpay-webhook` | POST | Webhook signature | None | Raw body HMAC, event idempotency | Fulfill + payouts |
| `/api/livekit-token` | POST | Bearer | 60/min/IP | Room access via RLS lookup | Token mint |
| `/api/teacher-payout-setup` | POST | Bearer + teacher | 10/min/IP | IFSC/PAN/account sanitize | Razorpay linked account |
| `/api/competition-registration-complete` | POST | Bearer + registrant | 20/min/IP | Registration ownership; **blocks paid entry** | Confirm free entry |

---

## CORS & headers

- Origin allowlist: production URL + env overrides (`apiSecurity.ts`)
- Webhook skips origin check (correct)
- Response security headers set on API responses
- Global headers in `vercel.json`: HSTS, CSP, X-Frame-Options, etc.

---

## Payment flow security

```
Student → POST /api/razorpay-order (JWT)
       → Razorpay checkout
       → POST /api/razorpay-fulfill (JWT + signature)
       → fulfillPaidClassOrder (service role)
       → class_orders paid, booking active, batch enroll, notifications

Parallel: POST /api/razorpay-webhook (signature) — idempotent backup path
```

| Attack | Mitigation |
|--------|------------|
| Forged payment without signature | Fulfill rejects invalid HMAC |
| Pay for another user's order | `assertOrderFulfillAccess` |
| Duplicate fulfillment | Unique payment id + alreadyFulfilled check |
| Duplicate enrollment | `validatePendingOrderRequest` |
| Client INSERT paid order | **019 DB trigger** |
| Replay webhook | Idempotent by payment id |

---

## Competition registration API

**File:** `api/competition-registration-complete.ts`

| Check | Implementation |
|-------|----------------|
| Auth required | Bearer JWT |
| Registrant match | `registration.registrant_id === user.id` |
| Paid entry | Returns **501** if `entry_fee > 0` |
| Free entry | Service role sets `waived` + `confirmed` |
| Client direct UPDATE | Blocked by DB trigger |

**Gap:** Full Razorpay competition flow not implemented (product backlog).

---

## Input validation

| Layer | Location |
|-------|----------|
| Text sanitization | `server/validateInput.ts` — trim, max length, control chars |
| Client forms | Zod/inline validation in components |
| Order validation | `server/orderValidation.ts` — thread, fee, teacher verified |
| XSS | React escaping + `src/utils/sanitize.ts` |

---

## Rate limiting

```typescript
// server/apiSecurity.ts — in-memory Map per cold start
enforceRateLimit(req, res, bucket, maxRequests, windowMs)
```

**Limitation:** Resets on cold start; not shared across Vercel instances. **Recommendation:** Upstash Redis for production scale.

---

## Secrets

| Secret | Exposure |
|--------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Server only ✅ |
| `RAZORPAY_KEY_SECRET` | Server only ✅ |
| `LIVEKIT_API_SECRET` | Server only ✅ |
| Anon key | Client (expected) |

---

## Sprint 18 API changes

1. Added `competition-registration-complete.ts`
2. Registered in `vercel.json` functions + CSP connect-src unchanged
3. Client `markRegistrationPaid()` routed through API

---

## Remaining API risks

| Risk | Severity | Mitigation path |
|------|----------|-----------------|
| No webhook rate limit | Low | Add IP allowlist or edge rate limit |
| teacher-payout-setup doesn't persist linked account server-side | Medium | Service role upsert in handler |
| Competition paid entry 501 | Product | Implement competition Razorpay order + fulfill |
| In-memory rate limits | Medium | Redis-backed limiter |

---

## Test coverage

E2E security specs in `e2e/journeys/workflows.spec.ts` — unauthenticated route guards (98 tests pass). Authenticated payment journeys require env credentials (skipped in CI without secrets).
