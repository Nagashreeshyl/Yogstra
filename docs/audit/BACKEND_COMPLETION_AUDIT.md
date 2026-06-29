# Backend Completion Audit

**Date:** 2026-06-29  
**Scope:** Yogstra V2 backend — `src/services/`, `src/repositories/`, `server/`, `api/`, Supabase migrations  
**Method:** Static code review (read-only). No runtime or database verification.  
**Architecture:** Supabase (PostgreSQL + RLS + Auth) as primary backend; five Vercel serverless API routes for payments, webhooks, LiveKit, and Razorpay Route setup.

---

## Executive Summary

| Metric | Score |
|--------|-------|
| **Overall Backend Completion** | **76%** |
| **Overall Production Readiness** | **72%** |

**Strengths:** Coaching marketplace (bookings, schedules, class orders, Razorpay, LiveKit), direct chat, community, teacher platform (coupons, notifications, schedule changes), competition domain (repository layer + organizer/judge/student services), and admin tooling are largely implemented against real Supabase tables with RLS.

**Gaps:** Academy has full schema and services but no wired UI. Dashboard widgets still use mock competition data. Competition entry fees bypass Razorpay. Rankings write pipeline and certificate cryptography are incomplete. Legacy booking-scoped chat (`messages` table) is orphaned. No dedicated analytics service or student notification table.

---

## Authentication

### Status

✅ **Fully Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `profiles`, `teacher_profiles` (extends profiles); Supabase Auth (`auth.users`) |
| **Migrations** | `001_core_schema.sql`, `000_extensions_and_helpers.sql` (`handle_new_user` trigger) |
| **RLS** | Enabled on `profiles`, `teacher_profiles`; role/status policies in core migration |

### Services

| Service | Key functions |
|---------|---------------|
| `auth.ts` | `signIn`, `signUpStudent`, `signUpTeacher`, `signOut`, `getSession`, `fetchProfile`, `ensureProfile`, `requestPasswordReset`, `invalidateProfileCache` |

### Repositories

None (direct Supabase in service).

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| Supabase Auth | — | Sign-up, sign-in, password reset, session (client SDK) |

No custom auth API routes.

### Workflows

| Workflow | Status |
|----------|--------|
| Student sign-up → profile row | **Complete** |
| Student sign-in → dashboard routing | **Complete** |
| Teacher sign-up → pending profile → email confirm → admin verify | **Complete** (pending teacher form cached in `localStorage` until confirm) |
| Password reset email | **Complete** |
| Admin role assignment | **Partial** (manual DB / Supabase dashboard; no in-app admin role UI) |
| Sign-out / session refresh | **Complete** |

### TODOs

No literal `TODO`/`FIXME` comments in backend code. Implicit gaps:

- No MFA / OAuth providers beyond Supabase defaults
- No in-app role elevation workflow
- Profile cache TTL (30s) may serve stale teacher status briefly

### Mock Data

None in auth service.

### Hardcoded Values

| Value | Location |
|-------|----------|
| `'Yogstra User'` | Default display name fallback in `auth.ts` |
| `PENDING_TEACHER_KEY = 'yogstra_pending_teacher'` | localStorage key prefix |
| `PROFILE_CACHE_TTL_MS = 30_000` | Profile cache duration |

### Edge Cases

- `fetchProfile` returns `null` on error (silent failure path)
- Duplicate teacher profile insert swallows Postgres `23505`
- Teacher registration data lost if localStorage cleared before email confirm

### Technical Debt

- Pending teacher bootstrap relies on client localStorage
- Profile caching without invalidation on all mutation paths

### Production Readiness

**88%**

---

## Student Dashboard

### Status

🟡 **Partially Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `schedules`, `bookings`, `class_orders`, `schedule_change_requests`, `chat_threads`, `direct_messages`, `profiles`, `teacher_profiles` |
| **Migrations** | `001_core_schema.sql`, `002_chat_and_orders.sql`, `004_teacher_platform.sql` |
| **RLS** | Enabled on all listed tables |

### Services

| Service | Role |
|---------|------|
| `studentDashboard.ts` | Aggregates dashboard view model |
| `bookings.ts` | Active booking lookup |
| `liveClasses.ts` | Coaching access, next sessions |
| `schedules.ts` | Session counts, upcoming classes |
| `scheduleChangeRequests.ts` | Pending change requests |
| `directChat.ts` | Coach feedback from messages |

### Repositories

None for dashboard aggregate.

### API Endpoints

None (Supabase client only).

### Workflows

| Workflow | Status |
|----------|--------|
| Load dashboard → coach, next class, progress | **Partial** (next class/schedules real; practice synthetic) |
| Competition widget on dashboard | **Partial** (mock constants, always `not_registered`) |
| Academy name on dashboard | **Missing** (`academyName: null` hardcoded) |
| Attendance percentage | **Partial** (derived from schedule counts, not check-ins) |
| Coach feedback from chat | **Complete** (best-effort; errors swallowed) |
| Notifications list | **Partial** (synthesized from schedule/competition heuristics) |

