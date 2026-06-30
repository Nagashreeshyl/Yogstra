# Deployment Verification — Yogstra Beta

---

## Pre-deploy checklist

```bash
npm run lint
npm run build
npm run test:e2e
supabase db push   # through 014_beta_operations
```

---

## Environment variables

| Variable | Required |
|----------|----------|
| `VITE_SUPABASE_URL` | Yes |
| `VITE_SUPABASE_ANON_KEY` | Yes |
| `VITE_RAZORPAY_KEY_ID` | Yes |
| `SUPABASE_SERVICE_ROLE_KEY` | Yes (server) |
| `RAZORPAY_KEY_SECRET` | Yes |
| `RAZORPAY_WEBHOOK_SECRET` | Yes |
| `VITE_LIVEKIT_URL` | Yes (video) |
| `VITE_APP_URL` | Recommended (CORS) |

---

## Static assets (Sprint 17)

| File | Status |
|------|--------|
| `public/robots.txt` | Added |
| `public/sitemap.xml` | Added |
| `public/manifest.webmanifest` | Existing |
| `index.html` OG/Twitter meta | Added |
| HTTPS | Via Vercel |

---

## Supabase Auth redirects

Add production URL + `/**` to allowed redirect URLs.

---

## Post-deploy smoke

1. Landing page loads with meta tags
2. Login → dashboard
3. `/admin/system` shows green checks
4. Feedback widget submits successfully
5. Test payment in Razorpay test mode

---

## Rollback

Promote previous Vercel deployment. Database migrations are forward-only — use Supabase backup for DB rollback.
