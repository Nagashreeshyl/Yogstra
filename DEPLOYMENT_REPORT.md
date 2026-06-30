# Deployment Report — Yogstra Production

**Date:** 2026-06-30  
**Status:** ✅ **SUCCESS**

---

## GitHub

| Item | Value |
|------|-------|
| Repository | [https://github.com/Nagashreeshyl/Yogstra](https://github.com/Nagashreeshyl/Yogstra) |
| Default branch | `main` |
| Latest commit | `18a5e6c` — docs: update README for Yogstra MVP production deployment |
| Branches pushed | `main`, `feature/v2-app-shell` |
| Description | Premium yoga ecosystem — teachers, academies, competitions, and live classes |
| Topics | yoga, react, supabase, vercel, razorpay |

---

## Vercel

| Item | Value |
|------|-------|
| Project | `yogstra` (naga-shreeshyls-projects) |
| Project ID | `prj_tTch24MG18CqTJgkuVelrJpLwSuk` |
| Production URL | **https://yogstra.vercel.app** |
| Deployment URL | https://yogstra-oiedziogi-naga-shreeshyls-projects.vercel.app |
| Deployment ID | `dpl_9ChPGAN2PAhx1dtPToB2oodiFfGV` |
| Build duration | ~53s (Vercel) / ~36s (Vite build step) |
| Framework | Vite (auto-detected) |
| Output | `dist/` |
| Build command | `npm run build` |
| Install command | `npm install` |

### Serverless functions deployed

- `api/livekit-token`
- `api/razorpay-order`
- `api/razorpay-fulfill`
- `api/razorpay-webhook`
- `api/teacher-payout-setup`

---

## Pre-deploy validation

| Check | Result |
|-------|--------|
| Working tree clean (pre-merge) | ✅ |
| `npm install` | ✅ 0 vulnerabilities |
| `npm run lint` | ✅ Pass (warnings only) |
| `npm run build` | ✅ Pass |
| `npm run test:e2e` (local) | ✅ 112 passed, 10 skipped |
| TODO/FIXME in src | ✅ None found |
| localhost hardcoded in src | ✅ None found |

---

## Environment variables verified (Vercel)

| Variable | Production | Preview | Development |
|----------|:----------:|:-------:|:-----------:|
| `VITE_SUPABASE_URL` | ✅ | ✅ | ✅ |
| `VITE_SUPABASE_ANON_KEY` | ✅ | ✅ | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | ✅ | ✅ | — |
| `VITE_RAZORPAY_KEY_ID` | ✅ | ✅ | ✅ |
| `RAZORPAY_KEY_ID` | ✅ | ✅ | ✅ |
| `RAZORPAY_KEY_SECRET` | ✅ | ✅ | ✅ |
| `VITE_LIVEKIT_URL` | ✅ | ✅ | ✅ |
| `LIVEKIT_URL` | ✅ | ✅ | ✅ |
| `LIVEKIT_API_KEY` | ✅ | ✅ | ✅ |
| `LIVEKIT_API_SECRET` | ✅ | ✅ | ✅ |
| `VITE_APP_URL` | ✅ | ✅ | ✅ |

### ⚠️ Missing / not in local `.env.local`

| Variable | Impact |
|----------|--------|
| `RAZORPAY_WEBHOOK_SECRET` | Webhook backup fulfillment will reject unsigned events until set in Vercel Dashboard |

---

## Production smoke test results

**Target:** https://yogstra.vercel.app

### HTTP status (curl)

| Route | Status |
|-------|--------|
| `/` | 200 |
| `/discover` | 200 |
| `/teachers` | 200 |
| `/academies` | 200 |
| `/competitions` | 200 |
| `/community` | 200 |
| `/help` | 200 |
| `/auth/login` | 200 |
| `/about` | 200 |
| `/this-does-not-exist-xyz` | 200 (SPA + NotFound) |
| `/robots.txt` | 200 |
| `/sitemap.xml` | 200 |

### Playwright (production, public routes)

**18/18 passed** against `QA_BASE_URL=https://yogstra.vercel.app`

- All public pages load
- Navigation links work
- 404 page renders content

### Health & SEO

| Check | Result |
|-------|--------|
| Open Graph meta tags | ✅ Present |
| Twitter card meta | ✅ Present |
| Canonical URL | ✅ `https://yogstra.vercel.app/` |
| Security headers (`X-Content-Type-Options`, `X-Frame-Options`, `Referrer-Policy`) | ✅ Via `vercel.json` |
| `robots.txt` | ✅ |
| `sitemap.xml` | ✅ |
| PWA manifest | ✅ |

---

## Remaining warnings

1. **`RAZORPAY_WEBHOOK_SECRET`** — add in Vercel Dashboard → Settings → Environment Variables (Production + Preview) for webhook backup
2. **Supabase migrations** — ensure `000`–`014` applied on production Supabase project
3. **Supabase Auth redirect URLs** — add `https://yogstra.vercel.app/**`
4. **Razorpay webhook URL** — register `https://yogstra.vercel.app/api/razorpay-webhook`
5. **Chunk size** — LiveKit bundle ~603 KB (lazy-loaded; non-blocking)
6. **Accessibility** — color contrast issues documented in `docs/qa/ACCESSIBILITY_REPORT.md`

---

## Recommended post-deployment checks

- [ ] Create test student account on production
- [ ] Complete Razorpay test payment end-to-end
- [ ] Verify teacher dashboard shows enrolled student
- [ ] Confirm admin `/admin/system` health checks green
- [ ] Set `RAZORPAY_WEBHOOK_SECRET` in Vercel
- [ ] Enable Supabase email confirmation for production
- [ ] Connect GitHub auto-deploy in Vercel Dashboard (if not already linked)

---

## Summary

Yogstra MVP is **live at https://yogstra.vercel.app**. Code is on GitHub (`main` at `18a5e6c`), Vercel production deployment is **Ready**, public routes pass smoke tests, and core environment variables are configured.