### TODOs

- Wire `fetchStudentAcademyAssociation` from `academyService.ts`
- Replace mock competition with `studentCompetitionExperience` or registration lookup
- Real attendance/check-in data source not defined

### Mock Data

| Source | Used for |
|--------|----------|
| `lib/constants.ts` → `competitions` | Dashboard competition card (`studentDashboard.ts`) |
| `derivePractice()` | Synthetic “today’s practice” copy when no schedule context |

### Hardcoded Values

| Value | Location |
|-------|----------|
| `academyName: null` | `studentDashboard.ts` |
| `registrationStatus: 'not_registered'` | When using constants competitions |
| Streak/progress heuristics | Weekly session counts from schedules only |

### Edge Cases

- No coaching access → empty coach/next class (handled)
- Chat fetch failure → no coach feedback (silent)
- Constants competition dates (`Aug 15, 2026`) may parse inconsistently vs ISO DB dates

### Technical Debt

- Dashboard aggregator mixes real and placeholder fields in one DTO
- Competition card duplicates student competition module data

### Production Readiness

**55%**

---

## Teacher Dashboard

### Status

🟡 **Partially Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `schedules`, `bookings`, `schedule_change_requests`, `class_orders`, `teacher_notifications`, `academies`, `academy_members`, `teacher_academies` |
| **Migrations** | `001`, `004`, `005` |
| **RLS** | Enabled |

### Services

| Service | Role |
|---------|------|
| `teacherDashboard.ts` | Main aggregator |
| `teacherEarnings.ts` | Revenue snapshot |
| `teacherNotifications.ts` | Unread count |
| `schedules.ts` | Today’s classes |
| `liveClasses.ts` | Paid students, class-hour detection |
| `directChat.ts` | Message previews |
| `academyService.ts` | `fetchAcademiesForUser` (name only) |
| `teachers.ts` | Profile completeness |

### Repositories

None for dashboard.

### API Endpoints

None.

### Workflows

| Workflow | Status |
|----------|--------|
| Today’s classes + live indicator | **Complete** |
| Revenue / pending payout snapshot | **Complete** |
| Message widget | **Complete** |
| Attendance (weekly %, absent today) | **Partial** (`absentToday` always empty; weekly ≈ 100% if any schedule) |
| Competition widget (registrations, docs) | **Partial** (mock competition; counts always 0) |
| Academy name display | **Partial** (reads real academy if member) |
| Profile incomplete task | **Complete** |

### TODOs

- Link competition widget to `competition_registrations` / teacher’s students
- Real absentee tracking

### Mock Data

| Source | Used for |
|--------|----------|
| `lib/constants.ts` → `competitions` | `pickCompetition()` in `teacherDashboard.ts` |
| Zero registration counts | Hardcoded on mock competition object |

### Hardcoded Values

| Value | Location |
|-------|----------|
| `studentsRegistered: 0`, `pendingRegistrations: 0`, `missingDocuments: 0` | Competition widget |
| `absentToday: []` | Attendance block |
| `rating: null` | No ratings table |

### Edge Cases

- `.catch(() => [])` on academies/messages hides partial failures
- No students → empty widgets (OK)

### Technical Debt

- Misleading attendance metrics for production reporting
- Competition widget not connected to competition domain

### Production Readiness

**60%**

---

## Academy

### Status

🟡 **Partially Implemented** (backend scaffold complete; **no application UI**)

### Database

| Item | Detail |
|------|--------|
| **Tables** | `academies`, `academy_settings`, `academy_members`, `teacher_academies`, `batches`, `batch_students` |
| **Migrations** | `005_academy_domain.sql` |
| **RLS** | Enabled on all six tables; role helpers in migration |

### Services

| Service | Import status |
|---------|---------------|
| `academyService.ts` | **Partial** — only `fetchAcademiesForUser` used (teacher dashboard) |
| `academyMemberService.ts` | **Dead** — 0 UI imports |
| `batchService.ts` | **Dead** — 0 UI imports |

### Repositories

| Repository | Tables |
|------------|--------|
| `academyRepository.ts` | `academies`, `academy_settings`, `academy_members`, `teacher_academies` |
| `academyMemberRepository.ts` | `academy_members`, `teacher_academies`, `profiles` |
| `batchRepository.ts` | `batches`, `batch_students`, `profiles` |

### API Endpoints

None.

### Workflows

| Workflow | Status |
|----------|--------|
| Create academy → settings → owner member | **Complete** (service layer) |
| Add academy member / link teacher | **Complete** (service layer, unwired) |
| Create batch → enroll student | **Complete** (service layer, unwired) |
| Student academy association lookup | **Partial** (`fetchStudentAcademyAssociation` exists, unused) |
| Academy dashboard routes | **Missing** (placeholder pages only) |

