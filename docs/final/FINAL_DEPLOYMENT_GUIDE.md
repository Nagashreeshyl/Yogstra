# Final Deployment Guide — Yogstra MVP

**Date:** 2026-06-30  
**Platform:** Vercel + Supabase + Razorpay + LiveKit

---

## 1. Prerequisites

- Git repository connected to Vercel
- Supabase production project
- Razorpay account (live mode for production)
- LiveKit Cloud project (video classes)
- Custom domain (optional)

---

## 2. Supabase setup

```bash
cd Yogstra
supabase link --project-ref <PROJECT_REF>
supabase db push   # Applies migrations 000–013
```

### Auth (Dashboard → Authentication)

| Setting | Value |
|---|---|
| Site URL | `https://your-domain.com` |
| Redirect URLs | `https://your-domain.com/**`, `http://localhost:5173/**` |
| Email confirmations | Enable for production |

### Storage buckets (verify in Dashboard)

- Profile avatars
- Academy logos / covers
- Competition banners
- Community post images
- Certificate PDFs

### Realtime

Ensure tables are in publication (migration 007). Verify `batch_students`, `class_orders`, `enrollment_notifications` enabled.

---

## 3. Vercel environment variables

### Client (`VITE_` prefix)

```
VITE_SUPABASE_URL=https://<ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon_key>
VITE_RAZORPAY_KEY_ID=rzp_live_...
VITE_LIVEKIT_URL=wss://<project>.livekit.cloud
```

### Server (never expose to browser)

```
SUPABASE_SERVICE_ROLE_KEY=<service_role>
RAZORPAY_KEY_ID=rzp_live_...
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<webhook_secret>
LIVEKIT_API_KEY=<key>
LIVEKIT_API_SECRET=<secret>
LIVEKIT_URL=wss://<project>.livekit.cloud
```

Scope preview environments to **test** Razorpay keys and staging Supabase.

---

## 4. Razorpay configuration

### Webhook (Dashboard → Webhooks)

| Event | Endpoint |
|---|---|
| `payment.captured` | `https://your-domain.com/api/razorpay-webhook` |
| `transfer.processed` | Same endpoint |

Set `RAZORPAY_WEBHOOK_SECRET` to match.

### Route transfers (optional)

If using Razorpay Route for teacher payouts, ensure teachers complete payout onboarding (`teacher_payout_private`).

---

## 5. Deploy

```bash
# Push to main or create release branch
git push origin feature/v2-app-shell

# Vercel auto-deploys on push, or:
vercel --prod
```

### Verify build locally first

```bash
npm run lint
npm run build
npm run test:e2e
```

---

## 6. Post-deploy smoke test

1. Open production URL — landing loads
2. Create student account → login → dashboard
3. Browse teachers → open profile
4. Initiate enrollment → Razorpay test/live payment
5. Verify:
   - Student sees "Enrolled" on teacher profile
   - `class_orders.payment_status = paid` in Supabase
   - `bookings` row exists with `status = active`
   - Teacher dashboard shows student
   - `enrollment_notifications` rows created (migration 013)
6. Logout → login → enrollment persists
7. Admin login → `/admin` loads

---

## 7. Rollback

| Layer | Action |
|---|---|
| Vercel | Promote previous deployment in Dashboard |
| Database | Migrations are forward-only; restore from Supabase backup if needed |
| Razorpay | Webhook retries failed fulfillments automatically |

---

## 8. Monitoring

- Vercel Functions logs: `/api/razorpay-fulfill`, `/api/razorpay-webhook`
- Supabase Dashboard → Logs → API errors
- Set up alerts for 500 responses on payment endpoints

---

## 9. QA credentials (optional, for CI/staging)

Copy `.env.qa.example` → `.env.qa`:

```
QA_STUDENT_EMAIL=...
QA_STUDENT_PASSWORD=...
QA_TEACHER_EMAIL=...
QA_ADMIN_EMAIL=...
```

Run: `npm run test:e2e`

---

## Related docs

- `docs/production/PRODUCTION_DEPLOYMENT_GUIDE.md` — detailed Sprint 14 guide
- `docs/production/ENROLLMENT_FLOW_AUDIT.md` — payment trace
- `LAUNCH_CHECKLIST.md` — pre-launch checklist
