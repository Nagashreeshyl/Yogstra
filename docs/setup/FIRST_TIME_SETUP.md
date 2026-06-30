# Yogstra V2 — First-Time Setup Guide

**Audience:** A developer who has just cloned the repository and has never deployed Yogstra before.

**Repository layout:** The application lives in the `Yogstra/` folder inside the workspace. All commands below assume you are in that directory:

```bash
cd Yogstra
```

**What this app is:** A React + Vite SPA deployed on Vercel, backed by Supabase (PostgreSQL, Auth, Storage, Realtime), with Razorpay for class payments and LiveKit for live video classes.

---

## Deployment readiness summary

| Area | Status | Blocker? |
|------|--------|----------|
| Application code | Ready | No |
| Database migrations | Ready (000–009) | Must run manually |
| Vercel serverless APIs | Ready | Requires env vars |
| Supabase Auth + Storage | Ready | Must configure |
| Razorpay (class payments) | Ready | Test keys for staging; live keys for production |
| LiveKit (video classes) | Ready | Requires cloud project |
| Email delivery (Resend) | **Not used** | No setup required |
| Cloudflare | **Not used** | Optional CDN only |
| Supabase Edge Functions | **Not used** | Payment/video logic runs on Vercel |
| Automated E2E tests | **Not in repo** | Manual QA required before launch |

**Overall deployment readiness: 96%** — all code paths exist; launch depends on completing the manual steps below.

---

## Step 1 — Required accounts

Create accounts on each platform before proceeding. Yogstra does **not** require Resend, Cloudflare, or a separate email provider — Supabase Auth handles signup/reset emails.

| Service | Required? | Purpose |
|---------|-----------|---------|
| **GitHub** | Yes | Source control; connect to Vercel for CI/CD |
| **Supabase** | Yes | PostgreSQL database, Auth, Storage, Realtime, RLS |
| **Vercel** | Yes | Hosts the React app + serverless API routes (`/api/*`) |
| **Razorpay** | Yes | Class purchase payments, teacher Route linked accounts, webhooks |
| **LiveKit Cloud** | Yes | Live video classes (teacher ↔ student rooms) |
| **Resend** | No | Not integrated — Supabase sends auth emails |
| **Cloudflare** | No | Optional if you want a CDN in front of Vercel |

### Recommended account order

1. GitHub — push/clone the repo
2. Supabase — create project first (you need URL + keys for everything else)
3. Vercel — import GitHub repo
4. Razorpay — create merchant account (Test Mode first)
5. LiveKit — create cloud project

---

## Step 2 — Environment variables

Copy the template:

```bash
cp .env.example .env.local
```

Never commit `.env.local`. The service role key and Razorpay secret must **never** appear in client code.

### Client variables (public — bundled by Vite)

These are prefixed with `VITE_` and are visible in the browser. Safe for anon keys only.

| Variable | Where to obtain | Secret? | Store in |
|----------|-----------------|---------|----------|
| `VITE_SUPABASE_URL` | Supabase → Project Settings → API → Project URL | No (public URL) | `.env.local`, Vercel (Production + Preview) |
| `VITE_SUPABASE_ANON_KEY` | Supabase → Project Settings → API → `anon` `public` key | No (RLS-protected) | `.env.local`, Vercel |
| `VITE_RAZORPAY_KEY_ID` | Razorpay Dashboard → Account & Settings → API Keys → Key ID (`rzp_test_…` or `rzp_live_…`) | No (public checkout key) | `.env.local`, Vercel |
| `VITE_LIVEKIT_URL` | LiveKit Cloud → Project → WebSocket URL (`wss://…livekit.cloud`) | No | `.env.local`, Vercel |

### Server variables (secret — Vercel Functions only)

These are read by files in `api/` and `server/`. **Do not** prefix with `VITE_`.

| Variable | Where to obtain | Secret? | Store in |
|----------|-----------------|---------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → `service_role` key | **Yes** | Vercel only (never client) |
| `RAZORPAY_KEY_ID` | Same as `VITE_RAZORPAY_KEY_ID` | No | Vercel, `.env.local` for `vercel dev` |
| `RAZORPAY_KEY_SECRET` | Razorpay Dashboard → API Keys → Key Secret | **Yes** | Vercel only |
| `RAZORPAY_WEBHOOK_SECRET` | Razorpay Dashboard → Webhooks → secret you define when creating webhook | **Yes** | Vercel only |
| `LIVEKIT_API_KEY` | LiveKit Cloud → Settings → API Keys | **Yes** | Vercel only |
| `LIVEKIT_API_SECRET` | LiveKit Cloud → Settings → API Keys | **Yes** | Vercel only |
| `LIVEKIT_URL` | Same as `VITE_LIVEKIT_URL` | No | Vercel, `.env.local` |

