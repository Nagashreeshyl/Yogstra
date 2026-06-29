# Yogstra — Current Product Analysis

**Sprint 8 · Phase 1**  
**Date:** June 30, 2026  
**Status:** Read-only audit — no code changes  
**Purpose:** Document how Yogstra works today before any redesign

---

## Executive Summary

Yogstra V2 is a multi-role yoga platform built as a React + Vite SPA on Supabase, with Razorpay payments and LiveKit video. It has evolved from a **teacher marketplace** (Sprint 1–5) into a broader **academy + competition operating system** (Sprint 3–7), but the **core student–teacher coaching flow still behaves like a marketplace**: discover → chat → buy class → attend live session.

The product has **three partially integrated domains**:

1. **Coaching marketplace** — student ↔ teacher bookings, Razorpay, live classes, coupons
2. **Academy operations** — batches, members, finance, attendance (teacher/admin console)
3. **Competition platform** — registration wizard, judge scoring, organizer dashboard, certificates

These domains share auth and profiles but have **different mental models, terminology, and entry points**.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, React Router, Tailwind V2 tokens |
| Backend | Supabase (PostgreSQL + RLS + Auth + Realtime + Storage) |
| Payments | Razorpay (+ optional Route split to teachers) |
| Video | LiveKit (class sessions + direct DM video calls) |
| Deployment | Vercel (SPA + 5 serverless API routes) |

---

## User Roles & Identity

### Platform roles (`profiles.role`)

| Role | Count of workspaces | Route access |
|------|---------------------|--------------|
| **student** | 1 (Student dashboard) | `/dashboard/student/*` |
| **teacher** | 4 (Teacher, Academy, Organizer, Judge) | Verified teacher routes + foundation competition/academy |
| **admin** (DB) | Varies | Gated by email allowlist for `/admin` |

### Special cases

- **Platform admin:** Only `nagashreeshyl@gmail.com` gets `/admin` and all 6 workspace views
- **Teacher verification:** `pending` → blocked; `verified` → full access; `rejected`/`removed` → pending page
- **Academy member roles:** owner, manager, teacher, assistant_teacher, receptionist, finance_manager (in-academy permissions, not route registration)
- **Competition roles:** organizer (by assignment), judge (by assignment), participant (by registration)

---

## Route Architecture

### Public (marketing + discovery)
`/` Landing · `/explore` · `/teachers` · `/academies` · `/competitions` · `/community` · `/pricing` · `/help` · legal pages

### Authentication
`/auth/get-started` (4 journeys) · `/auth/login` · `/auth/student` · `/auth/teacher` · `/auth/teacher/register` · `/auth/teacher/pending` · `/auth/workspace`

### Student dashboard (`/dashboard/student`)
Home · Explore · Teachers · Community · Competitions (nested) · Results · Certificates · Rankings · Shop (Soon) · Messages · Classes · Settings

### Teacher dashboard (`/dashboard/teacher`)
Home · Students · Schedule · Classes · Messages · Notifications · Coupons · Earnings · Competitions · Community · Settings

### Academy dashboard (`/dashboard/academy`)
Home · Teachers · Students · Batches · Members · Finance · Timetable · Attendance · Competitions · Settings

### Competition ops
Organizer (`/dashboard/organizer`) · Judge (`/dashboard/judge`) · Shared results/rankings/certificates

### Platform admin (`/admin`)
Teachers · Students · Bookings · Schedules · Payouts · Chats · Community · Academies · Competitions · Reports · Audit · Settings

---

## Database Entity Map

### Identity & marketplace (001, 003)
- `profiles`, `teacher_profiles`, `categories`
- `bookings` — ongoing student–teacher enrollment
- `schedules` — calendar slots
- `payouts`, `platform_settings`, `teacher_payout_private`

### Chat & orders (002, 004)
- `chat_threads`, `direct_messages`, `chat_thread_reads`, `chat_thread_settings`, `chat_reports`
- `class_orders` — Razorpay purchase records
- `teacher_coupons`, `coupon_deliveries`
- `teacher_notifications`, `schedule_change_requests`
- `class_sessions`, `direct_video_calls`

