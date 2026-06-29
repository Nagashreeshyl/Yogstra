# Production Checklist

Use before promoting to production.

---

## Build & quality

- [x] `npm run build` passes (tsc + vite)
- [x] `npm run lint` passes (warnings only — hook deps, fast-refresh)
- [ ] Automated tests — **none in repo**; manual E2E required
- [x] TypeScript strict mode enabled
- [x] No `@ts-ignore` added in sprint

---

## Environment variables

### Client (Vite)

- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_ANON_KEY`
- [ ] `VITE_RAZORPAY_KEY_ID` (payments)
- [ ] `VITE_LIVEKIT_URL` (optional client hint)

### Server (Vercel)

- [ ] `SUPABASE_SERVICE_ROLE_KEY`
- [ ] `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
- [ ] `RAZORPAY_WEBHOOK_SECRET`
- [ ] `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`

---

## Database

- [ ] Migrations `000`–`007` applied on production Supabase
- [ ] `008_upgrade_from_legacy.sql` only if upgrading existing DB
- [ ] RLS policies verified (see `docs/database/ER_DIAGRAM.md`)
- [ ] Storage buckets created (`007_realtime_storage_admin.sql`)

---

## Security

- [ ] Service role key not in client bundle
- [ ] Production CORS origin matches deploy URL
- [ ] Admin users seeded via Supabase auth + profiles role
- [ ] Razorpay webhook endpoint configured with secret

---

## Performance

- [ ] LiveKit chunk loads only on video routes (verify Network tab)
- [ ] Lighthouse performance ≥ 80 on Explore + student dashboard
- [ ] PWA service worker registered (`/sw.js`)

---

## Accessibility

- [x] Skip link present on dashboard shells
- [ ] Manual keyboard pass on auth, registration wizard, judge session
- [ ] Color contrast spot-check on primary CTAs

---

## Flows (staging)

- [ ] Student auth + dashboard load
- [ ] Teacher registration → admin verify → dashboard
- [ ] Class booking + live room (LiveKit)
- [ ] Competition registration wizard complete
- [ ] Judge scoring + offline sync
- [ ] Organizer create competition + assign judge
- [ ] Certificate download / QR display
- [ ] Admin payout review

---

## Known limitations

| Item | Impact |
|---|---|
| `/dashboard/academy/*` | Placeholder UI |
| `/dashboard/results`, `/rankings`, `/certificates` (foundation) | Placeholder — student routes live |
| Public `/competitions` | Static mock data |
| No automated E2E tests | Manual QA required |
| In-memory API rate limit | Resets on serverless cold start |

---

## Deploy

- [ ] `vercel deploy --prod` or CI promotion
- [ ] Smoke test production URL
- [ ] Monitor Supabase logs for RLS violations
- [ ] Monitor Razorpay webhook deliveries
