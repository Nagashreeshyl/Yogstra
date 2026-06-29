# Production Deployment Guide — Sprint 14

**Date:** 2026-06-30  
**Target platform:** Vercel (SPA + serverless API)  
**Database:** Supabase (Postgres, Auth, Storage, Realtime)

---

## Prerequisites

- Supabase project (production)
- Vercel account linked to Git repository
- Razorpay account (test → live when ready)
- LiveKit Cloud project (video classes)
- Custom domain (optional)

---

## 1. Environment variables

Copy from `.env.example` and set in **Vercel Project Settings → Environment Variables**.

### Client (VITE_ prefix — exposed to browser)

| Variable | Required | Description |
|---|---|---|
| `VITE_SUPABASE_URL` | Yes | `https://<project-ref>.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Yes | Supabase anon/public key |
| `VITE_RAZORPAY_KEY_ID` | Yes | `rzp_live_*` for production |
| `VITE_LIVEKIT_URL` | Yes | `wss://<project>.livekit.cloud` |

### Server (never expose to client)

| Variable | Required | Description |
|---|---|---|
| `SUPABASE_SERVICE_ROLE_KEY` | Yes | Webhook fulfillment, admin ops |
| `RAZORPAY_KEY_ID` | Yes | Server-side order creation |
| `RAZORPAY_KEY_SECRET` | Yes | Payment signature verification |
| `RAZORPAY_WEBHOOK_SECRET` | Yes | Webhook HMAC validation |
| `LIVEKIT_API_KEY` | Yes | Token generation |
| `LIVEKIT_API_SECRET` | Yes | Token generation |
| `LIVEKIT_URL` | Yes | Same as VITE_LIVEKIT_URL |

### Environment scoping

| Environment | Razorpay | Supabase |
|---|---|---|
| Preview | Test keys | Staging project (recommended) |
| Production | Live keys | Production project |

---

## 2. Supabase configuration

### Apply migrations

```bash
cd Yogstra
supabase link --project-ref <your-project-ref>
supabase db push
```

Verify all 13 migrations (`000`–`011`) applied. Critical: `011_academy_bootstrap_rls.sql` for academy creation.

### Auth settings (Dashboard → Authentication)

| Setting | Value |
|---|---|
| Site URL | `https://your-domain.com` |
| Redirect URLs | `https://your-domain.com/**`, `http://localhost:5173/**` (dev) |
| Email confirmations | Enable for production |
| Password requirements | Minimum 8 characters (adjust as needed) |

### Email templates

Customize in **Authentication → Email Templates**:

- Confirm signup
- Reset password
- Magic link (if enabled)

Brand with Yogstra logo and support contact.

### Storage buckets

Created by migration `007`:

| Bucket | Public | Purpose |
|---|---|---|
| `avatars` | Yes | Profile photos |
| `post-media` | Yes | Community uploads |

**Future buckets (manual create when needed):**

- `academy-assets` — logos, banners
- `competition-assets` — competition media
- `certificates` — generated PDFs

---

## 3. Razorpay configuration

### Dashboard setup

1. Activate **Route** for teacher payouts
2. Configure webhook URL: `https://your-domain.com/api/razorpay-webhook`
3. Enable events: `payment.captured`, `payment.failed`, `refund.created`
4. Copy webhook secret to `RAZORPAY_WEBHOOK_SECRET`

### Test → live cutover

1. Replace test key IDs/secrets with live keys in Vercel production env
2. Verify webhook delivers to production URL
3. Run test transaction with small amount

### Platform commission

Set in Supabase `platform_settings` table (seeded in migrations). Default commission rate applied in `server/fulfillPayment.ts`.

---

## 4. LiveKit configuration

