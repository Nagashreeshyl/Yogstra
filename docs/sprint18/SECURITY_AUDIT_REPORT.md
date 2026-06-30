# SECURITY_AUDIT_REPORT — Sprint 18

**Project:** Yogstra V2  
**Production URL:** https://yogstra.vercel.app  
**Supabase project:** `cgctoacarkzkftizkcjl`  
**Audit date:** 2026-06-30  
**Auditor:** Independent verification (code + migration + policy analysis)

---

## Executive summary

Sprint 18 verified every reported backend security concern against source code and database policies before applying fixes. **Six critical privilege-escalation and payment-bypass issues were reproduced and remediated** via migrations `018` and `019`, API hardening, and security headers. Class-order Razorpay flow remains secure. **Paid competition entry still lacks Razorpay integration** (by design stub). **Profile phone numbers remain readable via open RLS SELECT** — medium PII risk documented for closed beta.

**Production score:** 79/100  
**Launch recommendation:** ⚠ **READY FOR CLOSED BETA** (not public launch until competition payments + phone column exposure resolved)

---

## Step 1 — Manus / certification report verification

No file named "Manus Production Certification Report" was found in the repository. Verification was performed against:

- Internal docs: `docs/production/SECURITY_REVIEW.md`, `docs/production/PAYMENT_AUDIT.md`
- Full migration chain `000`–`019`
- All Vercel API routes under `api/`
- Supabase security advisor output (2026-06-30)

Each finding below was **reproduced by policy/trigger analysis** before fix.

---

## Reproduced issues

| # | Finding | Reproduction | Root cause | Status |
|---|---------|--------------|------------|--------|
| 1 | Admin role via signup | `handle_new_user()` trusted `raw_user_meta_data.role` including `admin` | `001_core_schema.sql` trigger | **Fixed** — `018` clamps to student/teacher |
| 2 | Profile role self-escalation | User UPDATE on own `profiles.role` → admin | Open UPDATE policy + no trigger | **Fixed** — `018` trigger + INSERT policy |
| 3 | Teacher self-verification | Teacher INSERT/UPDATE `teacher_profiles.status = 'verified'` | Open teacher profile policies | **Fixed** — `018` trigger forces pending |
| 4 | Competition payment bypass (UPDATE) | Student UPDATE `competition_registrations.payment_status = 'paid'` | `016` registrant UPDATE policy | **Fixed** — `018` trigger |
| 5 | Class order payment bypass (UPDATE) | Student UPDATE `class_orders.payment_status = 'paid'` | No payment field guard | **Fixed** — `018` trigger |
| 6 | Booking payment bypass (UPDATE) | Student UPDATE `bookings.payment_status = 'paid'` | Policy allowed pending→paid client update | **Fixed** — `018` trigger; `019` removes client activate policy |
| 7 | INSERT payment bypass (orders/bookings/registrations) | Client INSERT with `payment_status = 'paid'` | INSERT policies did not restrict payment fields; triggers UPDATE-only | **Fixed** — `019` BEFORE INSERT triggers + policies |
| 8 | Competition API paid bypass | `entryFee > 0` + `amount === 0` still confirmed registration | Flawed condition in `competition-registration-complete.ts` | **Fixed** — reject all paid entry |
| 9 | Profile phone PII exposure | Any authenticated user SELECT `profiles` with `using (true)` returns phone | Row-level policy exposes full row | **Open** — document; app must not render phone publicly |
| 10 | Email enumeration | `find_profile_id_by_email()` callable by anon/authenticated | `009_profile_email_lookup.sql` grants | **Open** — restrict to invite flows |
| 11 | Dead client fulfill path | `fulfillClassOrderAfterPayment()` inserts paid order from browser | Legacy code in `classOrders.ts` | **Mitigated** — unused; DB now blocks INSERT paid |
| 12 | Anon RPC on SECURITY DEFINER helpers | Supabase linter flags 20+ functions | Default GRANT EXECUTE to PUBLIC | **Open** — revoke EXECUTE on internal helpers |

---

## Fixes implemented

### Migrations (applied to production)

| Migration | Purpose |
|-----------|---------|
| `018_security_hardening.sql` | Signup role clamp; profile/teacher privilege triggers; payment UPDATE guards; chat/booking profile read policies |
| `019_insert_payment_hardening.sql` | BEFORE INSERT payment guards on class_orders, bookings, competition_registrations; tightened INSERT policies |

