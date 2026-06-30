# Launch Checklist — Yogstra MVP

**Date:** 2026-06-30  
**Use this checklist before inviting beta users.**

---

## Code quality

- [x] `npm run lint` passes
- [x] `npm run build` passes
- [x] `npm run test:e2e` — 110 passed, 0 failed (Chromium)
- [x] Payment fulfillment idempotent and error-checked
- [x] 404 catch-all page exists
- [ ] Firefox/WebKit E2E (`npm run test:e2e:all`) — optional pre-beta

---

## Database

- [ ] All migrations `000`–`013` applied to production Supabase
- [ ] Migration 013 `enrollment_notifications` verified
- [ ] Migration 012 academy visibility applied
- [ ] RLS smoke test with anon key
- [ ] Storage buckets created and policies active
- [ ] At least one verified teacher seeded
- [ ] Platform commission % set in `platform_settings`

---

## Environment

- [ ] `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` set on Vercel
- [ ] `SUPABASE_SERVICE_ROLE_KEY` set (server only)
- [ ] `VITE_RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` set
- [ ] `RAZORPAY_WEBHOOK_SECRET` set
- [ ] Webhook URL registered in Razorpay Dashboard
- [ ] LiveKit env vars set
- [ ] Supabase Auth redirect URLs include production domain
- [ ] Email confirmation enabled (production)

---

## Payment & enrollment (critical path)

- [ ] Create Razorpay order succeeds (`POST /api/razorpay-order`)
- [ ] Test payment completes in Razorpay checkout
- [ ] Fulfillment succeeds (`POST /api/razorpay-fulfill`)
- [ ] `class_orders.payment_status = paid`
- [ ] `bookings.status = active`
- [ ] `batch_students` row for group/academy enrollments
- [ ] Student UI shows enrolled state (not "Enroll")
- [ ] Teacher dashboard shows new student
- [ ] Academy dashboard shows enrollment (group)
- [ ] Notifications appear for student/teacher
- [ ] Logout → login → enrollment persists
- [ ] Webhook retry completes side effects if client fails

---

## Workflows (manual smoke)

### Student
- [ ] Signup → login
- [ ] Browse teachers → profile → enroll → pay
- [ ] Dashboard updates without manual refresh
- [ ] Messages accessible
- [ ] Competition browse (public)

### Teacher
- [ ] Register → admin approve → login
- [ ] Complete profile
- [ ] Create program / batch
- [ ] See enrolled students after payment
- [ ] Academy workspace accessible

### Academy
- [ ] Create academy (once — no repeat prompt)
- [ ] Invite teacher
- [ ] Batches, students, attendance pages load

### Competition
- [ ] Create → publish → register (staging)
- [ ] Judge assignment → scoring
- [ ] Results → certificates

### Admin
- [ ] `/admin` dashboard
- [ ] Approve/reject teacher
- [ ] View academies, competitions, bookings
- [ ] Audit logs accessible

---

## Security

- [x] Protected routes redirect unauthenticated users
- [x] Payment signature verified server-side
- [x] XSS test passes
- [ ] Production secrets not in git
- [ ] Service role key not exposed to client

---

## Accessibility (known gaps — non-blocking)

- [ ] Color contrast fixes on listing pages (6 high findings)
- [x] Skip-to-content link on public layout
- [x] Keyboard tab order functional on landing

---

## Performance

- [x] All public routes load under 20s
- [ ] Landing duplicate queries optimized (post-beta OK)

---

## Sign-off

| Role | Name | Date | Ready |
|---|---|---|---|
| Engineering | | | ☐ |
| QA | | | ☐ |
| Product | | | ☐ |

**When all critical items are checked, proceed to beta invite.**