### Academy (005)
- `academies` → `academy_members`, `teacher_academies`, `batches` → `batch_students`

### Competition (006)
- `competitions` → events, categories, divisions, registrations, participants, judges, scores, results, certificates, rankings, announcements

### Community (001)
- `posts`, `comments`

---

## Current User Journeys

### Student journey (as implemented)

```
Sign up (/auth/student)
  → Dashboard home
  → Discover teachers (/teachers or /explore)
  → View teacher profile (tabs: About, Style, Achievements, Pricing, Reviews)
  → [Optional] Request teacher (intro message in chat)
  → [Optional] Message teacher
  → Buy Online Class (BuyClassModal)
       → Select: 1-on-1 or Group, 1 week or 1 month, start date, time
       → Apply coupon (if teacher sent one)
       → Razorpay payment
  → Post-payment: schedule created, booking activated, chat confirmation card
  → "Training" nav becomes "Classes" (after paid booking)
  → Attend live class (LiveKit)
  → [Parallel] Register for competitions (7-step wizard)
```

**Parallel paths:** Community feed, competition registration, certificate verification, student settings.

### Teacher journey (as implemented)

```
Register (/auth/teacher/register) — 3-step form
  → Wait for admin approval (/auth/teacher/pending, polls every 10s)
  → Admin approves at /admin/teachers
  → Teacher dashboard
  → Complete profile + pricing in Settings
  → Receive booking notifications + chat confirmation
  → Manage students, schedule, live classes
  → Send coupons, track earnings
  → [Optional] Coach students in competitions
  → [Optional] Switch to Academy / Organizer / Judge workspace
```

### Academy journey (as implemented)

```
Teacher logs in → switch to Academy workspace
  → If no academy: Create academy form
  → If has academy: Dashboard with stats
  → Invite teachers (email/UUID)
  → Create batches (requires teacher UUID)
  → Enroll students (requires student UUID)
  → View finance (aggregated class orders)
  → View timetable/attendance (derived from teacher bookings, not batch-native)
  → View competition participation summary (read-only)
```

**Public path:** Browse `/academies` → view profile → "Join Academy" → `/auth/get-started` (no enrollment flow).

### Competition journey (as implemented)

```
Organizer: Create competition wizard → publish → manage registrations/judges/results
Student: Browse → 7-step registration wizard → preparation → live status → results/certificates
Judge: Assignment cards → session scoring (offline sync)
Teacher: View coaching students' registrations
Academy: Read-only participation stats
Admin: Oversight at /admin/competitions
```

**Gap:** Competition entry fees not integrated with Razorpay; documents partially stubbed.

### Organizer / Judge journey

```
Any verified teacher can open /dashboard/organizer or /dashboard/judge (route guard is platform-role only)
  → If not assigned: empty states
  → If assigned: full operational tools
```

---

## Payment Flow (current)

```
BuyClassModal
  → fetchTeacherFee (from teacher_profiles pricing columns)
  → validateStudentCoupon (optional)
  → POST /api/razorpay-order
       → validatePendingOrderRequest (thread, fee, coupon, verified teacher)
       → prepareOrderSplit (platform commission from platform_settings)
       → INSERT class_orders (pending)
       → Razorpay order created
  → Razorpay Checkout (client)
  → POST /api/razorpay-fulfill
       → verify signature
       → fulfillPaidClassOrder:
            INSERT schedules
            UPDATE class_orders → paid
            INSERT payouts
            UPSERT bookings → active
            INSERT direct_messages (booking card)
            INSERT teacher_notifications
  → Webhook (parallel): payment.captured → same fulfillment
```

**Dual concepts:**
- `class_orders` = single transaction (hides "Buy Class" for duration window)
- `bookings` = ongoing enrollment (unlocks Classes nav + live access)

**Known bug:** Server fulfillment may not call `redeem_coupon` RPC — coupon deliveries may stay unused after payment.

---

## Messaging & Video