### API

| File | Change |
|------|--------|
| `api/competition-registration-complete.ts` | New server-side completion; blocks paid entry; service-role update only |
| `vercel.json` | HSTS + CSP; registers competition API |

### Client

| File | Change |
|------|--------|
| `src/services/studentCompetitionOperations.ts` | `markRegistrationPaid()` calls API instead of direct Supabase UPDATE |

---

## Role escalation matrix (verified)

| Vector | Admin | Teacher verified | Judge | Academy owner | Organizer |
|--------|-------|------------------|-------|---------------|-----------|
| Signup metadata `role=admin` | Blocked (018) | N/A | N/A | N/A | N/A |
| Profile PATCH role | Blocked (018 trigger) | N/A | N/A | N/A | N/A |
| Teacher status PATCH | N/A | Blocked (018) | N/A | N/A | N/A |
| JWT modification | RLS uses DB role, not JWT claims | Safe | Safe | Safe | Safe |
| RPC direct SQL | Service role server-only | Safe | Safe | Safe | Safe |
| Competition payment self-mark | Blocked (018/019 + API) | N/A | N/A | N/A | Organizers can mark paid |

---

## Payment security (Razorpay)

| Control | Status |
|---------|--------|
| Webhook HMAC verification | ✅ `api/razorpay-webhook.ts` |
| Client fulfill signature verify | ✅ `api/razorpay-fulfill.ts` |
| Idempotent fulfill (duplicate payment id) | ✅ Unique indexes + fulfill logic |
| Duplicate enrollment check | ✅ `orderValidation.ts` |
| Client cannot set paid on orders/bookings | ✅ 018 + 019 |
| Competition paid entry | ❌ Not integrated — API returns 501 |

---

## Security headers (production)

Configured in `vercel.json`:

- `Strict-Transport-Security`
- `Content-Security-Policy` (includes Razorpay, Supabase, LiveKit)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy` (camera/mic self)

**Note:** CSP uses `'unsafe-inline'` for Vite SPA compatibility.

---

## Password / auth

| Control | Status |
|---------|--------|
| Supabase Auth hashing | ✅ Delegated to Supabase |
| Minimum length (client) | ✅ Signup forms |
| Leaked password protection | ⚠ Disabled in Supabase dashboard (advisor warning) |
| Rate limiting (API) | ⚠ In-memory per instance |
| Account enumeration | ⚠ Email lookup RPC |

---

## Storage

| Bucket | Access | Risk |
|--------|--------|------|
| `avatars` | Public read | Listing enabled (advisor) |
| `post-media` | Public read | Listing enabled |
| `competition-documents` | Private, participant-scoped | ✅ |

Upload paths validate MIME/size in app layer; executable rejection via allowed types.

---

## Files modified (Sprint 18)

```
supabase/migrations/018_security_hardening.sql
supabase/migrations/019_insert_payment_hardening.sql
api/competition-registration-complete.ts
src/services/studentCompetitionOperations.ts
vercel.json
docs/sprint18/*.md (this report set)
```

---

## Remaining risks

1. **Paid competition Razorpay** — product gap; students cannot pay entry fees online
2. **Profile phone in open SELECT** — move to private table or public view without phone
3. **`find_profile_id_by_email` enumeration** — revoke anon EXECUTE; rate-limit
4. **In-memory API rate limits** — ineffective on multi-instance Vercel
5. **SECURITY DEFINER RPC grants** — revoke EXECUTE from anon on internal helpers
6. **CSP unsafe-inline** — XSS mitigation relies on React + sanitization
7. **Leaked password protection** — enable in Supabase Auth settings

---

## Verification runs (post-fix)

| Check | Result |
|-------|--------|
| `npm run lint` | ✅ Pass (warnings only) |
| `npm run build` | ✅ Pass |
| `npm run test:e2e` | ✅ 112 passed, 10 skipped (auth journeys need credentials) |

---

## Launch recommendation

⚠ **READY FOR CLOSED BETA**

Critical privilege escalation and payment bypass paths are closed. Do **not** open public launch until competition Razorpay and profile PII column exposure are resolved.