1. Create project at [cloud.livekit.io](https://cloud.livekit.io)
2. Copy API key, secret, and WebSocket URL to env vars
3. Video rooms created dynamically per class session
4. Token endpoint: `/api/livekit-token` (validates booking access before issuing token)

---

## 5. Vercel deployment

### Build settings

| Setting | Value |
|---|---|
| Framework | Vite |
| Build command | `npm run build` |
| Output directory | `dist` |
| Install command | `npm ci` |

### API functions

Defined in `vercel.json`:

- `api/livekit-token.ts`
- `api/razorpay-order.ts`
- `api/razorpay-fulfill.ts`
- `api/razorpay-webhook.ts`
- `api/teacher-payout-setup.ts`

Each includes `server/**` via `includeFiles`.

### Security headers

Already configured in `vercel.json`:

- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera, microphone, display-capture (self)`

### SPA routing

Rewrite rule sends all non-`/api/*` requests to `index.html`.

---

## 6. Domain configuration

1. Add custom domain in Vercel project settings
2. Update Supabase Auth Site URL and redirect URLs
3. Update Razorpay webhook URL if domain changes
4. Update CORS origin in `server/apiSecurity.ts` if hardcoded

---

## 7. CORS

Production API routes restrict origin to deployment URL via `server/apiSecurity.ts`. Update when adding custom domain or preview deployments.

---

## 8. Rate limits

Current: in-memory per-IP limiter on Vercel functions.

**Production recommendation:** Upstash Redis rate limiter for:

- `/api/razorpay-order`
- `/api/livekit-token`
- `/api/teacher-payout-setup`

---

## 9. Pre-deploy checklist

### Code quality

- [ ] `npm run lint` passes
- [ ] `npm run build` passes
- [ ] All env vars set in Vercel

### Supabase

- [ ] All migrations applied
- [ ] RLS verified (`rowsecurity = true` on all tables)
- [ ] Storage buckets exist
- [ ] Auth redirect URLs configured
- [ ] At least one admin user (`profiles.role = 'admin'`)

### Payments

- [ ] Razorpay live keys in production env
- [ ] Webhook URL registered and secret set
- [ ] Test class booking end-to-end
- [ ] Competition fees disabled OR Razorpay integrated (currently stub)

### Video

- [ ] LiveKit credentials set
- [ ] Test video class token issuance

### Security

- [ ] Service role key not in client bundle
- [ ] Admin allowlist reviewed (`platformAdmin.ts`)

---

## 10. Deployment steps

```bash
# 1. Verify locally
npm run lint
npm run build

# 2. Push to main/production branch
git push origin feature/v2-app-shell  # or merge to main

# 3. Vercel auto-deploys on push (or manual deploy)
vercel --prod

# 4. Smoke test
# - Sign up as student
# - Sign up as teacher
# - Create academy (teacher workspace)
# - Book a class (test payment)
# - Join video class (if scheduled)
# - Register for free competition
```

---

## 11. Rollback strategy

### Application rollback

1. **Vercel:** Deployments → select previous deployment → Promote to Production
2. Instant rollback; no database changes required

### Database rollback

Supabase migrations are forward-only. For schema rollback:

1. Write compensating migration (reverse DDL)
2. Apply via `supabase db push` or Dashboard SQL
3. **Never** delete production data without backup

### Payment rollback

- Razorpay refunds via Dashboard or API
- Update `class_orders.status` and `payouts` manually if webhook missed

---

## 12. Backup strategy

| Asset | Method | Frequency |
|---|---|---|
| Postgres | Supabase automatic daily backups (Pro plan) | Daily |
| Storage | Supabase bucket replication or periodic export | Weekly |
| Env vars | Document in secure vault (1Password, etc.) | On change |
| Code | Git repository | Continuous |

**Recommendation:** Enable Supabase Point-in-Time Recovery (PITR) on Pro plan before launch.

---

## 13. Monitoring recommendations

| Tool | Purpose |
|---|---|
| Vercel Analytics | Web vitals, traffic |
| Vercel Logs | API function errors |
| Supabase Dashboard | DB performance, auth logs, RLS failures |
| Razorpay Dashboard | Payment success rate, webhook delivery |
| Sentry (recommended) | Client + server exception tracking |
| Uptime monitor (Better Uptime, etc.) | `/` health check |

### Key alerts

- API 5xx rate > 1%
- Razorpay webhook failures
- Supabase connection errors
- Auth signup failure spike

---

## 14. Logging recommendations

| Layer | What to log | What NOT to log |
|---|---|---|
| Client | Error boundaries, unhandled rejections | PII, tokens |
| API routes | Request ID, status, latency | Full JWT, payment details |
| Webhooks | Event type, order ID, outcome | Card numbers |
| Supabase | Use Dashboard logs | — |

Structured JSON logs in Vercel Functions aid searchability.

---

## 15. Error reporting recommendations

1. Add **Sentry** to Vite app (`@sentry/react`) and API routes
2. Scrub `email`, `phone`, `authorization` headers before send
3. Tag releases with git SHA for regression tracking
4. Set up Slack/email alerts for new issues

---

## 16. Post-launch validation

| Test | Expected |
|---|---|
| Student signup + login | Profile created, dashboard loads |
| Teacher signup | Pending verification state |
| Admin login | Admin console accessible |
| Academy create | Owner membership + settings created |
| Class booking + payment | Order fulfilled, booking confirmed |
| Competition registration | Registration row in DB |
| Certificate notification | Only when certificate issued |
| Logout | Session cleared, redirect to public |
| Expired session | Re-auth prompt |

---

## 17. Known MVP limitations at launch

Document for support team:

1. Competition entry fees — DB flag only, no Razorpay
2. Student practice card — template text, not coach-assigned content
3. Email/push notifications — in-app only; preferences localStorage
4. Academy/competition asset uploads — URL fields only
5. Certificate PDFs — metadata only, no PDF generation
6. Admin audit log — recent activity feed, not immutable audit trail

---

## Support contacts template

| Service | Dashboard | Support |
|---|---|---|
| Vercel | vercel.com/dashboard | vercel.com/support |
| Supabase | supabase.com/dashboard | supabase.com/support |
| Razorpay | dashboard.razorpay.com | razorpay.com/support |
| LiveKit | cloud.livekit.io | livekit.io/support |

---

## Quick reference — file locations

| Concern | Path |
|---|---|
| Env template | `.env.example` |
| Vercel config | `vercel.json` |
| Migrations | `supabase/migrations/` |
| API security | `server/apiSecurity.ts` |
| Payment fulfillment | `server/fulfillPayment.ts` |
| Platform admin | `src/utils/platformAdmin.ts` |
| Infrastructure audit | `docs/production/FINAL_INFRASTRUCTURE_AUDIT.md` |