### Direct chat
- Student ↔ teacher threads (auto-accepted for same-role pairs)
- Chat request flow for cross-role pairs requiring acceptance
- Realtime subscriptions, unread counts, mute/block/hide
- Video calls via LiveKit (`direct_video_calls` table)
- Buy class from chat header

### Live classes
- Teacher starts session → student rings → both join LiveKit room
- `class_sessions` table tracks status (ringing → active → ended)
- Academy attendance derived from ended sessions with `started_at`

---

## Notifications

| Type | Storage | Trigger |
|------|---------|---------|
| Class booking | `teacher_notifications` | Payment fulfilled |
| Schedule change | `teacher_notifications` | Student request |
| Competition (judge) | Derived at read | Judge assignment |
| Competition (student) | Derived at read | Registration status, results, certificates |
| Chat unread | Realtime + read receipts | New messages |

Preferences stored in localStorage only — no email/push delivery.

---

## Admin Capabilities

- Verify/reject/remove teachers
- View all bookings, schedules, orders, payouts
- Mark payouts paid manually
- Set platform commission %
- Moderate community (pin/delete posts)
- Review chat reports
- Academy and competition oversight
- Audit log (registrations + bookings)

---

## Terminology Currently in Use

| UI term | Code/DB term | Domain |
|---------|--------------|--------|
| Buy Online Class | `class_orders` | Marketplace |
| 1-on-1 / Group | `class_type: '1:1' \| 'group'` | Marketplace |
| 1 week / 1 month | `duration: 'week' \| 'month'` | Marketplace |
| Training (nav) | Pre/post pay coaching | Student |
| Classes | Live sessions | Both |
| Booking | `bookings` table | Enrollment |
| Batch | `batches` table | Academy |
| Registration | `competition_registrations` | Competition |
| Request Teacher | Intro message | Marketplace |
| Proceed to Pay | Razorpay checkout | Payment |
| Shop / Payments | `/shop` (Soon badge) | Unimplemented |

---

## Integration Gaps Between Domains

| Gap | Impact |
|-----|--------|
| Academy batches ≠ coaching bookings | Student can be in batch but not have paid coaching |
| Timetable not batch-native | Academy schedule pulls teacher bookings, not batch roster |
| Competition fees ≠ Razorpay | Registration completes without payment |
| Teacher workspace shows organizer/judge without assignment | Confusing empty states |
| Get Started "Academy" journey → student auth | No academy onboarding |
| Public academy profile → auth | No enrollment request |
| UUID forms in academy | Staff must know internal IDs |
| Dual post-login routing | Workspace picker skipped on some paths |

---

## Maturity Assessment

| Domain | Backend | Frontend | UX coherence |
|--------|---------|----------|----------------|
| Coaching marketplace | 85% | 80% | Marketplace framing |
| Academy operations | 75% | 70% | Admin console, not student-facing |
| Competition platform | 80% | 85% | Strongest end-to-end flow |
| Public marketing | 70% | 75% | Sprint 7 redesign, CTAs incomplete |
| Auth & workspaces | 80% | 75% | Journey picker gaps |
| Payments | 90% | 80% | Works but "Buy Now" UX |
| Messaging & video | 85% | 80% | Functional, chat-heavy |

---

## Key File References

| Area | Path |
|------|------|
| Routes | `src/App.tsx` |
| Auth | `src/services/auth.ts`, `src/utils/authRouting.ts` |
| Payments | `src/services/payments.ts`, `server/fulfillPayment.ts` |
| Class orders | `src/services/classOrders.ts` |
| Academy | `src/hooks/useAcademyContext.tsx`, `src/services/academyService.ts` |
| Competition | `src/repositories/competitionRepository.ts` |
| Migrations | `supabase/migrations/001–010` |
| Sprint 7 public | `docs/design/PUBLIC_V2_REPORT.md` |
| Backend audit | `docs/audit/BACKEND_COMPLETION_AUDIT.md` |

---

*This document describes Yogstra as it exists today. See `UX_PROBLEMS.md` for identified issues and `03_PRODUCT_FLOW_V2.md` for the proposed redesign.*
