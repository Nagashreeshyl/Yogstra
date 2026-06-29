# End-to-End Flow Report

**Date:** 2026-06-29  
**Method:** Static route + service trace (no live DB in CI)

---

## Flow 1: Student → Teacher → Live Class → Competition → Certificate

| Step | Route / Service | Status | Notes |
|---|---|---|---|
| Student registration | `/auth/student` → `signUpStudent` | ✅ Wired | Email confirm path handled |
| Find teacher | `/dashboard/student/teachers` → `fetchTeachers` | ✅ Wired | Filters + booking |
| Book class | `BuyClassModal` → `classOrders` + Razorpay | ✅ Wired | Dev mode skips payment |
| Live class | `/dashboard/student/classes/room/:sessionId` → `LiveClassRoom` + LiveKit | ✅ Wired | Requires LiveKit env |
| Browse competitions | `/dashboard/student/competitions` → `fetchStudentCompetitionHome` | ✅ Wired | |
| Register | `/register/:competitionId` → `completeStudentRegistration` | ✅ Wired | 7-step wizard + draft |
| Preparation | `/:competitionId/preparation` | ✅ Wired | Timeline + checklist |
| Live status | `/:competitionId/live` | ✅ Wired | |
| Results | `/dashboard/student/results` | ✅ Wired | Hub page |
| Certificate | `/dashboard/student/certificates` → `certificateService` | ✅ Wired | QR via qrcode chunk |

**Blockers for production E2E:** Supabase project, LiveKit credentials, Razorpay keys, competition data seeded.

---

## Flow 2: Teacher Registration → Verification → Students → Competition

| Step | Route / Service | Status | Notes |
|---|---|---|---|
| Register | `/auth/teacher/register` | ✅ Wired | |
| Pending gate | `/auth/teacher/pending` | ✅ Wired | Blocks dashboard until verified |
| Admin approval | `/admin/teachers` → `admin.ts` | ✅ Wired | Admin role required |
| Dashboard | `/dashboard/teacher` → `teacherDashboard.ts` | ✅ Wired | |
| Student list | `/dashboard/teacher/students` | ✅ Wired | Error/empty states added |
| Competition widget | Dashboard `DashboardCompetitionWidget` | ✅ Wired | Links to student competitions |

**Gap:** Teachers do not have a dedicated competition registration UI — they use student competition routes if registered as student role or via organizer assignment.

---

## Flow 3: Organizer → Competition → Judges → Results → Certificates

| Step | Route / Service | Status | Notes |
|---|---|---|---|
| Organizer dashboard | `/dashboard/organizer` → `organizerDashboard.ts` | ✅ Wired | Full dashboard |
| Create competition | `CreateCompetitionWizard` → `organizerOperations.ts` | ✅ Wired | |
| Assign judges | `JudgeAssignmentBoard` → `judgeService` | ✅ Wired | |
| Foundation results route | `/dashboard/results` | ⚠️ Stub | Placeholder page |
| Foundation certificates | `/dashboard/certificates` | ⚠️ Stub | Placeholder page |
| Student-facing results/certs | `/dashboard/student/results`, `/certificates` | ✅ Wired | Live for students |

**Gap:** Organizer/public results and certificate routes at `/dashboard/results` etc. are placeholders — student routes are live.

---

## Flow 4: Judge → Assignment → Live Scoring → Submission

| Step | Route / Service | Status | Notes |
|---|---|---|---|
| Judge home | `/dashboard/judge` → `JudgeDashboardPage` | ✅ Wired | |
| Session | `/dashboard/judge/session/:competitionId/:categoryId` | ✅ Wired | |
| Scoring | `judgeScoringService` + `useJudgeOfflineSync` | ✅ Wired | Offline queue |
| Submit scores | `judgeService` repositories | ✅ Wired | RLS-scoped |

**Blockers:** Judge must be assigned to competition/category in DB.

---

## Flow 5: Admin → Teacher Approval → Competition → Payouts

| Step | Route / Service | Status | Notes |
|---|---|---|---|
| Admin login | `/admin` + `RequireRole(['admin'])` | ✅ Wired | |
| Teacher approval | `/admin/teachers` | ✅ Wired | |
| Competition oversight | No dedicated admin competition UI | ⚠️ Gap | Use Supabase dashboard or organizer role |
| Payout review | `/admin/payouts` → `admin.ts` | ✅ Wired | Reads `teacher_payout_private` |

---

## Broken / incomplete flows

| Flow | Severity | Description |
|---|---|---|
| Public `/competitions` page | Low | Uses static `lib/constants` mock — not live Supabase data |
| Academy module | Expected | All `/dashboard/academy/*` routes are placeholders |
| Organizer results/certificates URLs | Medium | Stub pages; use organizer dashboard widgets or student routes for now |
| Admin competition management | Low | No admin UI — by design in current scope |

---

## Manual test script (staging)

1. Create student → book class → join live room (LiveKit).
2. Seed competition → register as student → complete wizard.
3. Assign judge → score participant → verify rankings update.
4. Approve results as organizer → download certificate as student.
5. Admin: verify teacher → review payout record.