### TODOs

- Wire academy services to `/dashboard/academy/*` when module ships
- `academyMemberService` / `batchService` or merge into `academyService`

### Mock Data

None in services (UI placeholders only).

### Hardcoded Values

| Value | Location |
|-------|----------|
| Default slug `'academy'` | `academyService.ts` `ensureUniqueSlug` |
| Unbounded slug suffix loop | No max retry cap |

### Edge Cases

- Slug collision loop theoretically unbounded
- No transaction wrapping academy create + member bootstrap

### Technical Debt

- Duplicate service layer (`academyService` uses repos directly; member/batch services unused)
- Domain barrel `domain/academy/index.ts` unused

### Production Readiness

**18%** (schema + services ready; no consumer)

---

## Competition

### Status

🟡 **Partially Implemented** (core domain **✅**; payments/docs **🟡**)

### Database

| Item | Detail |
|------|--------|
| **Tables** | `competitions`, `competition_events`, `competition_categories`, `competition_divisions`, `competition_registrations`, `competition_participants`, `competition_judges`, `competition_scores`, `competition_results`, `competition_certificates`, `competition_rankings`, `competition_announcements` |
| **Migrations** | `006_competition_domain.sql` |
| **RLS** | Enabled on all 12 tables; helper functions `is_competition_organizer`, etc. |

### Services

| Service | Role |
|---------|------|
| `competitionService.ts` | CRUD, events, categories, announcements |
| `registrationService.ts` | Registrations, participants, stats |
| `rankingService.ts` | Read rankings; `recordRankingEntry` (unused) |
| `certificateService.ts` | Draft, issue, verify, fetch |
| `judgeService.ts` | Judges, scores, results (read); legacy `submitScore` |
| `studentCompetitionExperience.ts` | Student read aggregator |
| `studentCompetitionOperations.ts` | Registration write + fake payment |
| `organizerDashboard.ts` | Organizer read aggregator |
| `organizerOperations.ts` | Organizer mutations |

### Repositories

| Repository | Tables |
|------------|--------|
| `competitionRepository.ts` | competitions, events, categories, announcements |
| `competitionRegistrationRepository.ts` | registrations, participants |
| `competitionJudgeRepository.ts` | judges, scores, results |
| `competitionRankingRepository.ts` | rankings |
| `competitionCertificateRepository.ts` | certificates |

### API Endpoints

None (Supabase direct). Competition fees not integrated with Razorpay API.

### Workflows

| Workflow | Status |
|----------|--------|
| Student browses published competitions | **Complete** |
| Student registers (wizard) → registration + participant | **Complete** |
| Registration payment | **Partial** (`markRegistrationPaid` sets DB flag; no Razorpay) |
| Document upload / verification | **Partial** (checkbox flags in metadata; no file storage service) |
| Preparation / timeline / live status | **Complete** |
| Judge scoring → results | **Complete** (via judge module) |
| Organizer publish results | **Complete** |
| Certificate issue | **Partial** (DB record + QR; no PDF; placeholder signature) |
| Rankings display | **Complete** (read) |
| Rankings auto-populate from results | **Missing** (`recordRankingEntry` unused) |
| Foundation routes `/dashboard/competitions` | **Placeholder** (UI stub) |

**End-to-end chain:**

```
Student registers → Payment (stub) → Competition registration → Judge scoring → Results → Certificate → Ranking
     Complete          Partial              Complete                 Complete        Complete      Partial      Partial (read only)
```

### TODOs

- Integrate Razorpay (or shared payment service) for entry fees
- Document upload to Supabase Storage
- Wire `recordRankingEntry` after result publish
- Replace `ed25519-placeholder` certificate signing
- Public `/competitions` page uses mock data (see Mock Data)

### Mock Data

| Consumer | Source |
|----------|--------|
| `ExplorePage`, `CompetitionsPage`, `CompetitionsTeaser` | `lib/constants.ts` |
| Student/teacher dashboard widgets | Same constants |

### Hardcoded Values

| Value | Location |
|-------|----------|
| `payment_status: 'paid'`, `payment_amount: null` | `markRegistrationPaid` |
| `practice` checklist `false` | `studentCompetitionExperience.ts` |
| `algorithm: 'ed25519-placeholder'` | `organizerOperations.generateCertificatesForResults` |
| `signedBy: 'Yogstra Platform'` | Certificate issue |

### Edge Cases

- No rollback if `addParticipant` fails after `submitRegistration`
- Registration open check only at service level; race on concurrent registrations
- N+1 category fetches on competition home list

### Technical Debt

- Split read (`Experience`) vs write (`Operations`) is good; payment path is a stub
- `judgeService.submitScore` redundant with `judgeScoringService`
- `fetchCompetitionBySlug`, `generateCertificatesForResults`, `verifyCertificateByQrToken` unused

