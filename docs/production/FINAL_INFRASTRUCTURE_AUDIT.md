# Final Infrastructure Audit — Sprint 14

**Date:** 2026-06-30  
**Branch:** `feature/v2-app-shell`  
**Scope:** Production Supabase integration, auth, storage, payments, notifications, performance, security, accessibility, deployment readiness  
**Verdict:** **Deployable MVP** with documented gaps (competition payments, synthetic practice card, storage buckets for some asset types)

---

## Executive summary

Yogstra V2 is a Vite + React 19 SPA backed entirely by Supabase for domain data. There are **no mock repositories**, **no in-memory fake stores**, and **no placeholder data layers**. All reads and writes flow through `src/repositories/*` and `src/services/*` to Supabase Postgres, Auth, Storage, and Realtime.

Remaining gaps are **intentional MVP boundaries**, not architectural shortcuts:

| Area | Status | Notes |
|---|---|---|
| Domain data (Supabase) | ✅ Complete | All 15 domains use repositories |
| Auth & sessions | ✅ Good | Supabase Auth + route guards |
| Class booking payments | ✅ Production | Razorpay order → fulfill → webhook |
| Competition entry payments | ⚠️ Stub | DB flag only; no Razorpay |
| Storage | ⚠️ Partial | `avatars`, `post-media` only |
| Notifications | ⚠️ Mixed | Teacher: DB; student/judge: computed + localStorage read state |
| Practice card (student dashboard) | ⚠️ Synthetic | Template text derived from schedule/coach, not DB content |
| Build & lint | ✅ Pass | `npm run lint`, `npm run build` |

**Fix applied this sprint:** Certificate notifications now require an issued certificate in `competition_certificates` — no false "Certificate ready" alerts.

---

## 1. Production Supabase integration

### Architecture

```
Pages / Components
       ↓
Services (business logic, orchestration)
       ↓
Repositories (Supabase queries, mappers)
       ↓
Supabase (Postgres + Auth + Storage + Realtime)
```

Pages do **not** import `@supabase/supabase-js` directly (except legacy academy pages noted below). All domain access is centralized.

### Domain verification

| Domain | Service / repository | Supabase tables | Mock? |
|---|---|---|---|
| Auth | `auth.ts`, `AppContext` | `auth.users`, `profiles` | No |
| Profiles | `profileService`, `profileRepository` | `profiles`, `profile_preferences` | No |
| Teachers | `teacherService`, `teacherRepository` | `teacher_profiles`, `teacher_payout_private` | No |
| Students | `studentService`, bookings | `profiles`, `bookings` | No |
| Academies | `academyService`, `academyRepository` | `academies`, `academy_members`, `academy_settings`, `teacher_academies` | No |
| Programs / batches | `batchService`, `academyRepository` | `batches`, `batch_students` | No |
| Competitions | `competitionService`, `competitionRepository` | 12 competition tables | No |
| Registrations | `studentCompetitionOperations` | `competition_registrations`, `competition_participants` | No |
| Judge assignments | `judgeService`, `competitionJudgeRepository` | `competition_judges` | No |
| Results | `resultService`, `competitionResultRepository` | `competition_results`, `competition_scores` | No |
| Certificates | `certificateService` | `competition_certificates` | No |
| Rankings | `rankingService` | `competition_rankings` | No |
| Community | `communityService` | `posts`, `comments` | No |
| Notifications | `notificationCenter`, `teacherNotifications` | `teacher_notifications` + computed | Partial |
| Payments | `payments.ts`, Razorpay API | `class_orders`, `payouts` | Class only |

### Known non-Supabase UI content

| Location | Behavior | Risk |
|---|---|---|
| `studentDashboard.ts` → `derivePractice()` | Generates practice card copy from coach/class context (template strings) | Low — UX placeholder, not fake DB records |
| Admin "Audit log" on dashboard | Uses `fetchRecentActivity()` (recent signups/bookings) | Low — mislabeled, not a security audit trail |
| Public FAQ / Help content | Static markdown in `PUBLIC_FAQS`, help pages | Expected |

### Service-layer bypass (minor)

Two academy pages query Supabase-adjacent data through service calls only — no raw client imports found in grep audit. All paths verified through `academyService` / repositories.

### Silent migration fallbacks

Several services catch `PGRST205` / `42P01` (missing table) and return `[]` instead of surfacing errors. This aids local dev before migrations run but can mask production misconfiguration.

**Recommendation:** Log to console in production builds or gate behind `import.meta.env.DEV`.

---

## 2. Authentication