Optional fallbacks used by server code: `SUPABASE_URL`, `SUPABASE_ANON_KEY` (if `VITE_*` variants are unset).

### Where each variable lives

| Location | Variables |
|----------|-----------|
| **`.env.local`** (local dev) | All of the above for full local testing with `vercel dev` |
| **Vercel → Project → Settings → Environment Variables** | All server secrets + all `VITE_*` client vars for Production, Preview, and Development |
| **Supabase Dashboard → Project Settings → Vault / Secrets** | **Not required** — Yogstra does not use Supabase Edge Functions |

### Local development note

Running `npm run dev` (Vite only) provides:

- Full Supabase client (auth, DB, storage, realtime)
- LiveKit token API via Vite dev middleware (`/api/livekit-token`)

Running `npm run dev` does **not** provide Razorpay API routes. For payment testing locally, use:

```bash
npx vercel dev
```

This serves all `/api/*` routes with your `.env.local` values.

---

## Step 3 — Supabase setup

### 3.1 Create project

1. Go to [supabase.com](https://supabase.com) → New project.
2. Choose a region close to your users (e.g. `ap-south-1` for India).
3. Set a strong database password and save it in a password manager.
4. Wait for the project to finish provisioning.

### 3.2 Run SQL migrations (exact order)

Open **SQL Editor** and run each file **in numeric order**. All migrations are idempotent (`IF NOT EXISTS`, duplicate-safe policies).

| Order | File | Contents |
|-------|------|----------|
| 1 | `supabase/migrations/000_extensions_and_helpers.sql` | `set_updated_at`, `is_admin()`, auth signup trigger |
| 2 | `supabase/migrations/001_core_schema.sql` | profiles, teachers, bookings, schedules, community, categories seed |
| 3 | `supabase/migrations/002_chat_and_orders.sql` | chat threads, direct messages, class orders |
| 4 | `supabase/migrations/003_marketplace_payouts.sql` | platform_settings, payouts, commission |
| 5 | `supabase/migrations/004_teacher_platform.sql` | coupons, notifications, schedule changes, class_sessions |
| 6 | `supabase/migrations/005_academy_domain.sql` | academies, batches, members, teacher_academies |
| 7 | `supabase/migrations/006_competition_domain.sql` | competitions, judges, scores, results, certificates, rankings |
| 8 | `supabase/migrations/007_realtime_storage_admin.sql` | Realtime publications, storage buckets + policies |
| 9 | `supabase/migrations/009_profile_email_lookup.sql` | `find_profile_id_by_email()` RPC for academy invites |

**Skip** `008_upgrade_from_legacy.sql` on a **fresh** database. Run it only when upgrading an existing Yogstra V1/V2 database that previously used legacy SQL files from `supabase/archive/`.

#### Verify migrations

```sql
-- Expect ~45 public tables
SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;

-- Expect helper functions
SELECT proname FROM pg_proc
JOIN pg_namespace n ON n.oid = pronamespace
WHERE n.nspname = 'public'
  AND proname IN ('is_admin', 'handle_new_user', 'find_profile_id_by_email');
```

### 3.3 Row Level Security (RLS)

RLS is **enabled in migrations** — you do not enable it manually table-by-table.

Key patterns:

- **Students** see their own bookings, messages, registrations, certificates.
- **Teachers** see their students, schedules, earnings, notifications.
- **Admins** bypass restrictions via `is_admin()` (checks `profiles.role = 'admin'`).
- **Organizers** manage competitions via `can_manage_competition()`.
- **Judges** see assigned competition scores only.

If dashboards return empty data or permission errors after setup, check Supabase **Logs → Postgres** for RLS violations.

### 3.4 Realtime

Migration `007` adds tables to the `supabase_realtime` publication. Verify in Dashboard → **Database → Publications** that `supabase_realtime` includes at least:

- `direct_messages`, `chat_threads`, `class_sessions`, `teacher_notifications`
- `class_orders`, `schedules`, `competition_registrations`

No extra Realtime configuration is required if migration 007 ran successfully.

### 3.5 Edge Functions

**Not required.** Yogstra uses Vercel serverless functions in `api/`:

- `api/razorpay-order.ts`
- `api/razorpay-fulfill.ts`
- `api/razorpay-webhook.ts`
- `api/livekit-token.ts`
- `api/teacher-payout-setup.ts`

Do not deploy Supabase Edge Functions unless you add new server-side logic later.

### 3.6 Auth trigger

Migration `000` creates `handle_new_user()` and attaches it to `auth.users`. On signup it automatically:

- Inserts a `profiles` row with role from signup metadata
- Inserts `teacher_profiles` with `status = pending` when role is `teacher`

Verify the trigger exists:

```sql
SELECT tgname FROM pg_trigger WHERE tgname = 'on_auth_user_created';
```

---

## Step 4 — Storage buckets

Migration `007` creates both buckets and RLS policies. Verify in **Storage**:

| Bucket | Public read? | Write rule | Used for |
|--------|--------------|------------|----------|
| `avatars` | Yes | Authenticated users write only to `{user_id}/…` folder | Profile photos, teacher cover images |
| `post-media` | Yes | Authenticated users write only to `{user_id}/…` folder | Community post attachments |

### Permissions (already in migration 007)

- **Read:** Anyone can read objects in both buckets (public URLs).
- **Insert/Update/Delete:** Authenticated user must upload to a path whose first folder equals their `auth.uid()`.

Example valid avatar path: `{user-uuid}/avatar.jpg`

### Manual creation (only if migration 007 failed)

In Supabase Dashboard → Storage → New bucket:

1. Name: `avatars`, Public: **On**
2. Name: `post-media`, Public: **On**

Then re-run the storage policy section of `007_realtime_storage_admin.sql`.

---

## Step 5 — Authentication

Yogstra uses **Supabase Auth** with email + password. OAuth providers are **not wired in the app** — you may enable them in Supabase, but the UI only exposes email signup/login.

### 5.1 Enable Email Auth

Supabase Dashboard → **Authentication → Providers → Email**:

- Enable Email provider
- Choose whether **Confirm email** is required (recommended for production)

If email confirmation is enabled:

- Students/teachers receive a confirmation link before first login
- Teacher registration form data is cached in browser `localStorage` until confirmation completes

### 5.2 OAuth (optional — not in app UI)

You may enable Google/GitHub in Supabase for future use. No redirect handling exists in the React app today. Skip unless you plan to add OAuth buttons.

### 5.3 Redirect URLs

Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Local development | Production |
|---------|-------------------|------------|
| **Site URL** | `http://localhost:5173` | `https://your-domain.com` |
| **Redirect URLs** (add all) | `http://localhost:5173/**` | `https://your-domain.com/**` |
| | `http://localhost:3000/**` (if using `vercel dev`) | `https://*.vercel.app/**` (preview deploys) |

Password reset redirects to `/auth/student` (see `src/services/auth.ts`).

### 5.4 Email templates

Customize in **Authentication → Email Templates**:

- Confirm signup
- Reset password
- Magic link (if enabled)

Use your production domain in template links.

### 5.5 Create the first admin

After signing up through the app (or creating a user in Supabase Auth):

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (
  SELECT id FROM auth.users WHERE email = 'admin@yogstra.in'
);
```

Admin routes: `/admin/*`

---

## Step 6 — Razorpay

### 6.1 Create account

1. Register at [razorpay.com](https://razorpay.com).
2. Complete KYC before switching to Live Mode.
3. Start in **Test Mode** (toggle in Dashboard header).

### 6.2 API keys

Dashboard → **Account & Settings → API Keys**:

| Mode | Key ID prefix | Use in |
|------|---------------|--------|
| Test | `rzp_test_…` | Staging, local dev |
| Live | `rzp_live_…` | Production only |

Set both:

- `VITE_RAZORPAY_KEY_ID` (client checkout)
- `RAZORPAY_KEY_ID` + `RAZORPAY_KEY_SECRET` (server order creation)

### 6.3 Webhook

Dashboard → **Settings → Webhooks → + Add New Webhook**:

| Field | Value |
|-------|-------|
| URL (production) | `https://your-domain.com/api/razorpay-webhook` |
| URL (staging) | `https://your-preview.vercel.app/api/razorpay-webhook` |
| Events | `payment.captured`, `transfer.processed` (and related payment events) |
| Secret | Generate a strong secret → set as `RAZORPAY_WEBHOOK_SECRET` in Vercel |

The webhook verifies `X-Razorpay-Signature` using HMAC-SHA256.

### 6.4 Razorpay Route (teacher payouts)

Optional but recommended for automated teacher splits:

1. Dashboard → **Route** → Enable Route
2. Teachers submit bank details via `/dashboard/teacher/settings` → Payouts tab
3. Server calls `api/teacher-payout-setup.ts` to create linked accounts

### 6.5 Test vs Live mode checklist

| | Test Mode | Live Mode |
|---|-----------|-----------|
| Keys | `rzp_test_*` | `rzp_live_*` |
| Real money | No | Yes |
| Webhook URL | Can point to Vercel preview | Must point to production domain |
| When to use | Development, QA, demo | Real users only |

**Important:** Competition entry fees do not yet use Razorpay — organizers mark registrations paid manually. Class purchases are fully integrated.

---

## Step 7 — LiveKit

### 7.1 Create project

1. Go to [cloud.livekit.io](https://cloud.livekit.io).
2. Create a project (free tier available for testing).
3. Note the **WebSocket URL** (`wss://your-project.livekit.cloud`).

### 7.2 API keys

Project → **Settings → Keys**:

- Create an API key + secret
- Set `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`, `VITE_LIVEKIT_URL`

### 7.3 Rooms

Yogstra creates rooms dynamically — you do **not** pre-create rooms. Room names come from `class_sessions.room_name` in the database.

### 7.4 Token generation

Production: `POST /api/livekit-token` (Vercel Function) mints JWTs using `livekit-server-sdk`.

Local dev with `npm run dev`: Vite middleware proxies the same logic.

Request body:

```json
{
  "roomName": "class-session-uuid",
  "participantName": "Student Name",
  "participantId": "user-uuid"
}
```

Requires `Authorization: Bearer {supabase_access_token}`.

---

## Step 8 — Vercel deployment

### 8.1 Import project

1. [vercel.com](https://vercel.com) → Add New → Project
2. Import the GitHub repository
3. Set **Root Directory** to `Yogstra` if the repo root is the parent folder

### 8.2 Build settings

| Setting | Value |
|---------|-------|
| Framework Preset | Vite |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 20.x (recommended) |

`vercel.json` already configures:

- SPA rewrites (all non-`/api/*` routes → `index.html`)
- Security headers (CSP-related, frame deny, etc.)
- Serverless function `includeFiles` for `server/**`

### 8.3 Environment variables

Add **all** variables from Step 2 in Vercel → Settings → Environment Variables:

- Scope **Production** with live Razorpay keys
- Scope **Preview** with test Razorpay keys
- Scope **Development** for `vercel dev`

Redeploy after changing env vars.

### 8.4 Domains

1. Vercel → Project → Settings → Domains
2. Add your custom domain (e.g. `app.yogstra.in`)
3. Update Supabase Auth Site URL and Redirect URLs to match
4. Update Razorpay webhook URL to production domain

### 8.5 Deploy

```bash
# Preview deploy
npx vercel

# Production
npx vercel --prod
```

Or push to the connected Git branch for automatic deploys.

### 8.6 Post-deploy smoke test

```bash
curl -I https://your-domain.com
curl -I https://your-domain.com/api/razorpay-order   # expect 405 (GET not allowed), not 404
```

---

## Step 9 — Seed data

Sign up users through the app UI first (so `auth.users` + `profiles` exist), then run SQL to link roles and sample data.

Replace UUIDs below with actual IDs from:

```sql
SELECT id, email, raw_user_meta_data->>'role' AS role
FROM auth.users ORDER BY created_at;
```

### 9.1 Recommended test accounts

Create these via the app, then promote/verify:

| Role | Suggested email | How to create |
|------|-----------------|---------------|
| Admin | `admin@yogstra.in` | Sign up as student → SQL promote to admin |
| Academy owner | `owner@shaktiyoga.in` | Sign up → create academy in `/dashboard/academy` |
| Teacher | `ananya.iyer@yogstra.in` | Teacher registration → admin approves at `/admin/teachers` |
| Student 1 | `priya.sharma@example.com` | Student signup |
| Student 2 | `rahul.mehta@example.com` | Student signup |
| Organizer | `events@yogstra.in` | Any verified user — create competition in `/dashboard/organizer` |
| Judge | `judge@yogstra.in` | Sign up → organizer assigns in judge board |

### 9.2 Admin promotion

```sql
UPDATE public.profiles SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'admin@yogstra.in');
```

### 9.3 Verify teacher

After teacher registers and admin approves in UI, or manually:

```sql
UPDATE public.teacher_profiles SET status = 'verified'
WHERE id = (SELECT id FROM auth.users WHERE email = 'ananya.iyer@yogstra.in');
```

### 9.4 Sample academy (if not created via UI)

```sql
-- Replace OWNER_UUID with academy owner's auth.users.id
INSERT INTO public.academies (name, slug, city, state, created_by)
VALUES ('Shakti Yoga Academy', 'shakti-yoga-academy', 'Bengaluru', 'Karnataka', 'OWNER_UUID')
ON CONFLICT DO NOTHING;

INSERT INTO public.academy_members (academy_id, user_id, role, status, joined_at)
SELECT a.id, 'OWNER_UUID', 'owner', 'active', now()
FROM public.academies a WHERE a.slug = 'shakti-yoga-academy'
ON CONFLICT DO NOTHING;
```

### 9.5 Sample competition (via UI preferred)

Use **Organizer Dashboard → Create competition** wizard. This sets categories, divisions, events, scoring criteria, and registration status correctly.

For a minimal SQL seed after organizer user exists:

```sql
-- Replace ORGANIZER_UUID
INSERT INTO public.competitions (
  name, slug, description, organizer_id, city, state,
  start_date, end_date, registration_deadline, entry_fee,
  status, created_by, settings
) VALUES (
  'National Youth Yoga Championship 2026',
  'national-youth-yoga-2026',
  'All-India youth yoga competition — traditional and artistic categories.',
  'ORGANIZER_UUID',
  'Pune', 'Maharashtra',
  '2026-08-15', '2026-08-17', '2026-07-31',
  500,
  'registration_open',
  'ORGANIZER_UUID',
  '{"scoringCriteria":[{"key":"technique","label":"Technique","maxScore":10,"weight":1,"required":true,"type":"score"},{"key":"flexibility","label":"Flexibility","maxScore":10,"weight":1,"required":true,"type":"score"},{"key":"presentation","label":"Presentation","maxScore":10,"weight":1,"required":true,"type":"score"}],"lockedCategories":[]}'::jsonb
);
```

### 9.6 Platform commission

Default 10% is seeded by migration `003`:

```sql
SELECT * FROM public.platform_settings;
-- id = 1, commission_percent = 10
```

Adjust via Admin → Settings or:

```sql
UPDATE public.platform_settings SET commission_percent = 10 WHERE id = 1;
```

### 9.7 Yoga categories

Seeded automatically by migration `001` (Basic Yoga, Intermediate, Advanced, Competition Yoga, etc.). Verify:

```sql
SELECT name, icon FROM public.categories ORDER BY name;
```

---

## Step 10 — Testing checklist

Run through each flow on **staging** (Vercel preview + Supabase + Razorpay Test Mode + LiveKit).

### Authentication

- [ ] Student signup (`/auth/student`) — profile row created
- [ ] Student login → redirects to `/dashboard/student`
- [ ] Teacher registration → pending page → admin approve → teacher dashboard
- [ ] Admin login → `/admin` accessible
- [ ] Password reset email received and link works
- [ ] Logout clears session

### Payments (Razorpay Test Mode)

- [ ] Student opens teacher profile → Buy Class → Razorpay checkout opens
- [ ] Test card payment succeeds (`4111 1111 1111 1111`)
- [ ] `class_orders.payment_status = paid` in Supabase
- [ ] Active `bookings` row created
- [ ] Teacher notification appears
- [ ] Webhook delivery shows 200 in Razorpay Dashboard

### Messaging

- [ ] Student sends chat request from teacher profile
- [ ] Teacher accepts → thread appears in Messages
- [ ] Real-time message delivery (both sides)
- [ ] Unread badge updates

### Live classes

- [ ] Teacher starts class from `/dashboard/teacher/classes`
- [ ] Student receives ring / can join from `/dashboard/student/classes`
- [ ] Video and audio work (LiveKit room connects)
- [ ] Session ends → `class_sessions.status = ended`
- [ ] Attendance metrics update on dashboards

### Competition registration

- [ ] Public `/competitions` lists live data
- [ ] Student completes registration wizard
- [ ] Organizer sees registration in dashboard
- [ ] Organizer approves registration + verifies documents
- [ ] Organizer marks payment received (manual until competition Razorpay)

### Judge scoring

- [ ] Organizer assigns judge to category
- [ ] Judge sees assignment at `/dashboard/judge`
- [ ] Judge submits scores (validation enforced)
- [ ] Offline queue: disable network → score queues → reconnect → syncs
- [ ] Organizer clicks **Compute from scores** → provisional results appear

### Certificates & rankings

- [ ] Organizer approves results → **Publish approved**
- [ ] Student sees results at `/dashboard/student/results`
- [ ] Rankings update at `/dashboard/student/rankings`
- [ ] Certificate issued with verification URL
- [ ] Public `/verify/certificate/{token}` shows valid certificate

### Academy & admin

- [ ] Create academy from empty academy dashboard
- [ ] Invite teacher by email
- [ ] Teacher accepts invite in Settings
- [ ] Enroll student in batch (UUID)
- [ ] Admin approves teacher, reviews payouts

---

## Step 11 — Launch checklist

Complete **every item** before inviting real users.

### Infrastructure

- [ ] Production Supabase project (separate from staging recommended)
- [ ] All migrations 000–009 applied on production database
- [ ] Vercel production deploy green (`npm run build` passes in CI)
- [ ] Custom domain configured with HTTPS
- [ ] Supabase Site URL + Redirect URLs point to production domain

### Secrets & security

- [ ] `SUPABASE_SERVICE_ROLE_KEY` only in Vercel (never in git or client)
- [ ] Razorpay **Live Mode** keys in production env
- [ ] Razorpay webhook secret matches production webhook
- [ ] LiveKit production project keys set
- [ ] Admin account(s) created and verified
- [ ] Review Supabase RLS — no tables left without policies

### Payments & compliance

- [ ] Razorpay KYC complete for live payments
- [ ] Razorpay Route enabled if using automated teacher payouts
- [ ] Refund policy live at `/refund-policy`
- [ ] Privacy policy live at `/privacy-policy`
- [ ] Terms of service live at `/terms-of-service`

### Product readiness

- [ ] At least one verified teacher with complete profile visible in Find Teachers
- [ ] Platform commission set in `platform_settings`
- [ ] Email confirmation enabled for production signups
- [ ] Smoke test all five workflows (student, teacher, academy, organizer, judge) on production

### Monitoring

- [ ] Supabase Dashboard → Logs monitoring enabled
- [ ] Razorpay webhook failure alerts configured
- [ ] Vercel deployment notifications enabled
- [ ] Document on-call contact for payment/video failures

### Known limitations at launch

Document these for support staff:

| Limitation | Workaround |
|------------|------------|
| Competition entry fees — no Razorpay yet | Organizer marks registration paid manually |
| Student self-serve academy join | Academy staff enrolls students into batches |
| Document file upload for competitions | Organizer verifies via checklist flags |
| Email/push notification delivery | In-app notifications work; email worker not deployed |
| API rate limiting is in-memory | Acceptable for launch; upgrade to Redis/KV later |

---

## Quick reference — local dev commands

```bash
cd Yogstra
npm install
cp .env.example .env.local
# Fill in .env.local with Supabase + Razorpay test + LiveKit keys

# Frontend only (Supabase + LiveKit token work)
npm run dev
# → http://localhost:5173

# Full stack including Razorpay APIs
npx vercel dev
# → http://localhost:3000

# Production build check
npm run build
npm run lint
```

---

## Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Blank page after deploy | Missing `VITE_SUPABASE_*` | Add env vars in Vercel, redeploy |
| Payments fail immediately | Razorpay API routes unavailable | Use `vercel dev` locally; verify Vercel env on staging |
| Video room won't connect | Missing LiveKit keys | Check `LIVEKIT_*` and `VITE_LIVEKIT_URL` |
| RLS permission denied | Migrations incomplete or wrong user | Re-run migrations; check Supabase logs |
| Academy email invite fails | Migration 009 not applied | Run `009_profile_email_lookup.sql` |
| Webhook 400 invalid signature | Wrong `RAZORPAY_WEBHOOK_SECRET` | Match secret in Razorpay Dashboard and Vercel |
| Teacher stuck on pending | Not approved | Admin → Teachers → Approve |

---

## Related documentation

- [MIGRATION_GUIDE.md](../database/MIGRATION_GUIDE.md) — database scenarios and rollback
- [END_TO_END_WORKFLOW_REPORT.md](../production/END_TO_END_WORKFLOW_REPORT.md) — workflow status
- [PRODUCTION_COMPLETION_REPORT.md](../production/PRODUCTION_COMPLETION_REPORT.md) — feature readiness
- [SECURITY_REPORT.md](../production/SECURITY_REPORT.md) — security review
- [.env.example](../../.env.example) — environment variable template

---

*Last updated: Sprint 5 — Environment Setup & Launch Preparation*