### Production Readiness

**70%**

---

## Judge

### Status

✅ **Fully Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `competition_judges`, `competition_scores`, `competition_participants`, `competition_events`, `competition_announcements` |
| **Migrations** | `006_competition_domain.sql` |
| **RLS** | Judge-scoped policies on scores/participants |

### Services

| Service | Role |
|---------|------|
| `judgeDashboard.ts` | Assignments, session queue, announcements |
| `judgeScoringService.ts` | Submit/update scores, offline sync |
| `judgeService.ts` | Repository facade (reads + legacy submit) |

### Repositories

`competitionJudgeRepository.ts`

### API Endpoints

None.

### Workflows

| Workflow | Status |
|----------|--------|
| Judge login → assignment list | **Complete** |
| Open session → participant queue | **Complete** |
| Score entry (criteria from competition.settings) | **Complete** |
| Offline queue → sync on reconnect | **Complete** |
| Submit final scores | **Complete** |

### TODOs

- Remove or deprecate `judgeService.submitScore` in favor of `judgeScoringService`
- Server-side score range validation beyond RLS

### Mock Data

None.

### Hardcoded Values

Offline queue keys in `utils/judgeOfflineQueue.ts` (localStorage prefix).

### Edge Cases

- Duplicate score insert handled (23505) in scoring service
- N+1 participant count queries per assignment on dashboard

### Technical Debt

- Offline sync relies on localStorage (device-bound, not cross-device)

### Production Readiness

**85%**

---

## Organizer

### Status

✅ **Fully Implemented**

### Database

Same competition tables as Competition domain.

### Services

| Service | Role |
|---------|------|
| `organizerDashboard.ts` | Aggregated dashboard + embedded analytics |
| `organizerOperations.ts` | CRUD, publish, judges, results, CSV, certificates |
| Underlying | `competitionService`, `registrationService`, `judgeService`, `certificateService` |

### Repositories

All competition repositories.

### API Endpoints

None.

### Workflows

| Workflow | Status |
|----------|--------|
| Create competition wizard → publish | **Complete** |
| Manage registrations (approve/reject/bulk) | **Complete** |
| Assign judges to categories | **Complete** |
| Schedule events / detect conflicts | **Complete** |
| Approve/publish results | **Complete** |
| Issue certificates from queue | **Complete** (DB-level) |
| Export registrations CSV | **Complete** |
| Announcements compose/publish | **Complete** |

### TODOs

- Bulk operations lack partial-failure reporting
- `updateCompetitionDetails` exported but unused by UI
- PDF certificate generation

### Mock Data

None in services.

### Hardcoded Values

| Value | Location |
|-------|----------|
| `ed25519-placeholder` | Certificate batch generation |
| Heuristic `attendanceRate` | `organizerDashboard.ts` (confirmed regs, not check-ins) |

### Edge Cases

- Empty organizer competition list → empty dashboard (handled)
- Judge assignment by raw Profile UUID (UX friction, not backend gap)

### Technical Debt

- Analytics embedded in dashboard service vs dedicated module
- `generateCertificatesForResults` never called from UI (manual issue path used)

### Production Readiness

**80%**

---

## Community

### Status

✅ **Fully Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `posts`, `comments` |
| **Migrations** | `001_core_schema.sql` |
| **RLS** | Enabled; admin pin/delete policies |

### Services

| Service | Functions |
|---------|-----------|
| `posts.ts` | `fetchPosts`, `createPost`, `updatePostPin`, `deletePost`, `createComment` |
| `avatars.ts` | Media upload (storage) for post attachments |

### Repositories

None.

### API Endpoints

None (Supabase + Storage).

### Workflows

| Workflow | Status |
|----------|--------|
| Feed load | **Complete** |
| Create post with media | **Complete** |
| Comment | **Complete** |
| Admin pin/delete | **Complete** |
| Realtime refresh | **Complete** (`liveSync` → posts/comments) |

### TODOs

None explicit.

### Mock Data

None.

### Hardcoded Values

Post media limits in `utils/sanitize.ts` (`MAX_POST_MEDIA_BYTES = 25MB`).

### Edge Cases

- Media validation client-side; relies on storage policies server-side

### Technical Debt

- Post author enrichment N+1 pattern possible on large feeds

### Production Readiness

**88%**

---

## Chat

### Status

✅ **Fully Implemented** (direct chat) / 🔴 **Placeholder** (legacy booking chat dead)

### Database

| Item | Detail |
|------|--------|
| **Tables (active)** | `chat_threads`, `direct_messages`, `chat_thread_reads`, `chat_thread_settings`, `chat_reports`, `direct_video_calls` |
| **Tables (legacy)** | `messages` (booking-scoped) |
| **Migrations** | `002_chat_and_orders.sql` |
| **RLS** | Enabled on all chat tables |