| Flow | Implementation | Status |
|---|---|---|
| Student signup | `/auth/student` → Supabase `signUp` + profile insert | ✅ |
| Teacher signup | `/auth/teacher/register` → teacher profile + pending verification | ✅ |
| Admin login | Same auth; role from `profiles.role` + email allowlist (`platformAdmin.ts`) | ✅ |
| Session persistence | Supabase Auth JWT in client; `onAuthStateChange` in `AppContext` | ✅ |
| Workspace persistence | DB (`profile_preferences`) + localStorage cache | ✅ Dual |
| Logout | `signOut()` clears session | ✅ |
| Expired session | Supabase refresh; failed requests redirect to auth | ✅ |
| Unauthorized access | RLS denies at DB; route guards redirect at UI | ✅ |
| Deep-link auth | React Router preserves path; `LoggedInRedirect` resolves post-login | ✅ |
| Protected routes | `RequireRole`, `RequireVerifiedTeacher`, academy/competition guards | ✅ |

**localStorage usage (intentional):**

- Workspace preference cache (`workspacePreference.ts`)
- Notification read state (student, judge)
- Notification preferences (email/push toggles — not wired to backend)
- Theme preference

---

## 3. Storage

| Asset type | Bucket | Upload service | Status |
|---|---|---|---|
| Profile / teacher avatars | `avatars` | `avatars.ts` | ✅ |
| Community post media | `post-media` | `communityService` | ✅ |
| Academy logos | — | URL field only (external or manual) | ⚠️ No bucket |
| Competition banners | — | URL field in competition record | ⚠️ No bucket |
| Certificate PDFs | — | DB metadata only; no PDF generation pipeline | ⚠️ MVP gap |
| Registration documents | — | Not implemented | ⚠️ MVP gap |

**Policies:** Migration `007` defines public read + uid-scoped write for both buckets. Delete on object removal is user-scoped.

---

## 4. Payments

### Class booking (production-ready)

```
BuyClassModal → api/razorpay-order.ts → Razorpay checkout
             → api/razorpay-fulfill.ts (client callback)
             → api/razorpay-webhook.ts (server verification)
             → server/fulfillPayment.ts → class_orders + bookings + payouts
```

- Platform commission from `platform_settings`
- Teacher payout records in `payouts` / Route setup via `api/teacher-payout-setup.ts`
- Idempotency via Razorpay order ID + fulfillment checks

### Competition registration (MVP stub)

`RegistrationWizard.tsx` calls `markRegistrationPaid()` which sets `payment_status = 'paid'` in `competition_registrations` **without Razorpay**. Documented as post-MVP integration.

---

## 5. Notifications

| Event | Source | Status |
|---|---|---|
| Registration approved/rejected | `buildStudentCompetitionNotifications` | ✅ |
| Payment required (competition) | Computed from `payment_status` | ✅ (stub payment) |
| Competition tomorrow / check-in | Computed from competition dates/status | ✅ |
| Results published | Computed when status = completed | ✅ |
| Certificate ready | **Fixed** — requires issued certificate | ✅ |
| Judge assigned | `notificationCenter` → `competition_judges` query | ✅ |
| Teacher booking/payout | `teacher_notifications` table + Realtime | ✅ |
| Enrollment approved (academy batch) | Not auto-generated | ⚠️ Gap |
| Competition published | Not auto-generated for students | ⚠️ Gap |
| Batch created | Not auto-generated | ⚠️ Gap |
| Teacher approved | Not auto-generated (UI status only) | ⚠️ Gap |

Email and push preferences are stored in localStorage only — no dispatch pipeline.

---

## 6. Performance snapshot

See [PERFORMANCE_REVIEW.md](./PERFORMANCE_REVIEW.md). Build passes; largest chunk is LiveKit (~603 KB, lazy-loaded).

---

## 7. Security snapshot

See [SECURITY_REVIEW.md](./SECURITY_REVIEW.md). RLS on all domain tables; secrets server-only; route guards complement RLS.

---

## 8. Accessibility snapshot

Prior audit in [ACCESSIBILITY_REPORT.md](./ACCESSIBILITY_REPORT.md). Skip link, live regions on auth, semantic headings verified. Modal focus traps remain open recommendation.

---

## 9. Database snapshot

See [DATABASE_VALIDATION.md](./DATABASE_VALIDATION.md). 13 migration files (`000`–`011`), RLS enabled on all tables.

---

## 10. Production readiness

See [PRODUCTION_DEPLOYMENT_GUIDE.md](./PRODUCTION_DEPLOYMENT_GUIDE.md) for env vars, Supabase config, deployment steps, rollback, and monitoring.

---

## Sprint 14 changes

1. **Certificate notification fix** — `buildStudentCompetitionNotifications()` accepts `issuedCertificateCompetitionIds`; callers fetch from `certificateService`.
2. **Five production audit documents** — this file plus database, security, performance, and deployment guides.

---

## Recommended post-MVP backlog

1. Razorpay integration for competition entry fees
2. Storage buckets for academy logos, competition assets, certificate PDFs
3. Server-side notification dispatch (email via Supabase Auth templates or Resend)
4. Replace `derivePractice()` templates with coach-assigned practice plans (new table)
5. Real admin audit log table
6. Remove silent empty-array fallbacks for missing tables in production
7. Redis-backed rate limiting on Vercel API routes

---

## Validation commands

```bash
npm run lint   # passes (warnings only)
npm run build  # passes
```

Both verified on 2026-06-30.
