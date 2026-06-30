# Security Hardening — Yogstra Beta

---

## Sprint 17 improvements

| Control | Change |
|---------|--------|
| Rate limiting | LiveKit token 60/min; payout setup 10/min |
| CORS origins | `VITE_APP_URL` + `VERCEL_URL` supported |
| Error messages | Sanitized via `formatUserFacingError` |
| Audit trail | `admin_audit_log` for teacher/payout/settings actions |
| Activity log | Payment failures recorded |

---

## Existing controls (unchanged)

- Supabase RLS on all domain tables
- Razorpay signature verification server-side
- Bearer JWT on all payment/video APIs
- Webhook HMAC validation
- Input sanitization on API routes

---

## Beta recommendations

1. Enable Supabase Auth email confirmation
2. Rotate service role key if exposed
3. Set production `RAZORPAY_WEBHOOK_SECRET`
4. Review storage bucket policies before public beta
5. Move admin email allowlist to env variable

---

## File upload

- Client-side crop/validation on profile images
- Storage RLS scoped per bucket (migration 007)

---

## Session

- Supabase auto-refresh JWT
- Logout clears session + redirects home
- Protected routes use `RequireRole` guards (UX); RLS is authoritative