### Services

| Service | Status |
|---------|--------|
| `directChat.ts` | **Active** — threads, messages, reads, ensure thread |
| `directVideoCalls.ts` | **Active** — call state machine |
| `chatSettings.ts` | **Active** — mute/block/hide |
| `reports.ts` | **Active** — admin moderation |
| `messages.ts` | **Dead path** — only used by unmounted `ChatWindow.tsx` |
| `teacherRequest.ts` | **Active** — intro message on teacher request |

### Repositories

None.

### API Endpoints

None for messaging (Supabase realtime).

### Workflows

| Workflow | Status |
|----------|--------|
| Start direct conversation | **Complete** |
| Send/receive messages + read receipts | **Complete** |
| Direct video call ring/accept/decline | **Complete** |
| Report conversation → admin review | **Complete** |
| Booking-scoped legacy chat | **Broken** (UI not routed; `ChatWindow` orphaned) |

### TODOs

- Remove or migrate `messages` table usage and `messages.ts`
- Delete dead `ChatWindow.tsx` / `useChatMessages` when confirmed unused

### Mock Data

None.

### Hardcoded Values

| Value | Location |
|-------|----------|
| `INCOMING_CALL_POLL_MS` | `constants/refresh.ts` via `directVideoCalls.ts` |

### Edge Cases

- Blocked thread → send disabled (UI); RLS must enforce
- Admin chat view uses elevated read policies

### Technical Debt

- Two messaging models (booking `messages` vs direct) — only direct is live
- Thread pair ordering constraint enforced in DB

### Production Readiness

**82%**

---

## Live Classes

### Status

✅ **Fully Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `class_sessions`, `schedules`, `class_orders`, `bookings`, `profiles` |
| **Migrations** | `004_teacher_platform.sql`, `001`, `002` |
| **RLS** | Enabled |

### Services

| Service | Role |
|---------|------|
| `classSessions.ts` | Create/join/end session, token fetch |
| `liveClasses.ts` | Access checks, paid students, schedule helpers |
| `classOrders.ts` | Active purchase, schedule month |
| `liveSync.ts` | Realtime on `class_sessions`, `schedules` |

### Repositories

None.

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/livekit-token` | POST | Bearer JWT | Mint LiveKit room token after room access check |
| `/api/livekit-token` (Vite dev) | POST | Dev middleware | Same via `vite.config.ts` in development |

### Workflows

| Workflow | Status |
|----------|--------|
| Student with paid order → join live room | **Complete** |
| Teacher start/end session | **Complete** |
| LiveKit token with room authorization | **Complete** |
| Schedule boundary refresh | **Complete** |
| Class duration / “live now” detection | **Complete** |

### TODOs

- Configurable session duration (currently 60 min default in multiple places)

### Mock Data

None.

### Hardcoded Values

| Value | Location |
|-------|----------|
| `DEFAULT_SESSION_MINUTES = 60` | `liveClasses.ts`, `fulfillPayment.ts` |

### Edge Cases

- Missing LiveKit env → token API 500 (handled with message)
- Room access validated server-side via `assertLiveKitRoomAccess`

### Technical Debt

- Session duration duplicated across fulfill and live class helpers

### Production Readiness

**85%**

---

## Payments

### Status

🟡 **Partially Implemented** (class booking **✅**; competition fees **❌**)

### Database

| Item | Detail |
|------|--------|
| **Tables** | `class_orders`, `schedules`, `bookings`, `coupon_deliveries`, `teacher_coupons`, `platform_settings` |
| **Migrations** | `002`, `003`, `004` |
| **RLS** | Enabled |

### Services

| Service | Role |
|---------|------|
| `payments.ts` | Client Razorpay checkout orchestration |
| `coupons.ts` | Validate/apply teacher coupons |
| `classOrders.ts` | Order state reads |
| `server/fulfillPayment.ts` | Pending order + fulfill pipeline |
| `server/razorpayClient.ts` | Orders, splits, webhooks, linked accounts |
| `server/orderValidation.ts` | Amount/thread/room validation |

### Repositories

None.

### API Endpoints

| Endpoint | Method | Auth | Rate limit | Purpose |
|----------|--------|------|------------|---------|
| `/api/razorpay-order` | POST | Student Bearer | 20/min/IP | Create pending `class_orders` row + Razorpay order |
| `/api/razorpay-fulfill` | POST | Student Bearer | 30/min/IP | Verify signature + fulfill booking |
| `/api/razorpay-webhook` | POST | Razorpay signature | — | `payment.captured`, `transfer.processed` |

### Workflows

| Workflow | Status |
|----------|--------|
| Student buys class → Razorpay → fulfill → schedules + booking | **Complete** |
| Coupon applied at checkout | **Complete** |
| Webhook idempotent fulfill | **Complete** |
| Dev mode without server order | **Partial** (allows client-only path in DEV) |
| Competition entry fee payment | **Missing** |

### TODOs

- Extend payment pipeline for `competition_registrations.payment_status`
- Remove or gate DEV payment bypass for staging parity

### Mock Data

None.

### Hardcoded Values

| Value | Location |
|-------|----------|
| Minimum ₹1 / 100 paise | `razorpay-order.ts` |
| DEV null server order allowed | `payments.ts` |
| Production origin `https://yogstra.vercel.app` | `apiSecurity.ts` |

### Edge Cases

- Missing `VITE_RAZORPAY_KEY_ID` → client error before checkout
- Webhook without matching order → fulfill throws (500 to Razorpay — retry OK)

### Technical Debt

- Payment logic split client/server without shared types package
- No competition payment receipt linkage

### Production Readiness

**70%**

---

## Payouts

### Status

🟡 **Partially Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `payouts`, `teacher_payout_private`, `teacher_profiles` (legacy UPI fallback), `class_orders`, `platform_settings` |
| **Migrations** | `001`, `003` |
| **RLS** | Enabled; private payout table restricted |

### Services

| Service | Role |
|---------|------|
| `teacherPayoutDetails.ts` | UPI/bank save, Razorpay Route setup client |
| `teacherEarnings.ts` | Earnings + pending payout snapshot |
| `admin.ts` | `fetchPayouts`, `markPayoutPaid` |
| `server/fulfillPayment.ts` | Auto-create payout row on fulfill |
| `server/razorpayClient.ts` | Linked accounts, transfers |

### Repositories

None.

### API Endpoints

| Endpoint | Method | Auth | Purpose |
|----------|--------|------|---------|
| `/api/teacher-payout-setup` | POST | Teacher Bearer | Create Razorpay linked account + store IDs |
| `/api/razorpay-webhook` | POST | Signature | Update payout on `transfer.processed` |

### Workflows

| Workflow | Status |
|----------|--------|
| Teacher saves UPI/bank details | **Complete** |
| Razorpay Route linked account | **Complete** |
| Payout row on class payment | **Complete** |
| Admin marks payout paid manually | **Complete** (no transfer verification) |
| Admin views payout + UPI | **Complete** |
| Teacher views own payout history via `fetchTeacherPayouts` | **Missing** (function exists, 0 UI imports) |

### TODOs

- Wire `fetchTeacherPayouts` to teacher earnings UI or remove
- Align manual `markPayoutPaid` with Razorpay transfer status

### Mock Data

None.

### Hardcoded Values

| Value | Location |
|-------|----------|
| Default commission 10% | `platformSettings.ts`, `teacherEarnings.ts` when table missing |
| Dual-write legacy `teacher_profiles.upi_id` | `teacherPayoutDetails.ts` |

### Edge Cases

- Teacher without linked account → order without Route split (platform holds)
- Legacy UPI fallback silent if private table empty

### Technical Debt

- Payout status may desync between admin manual mark and webhook
- Bank details dual storage (private + legacy)

### Production Readiness

**72%**

---

## Notifications

### Status

🟡 **Partially Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `teacher_notifications` |
| **Migrations** | `004_teacher_platform.sql` |
| **RLS** | Teacher-scoped read/update |

### Services

| Service | Role |
|---------|------|
| `teacherNotifications.ts` | CRUD, unread count, realtime subscribe, booking notification helper |
| `studentCompetitionExperience.ts` | `buildStudentCompetitionNotifications` (computed, not persisted) |
| `studentDashboard.ts` | Synthetic notification list |

### Repositories

None.

### API Endpoints

None.

### Workflows

| Workflow | Status |
|----------|--------|
| Teacher booking notification | **Complete** |
| Teacher notification center page | **Complete** |
| Student notifications (DB) | **Missing** (no table) |
| Student competition alerts | **Partial** (client-computed) |
| Push / email notifications | **Missing** |
| Global notification dropdown (shell) | **Placeholder** (UI comment: future module) |

### TODOs

- `student_notifications` table or unified notifications domain
- Wire shell `NotificationDropdown` to real data

### Mock Data

Synthetic notifications in dashboard/competition experience services.

### Hardcoded Values

Notification type enums in experience layer (`registration`, `documents`, etc.).

### Edge Cases

- Teacher notifications not created for all booking edge paths (depends on call sites)

### Technical Debt

- Three notification strategies (DB teacher, computed student, synthetic dashboard)

### Production Readiness

**40%**

---

## Admin

### Status

✅ **Fully Implemented**

### Database

| Item | Detail |
|------|--------|
| **Tables** | `profiles`, `teacher_profiles`, `bookings`, `schedules`, `payouts`, `chat_threads`, `direct_messages`, `posts`, `comments`, `chat_reports`, `platform_settings`, `categories` |
| **Migrations** | `001`–`007` |
| **RLS** | Admin policies via `is_admin()` helper |

### Services

| Service | Role |
|---------|------|
| `admin.ts` | Payouts, chats, dashboard activity, subscriptions |
| `teachers.ts` | Approve/reject/remove teachers |
| `students.ts` | Student list/detail |
| `bookings.ts` | Booking management |
| `posts.ts` | Community moderation |
| `reports.ts` | Chat report review |
| `platformSettings.ts` | Commission percent |
| `categories.ts` | Yoga category CRUD |

### Repositories

None.

### API Endpoints

None (admin uses Supabase with admin role via RLS).

### Workflows

| Workflow | Status |
|----------|--------|
| Teacher approval workflow | **Complete** |
| Payout review / mark paid | **Complete** |
| Chat oversight + reports | **Complete** |
| Platform commission settings | **Complete** |
| Category management | **Complete** |
| Competition admin oversight | **Missing** (no dedicated admin competition UI) |
| Recent activity dashboard | **Partial** (ignores failed sub-queries) |

### TODOs

- Admin competition management UI
- Harden `fetchRecentActivity` error visibility

### Mock Data

None.

### Hardcoded Values

Admin role check relies on `profiles.role = 'admin'` (no hardcoded IDs).

### Edge Cases

- Missing chat tables → empty list (graceful)
- `markPayoutPaid` without audit trail

### Technical Debt

- `fetchTeacherPayouts` dead export in same module
- Activity feed composes multiple queries without unified error state

### Production Readiness

**85%**

---

## Analytics

### Status

🟡 **Partially Implemented**

### Database

Derived from competition and registration tables (no analytics-specific tables).

### Services

| Service | Analytics functions |
|---------|---------------------|
| `organizerDashboard.ts` | `OrganizerAnalytics`: registrations by category, revenue sum, attendance rate heuristic, academy count, judge completion rate |
| `registrationService.ts` | `fetchRegistrationStats` |
| `teacherEarnings.ts` | Teacher revenue snapshot (not platform-wide) |

### Repositories

None dedicated.

### API Endpoints

None.

### Workflows

| Workflow | Status |
|----------|--------|
| Organizer dashboard charts | **Partial** (heuristic attendance) |
| Platform-wide admin analytics | **Missing** |
| Ranking history analytics | **Partial** (read-only via `rankingService`) |
| Export CSV (registrations) | **Complete** |
| Event tracking / metrics pipeline | **Missing** |

### TODOs

- Dedicated `analyticsService` or warehouse integration
- Fix attendance rate to use check-in data when available

### Mock Data

None in analytics calculations (but inputs may be incomplete).

### Hardcoded Values

Heuristic formulas embedded in `organizerDashboard.ts`.

### Edge Cases

- Zero registrations → division-by-zero guards needed (verify in dashboard)

### Technical Debt

- Analytics logic coupled to organizer dashboard DTO

### Production Readiness

**30%**

---

## Cross-Cutting: Migration Map

| Migration | Domain |
|-----------|--------|
| `000_extensions_and_helpers.sql` | Triggers, `is_admin()`, auth hook |
| `001_core_schema.sql` | Profiles, teachers, bookings, schedules, community, legacy messages, payouts |
| `002_chat_and_orders.sql` | Direct chat, class orders, video calls |
| `003_marketplace_payouts.sql` | Platform settings, teacher payout private |
| `004_teacher_platform.sql` | Coupons, notifications, schedule changes, class sessions |
| `005_academy_domain.sql` | Academy full domain |
| `006_competition_domain.sql` | Competition 12 tables |
| `007_realtime_storage_admin.sql` | Realtime publications, storage buckets |
| `008_upgrade_from_legacy.sql` | Legacy DB patches only |

**Total tables with RLS enabled:** 40+ across migrations (all application tables).

---

## Cross-Cutting: Dead / Unwired Backend Exports

| Symbol | File | Notes |
|--------|------|-------|
| `academyMemberService` (all) | `academyMemberService.ts` | 0 importers |
| `batchService` (all) | `batchService.ts` | 0 importers |
| Most `academyService` exports | `academyService.ts` | Except `fetchAcademiesForUser` |
| `fetchTeacherPayouts` | `admin.ts` | 0 importers |
| `fetchCompetitionBySlug` | `competitionService.ts` | 0 importers |
| `recordRankingEntry` | `rankingService.ts` | 0 importers |
| `generateCertificatesForResults` | `organizerOperations.ts` | 0 importers |
| `verifyCertificateByQrToken` | `certificateService.ts` | No public verify route found |
| `isUserAssignedJudge` | `judgeService.ts` | 0 importers |
| `judgeService.submitScore` | `judgeService.ts` | Superseded by `judgeScoringService` |
| `messages.ts` + `useChatMessages` | Legacy booking chat | Orphaned UI |
| `fetchStudentConversation` / `fetchTeacherConversations` | `messages.ts` | Unused |

---

## Cross-Cutting: Pages Using Mock or Placeholder Data

| Page / Component | Data source | Backend impact |
|------------------|-------------|----------------|
| `CompetitionsPage` | `lib/constants.competitions` | Public list not DB-backed |
| `ExplorePage` → `CompetitionsTeaser` | Same constants | Teaser not DB-backed |
| `StudentDashboardPage` | `studentDashboard` + constants | Competition card mock |
| `TeacherDashboardPage` | `teacherDashboard` + constants | Competition widget mock |
| `/dashboard/academy/*` | Placeholder pages | Services exist, unused |
| `/dashboard/competitions/*` (foundation) | Placeholder pages | DB ready, UI stub |
| `/dashboard/results`, `/rankings`, `/certificates` (foundation) | Placeholder | Student routes use real services |
| `ShopPage` | Static “Coming Soon v2” | No backend |
| `NotificationDropdown` | Empty placeholder | No backend |
| `shell/SearchBar` | Disabled input | No backend |

---

## Overall Scores

### Module Backend Completion

| Module | Completion |
|--------|------------|
| Authentication | 95% |
| Student Dashboard | 60% |
| Teacher Dashboard | 65% |
| Academy | 70% |
| Competition | 85% |
| Judge | 90% |
| Organizer | 88% |
| Community | 92% |
| Chat | 85% |
| Live Classes | 90% |
| Payments | 75% |
| Payouts | 80% |
| Notifications | 45% |
| Admin | 88% |
| Analytics | 35% |
| **Weighted average** | **76%** |

### Module Production Readiness

| Module | Readiness |
|--------|-----------|
| Authentication | 88% |
| Student Dashboard | 55% |
| Teacher Dashboard | 60% |
| Academy | 18% |
| Competition | 70% |
| Judge | 85% |
| Organizer | 80% |
| Community | 88% |
| Chat | 82% |
| Live Classes | 85% |
| Payments | 70% |
| Payouts | 72% |
| Notifications | 40% |
| Admin | 85% |
| Analytics | 30% |
| **Weighted average** | **72%** |

---

## Top 20 Remaining Backend Tasks (Priority Order)

1. **Integrate Razorpay for competition entry fees** — replace `markRegistrationPaid` stub with real payment + webhook linkage to `competition_registrations`.
2. **Wire public `/competitions` and dashboard widgets to Supabase** — remove `lib/constants.competitions` dependency.
3. **Implement document upload service for competition registration** — Supabase Storage + metadata on `competition_participants`.
4. **Build academy UI against existing services** — activate `academyMemberService`, `batchService`, and academy routes.
5. **Auto-populate rankings after result publish** — call `recordRankingEntry` from organizer result workflow.
6. **Replace certificate `ed25519-placeholder` with real signing** — cryptographic verification + public verify endpoint using `verifyCertificateByQrToken`.
7. **Add student notifications table and service** — persist alerts currently computed in `studentCompetitionExperience`.
8. **Remove legacy booking chat stack** — deprecate `messages` table usage, delete `messages.ts` / `ChatWindow.tsx` after migration confirm.
9. **Consolidate academy service layer** — merge or wire `academyMemberService` / `batchService` to eliminate dead exports.
10. **Fix dashboard attendance metrics** — real check-in source or rename metrics to “scheduled sessions”.
11. **Wire `fetchStudentAcademyAssociation` into student dashboard** — replace `academyName: null`.
12. **Add competition payment idempotency and rollback** — transaction or compensating action on registration failure.
13. **Platform analytics service** — admin-level metrics beyond organizer dashboard heuristics.
14. **Durable rate limiting for API routes** — replace in-memory buckets for production multi-instance.
15. **PDF certificate generation pipeline** — storage + signed download URL.
16. **Remove DEV payment bypass in `payments.ts` for staging/production parity**.
17. **Wire `fetchTeacherPayouts` or remove** — teacher-facing payout history.
18. **Server-side judge score validation** — range/criteria enforcement beyond RLS.
19. **Admin competition oversight APIs/queries** — cross-competition moderation without Supabase dashboard.
20. **Delete or archive unused exports** — slug fetch, bulk certificate generator, legacy judge submit — reduce maintenance surface.

---

## Audit Notes

- **No literal `TODO` / `FIXME` / `@ts-ignore` comments** were found in backend service, repository, server, or API files at audit time.
- **“TODOs” in this report** refer to implicit gaps, placeholder implementations, dead code, and UI comments pointing to future modules.
- **Backend** in Yogstra is predominantly **Supabase client services** plus **five Vercel serverless functions**; there is no monolithic REST API layer.
- This audit did **not** execute migrations, run integration tests, or validate RLS policies against live roles (see `docs/production/SECURITY_REPORT.md` for client-side security review).
