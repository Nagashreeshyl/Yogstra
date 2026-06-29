# Yogstra — UX Problems Audit

**Sprint 8 · Phase 2**  
**Date:** June 30, 2026  
**Method:** First-time user walkthrough simulation across all roles  
**Status:** Read-only — no code changes

---

## How to Read This Document

Each problem is tagged:

- **Severity:** Critical · High · Medium · Low
- **Role:** Student · Teacher · Academy · Organizer · Judge · All
- **Category:** Clicks · Confusion · Duplication · Onboarding · Terminology · Dead end · Missing state

---

## Cross-Cutting Problems (All Roles)

### XC-01 · Marketplace mental model persists
**Severity:** Critical · **Role:** All · **Category:** Terminology

Despite Sprint 7 repositioning Yogstra as "Operating System for Yoga Academies & Competitions," the product still uses marketplace language everywhere: "Buy Online Class," "1-on-1," "1-to-many," "Proceed to Pay," "Find Teachers," "Request Teacher." Users expect a training institution, not an e-commerce checkout.

### XC-02 · Internal architecture exposed in navigation
**Severity:** High · **Role:** Teacher · **Category:** Confusion

Teachers see workspace switcher options (Academy, Organizer, Judge) even when they have no assignments. Empty dashboards create dead ends and erode trust.

### XC-03 · Inconsistent post-login routing
**Severity:** Medium · **Role:** All · **Category:** Confusion

`/auth/login` uses workspace picker; `/auth/teacher` and `LoggedInRedirect` skip it. Users land in different places depending on entry point.

### XC-04 · Get Started journeys are incomplete
**Severity:** High · **Role:** All · **Category:** Onboarding · Dead end

| Journey card | Routes to | Expected |
|--------------|-----------|----------|
| Learn Yoga | Student auth | ✓ Correct |
| Teach Yoga | Teacher register | ✓ Correct |
| Manage an Academy | Student auth | ✗ Should be academy onboarding |
| Organize Competitions | Teacher register | ✗ Should be organizer onboarding |

### XC-05 · No unified notification experience
**Severity:** Medium · **Role:** All · **Category:** Missing state

Teacher notifications (DB), competition notifications (derived), chat unread (realtime), and dashboard alerts (computed) are fragmented. No single notification center. Preferences are localStorage-only — no email/push.

### XC-06 · OAuth placeholders visible
**Severity:** Low · **Role:** All · **Category:** Confusion

Login page shows disabled Google/Apple buttons — looks unfinished.

---

## Student UX Problems

### S-01 · "Buy Online Class" is the primary CTA
**Severity:** Critical · **Category:** Terminology · Confusion

Teacher profile and chat both lead with "Buy Online Class" / "Proceed to Pay." No trial class, no program comparison, no batch selection. Feels like purchasing a product, not joining a training program.

### S-02 · No academy discovery on Explore
**Severity:** High · **Category:** Dead end

Explore page shows teachers + community + competition teaser but **no academies**. Academies only appear on separate `/academies` page. Students cannot compare teachers vs academies in one place.

### S-03 · Payment modal is too simple
**Severity:** Critical · **Category:** Clicks · Confusion

BuyClassModal asks: class type, duration, date, time, coupon → pay. Missing: program description, coach credentials summary, schedule preview, seat availability, what's included, cancellation policy, confirmation preview.

### S-04 · No post-payment welcome experience
**Severity:** High · **Category:** Missing state

After Razorpay success, modal closes. No welcome screen, no "what happens next," no calendar add, no coach introduction. Student must discover Classes nav themselves.

### S-05 · "Training" nav label changes silently
**Severity:** Medium · **Category:** Confusion

Before payment: nav shows "Training" → teachers list. After payment: same slot becomes "Classes." No explanation of the change.

### S-06 · Shop/Payments nav marked "Soon"
**Severity:** Medium · **Category:** Dead end

Student has a Payments nav item that goes nowhere useful. Actual payment happens inside chat/profile modal — inconsistent.

### S-07 · Teacher profile lacks depth
**Severity:** High · **Category:** Duplication · Confusion

Profile has 5 tabs but missing: programs/batches, upcoming sessions, gallery, videos, FAQs, policies, competition coaching, academy affiliations, availability calendar. Cannot compare teachers meaningfully.

### S-08 · No trial or intro class flow
**Severity:** High · **Category:** Dead end

"Request Teacher" sends a chat intro — not a structured trial booking. No free trial, no demo session, no "Book Trial Class" with calendar.

### S-09 · Competition registration disconnected from coaching
**Severity:** Medium · **Category:** Confusion

Student can register for competitions independently of their coach/academy. No "register with my academy batch" or "my coach registers me" flow.

### S-10 · Student dashboard doesn't answer "What do I do today?"
**Severity:** High · **Category:** Confusion

Dashboard shows welcome, streak, next class widget, coach feedback, competition widget — but not prioritized as a daily action list. No "Today's Practice," "Today's Assignment," "Coach Message" prominence.

### S-11 · No attendance or progress tracking for student
**Severity:** Medium · **Category:** Missing state

Student cannot see their own attendance history, progress reports, or achievements beyond competition certificates.

### S-12 · Chat required before purchase
**Severity:** Medium · **Category:** Clicks

BuyClassModal requires an existing chat thread. Extra step if student wants to pay directly from profile without messaging first.

---

## Teacher UX Problems

### T-01 · Registration doesn't auto-login
**Severity:** High · **Category:** Onboarding · Dead end

After 3-step registration, teacher sees thank-you page → home. Must wait for admin approval with no dashboard preview, no "complete your profile while waiting" flow.

### T-02 · Pending page is passive
**Severity:** Medium · **Category:** Missing state

Polls every 10s. No estimated wait time, no profile completion checklist, no preview of dashboard features.

### T-03 · Settings buried pricing setup
**Severity:** High · **Category:** Clicks

Students cannot pay until teacher sets pricing in Settings → Pricing tab. No onboarding prompt, no "set your fees to start accepting students" banner on dashboard.

### T-04 · No batch/program creation for teachers
**Severity:** Critical · **Category:** Missing state · Terminology

Teachers can only offer "1-on-1" or "Group" coaching via pricing columns. Cannot create named programs: "Foundation Batch," "Weekend Camp," "Competition Prep." Academy batches exist but are separate from teacher offerings.

### T-05 · Earnings page disconnected from business context
**Severity:** Medium · **Category:** Confusion

Shows revenue numbers without student names, program breakdown, or payout timeline context.

### T-06 · Coupon flow is developer-facing
**Severity:** Medium · **Category:** Confusion

Teachers generate codes like `YOGA-A1B2C3` and send via chat. No visual coupon builder, no "offer 20% off Foundation Program" campaign UI.

### T-07 · Competition coaching is read-only list
**Severity:** Medium · **Category:** Missing state

Teacher competitions page shows student registrations but no coaching tools: preparation plans, assignment of practice routines, progress tracking.

### T-08 · Community is platform-wide, not teacher-branded
**Severity:** Low · **Category:** Confusion

Teacher community page is same global feed — no teacher-specific announcements or student group posts.

---

## Academy UX Problems

### A-01 · UUID-based forms
**Severity:** Critical · **Category:** Confusion · Clicks

Creating batches and enrolling students requires pasting UUIDs. No email picker, no name search, no student directory integration.

### A-02 · No academy switcher in UI
**Severity:** High · **Category:** Clicks

Users with multiple academies rely on localStorage auto-selection. No header dropdown to switch context.

### A-03 · No role-aware navigation
**Severity:** High · **Category:** Confusion

All academy nav items visible to any teacher/admin regardless of member role (owner vs receptionist vs finance_manager). RLS blocks unauthorized actions but UI doesn't hide them.

### A-04 · No student-facing academy experience
**Severity:** Critical · **Category:** Dead end

Academy dashboard is staff-only. Students enrolled in batches see only `academyName` on welcome widget — no academy portal, schedule, announcements, or batchmates view.

### A-05 · Finance is aggregate, not actionable
**Severity:** Medium · **Category:** Missing state

Finance page sums class orders for affiliated teachers. No invoicing, no fee collection from batch students, no academy billing account.

### A-06 · Timetable not batch-native
**Severity:** High · **Category:** Duplication

Timetable pulls individual teacher booking schedules, not batch roster schedules. `schedules.batch_id` column exists but is unused.

### A-07 · Attendance proxy is weak
**Severity:** Medium · **Category:** Missing state

Attendance derived from live session `started_at` — not manual roll call, not batch check-in, not QR-based attendance.

### A-08 · No public enrollment flow
**Severity:** Critical · **Category:** Dead end

Public academy profile → "Join Academy" → generic auth. No "Request Enrollment," no visible batches, no seat count.

### A-09 · Email invites don't reach non-users
**Severity:** Medium · **Category:** Dead end

Invite by email only works if profile exists. No invitation email to new users.

---

## Organizer UX Problems

### O-01 · Any teacher can access organizer workspace
**Severity:** High · **Category:** Confusion · Dead end

Route guard allows all teachers. Unassigned users see empty organizer dashboard with no explanation.

### O-02 · No organizer onboarding
**Severity:** High · **Category:** Onboarding

No dedicated signup, verification, or "request organizer access" flow. Organizer role is implicit.

### O-03 · Competition creation is powerful but isolated
**Severity:** Medium · **Category:** Confusion

Create wizard is comprehensive but disconnected from academy batch registration and teacher coaching workflows.

---

## Judge UX Problems

### J-01 · Same route guard issue as organizer
**Severity:** High · **Category:** Dead end

Any teacher can open judge workspace without assignment.

### J-02 · Judge session is strong but discovery is weak
**Severity:** Medium · **Category:** Clicks

Judge must navigate to workspace → find assignment card → enter session. No notification push, no "your session starts in 30 min" alert.

---

## Payment UX Problems

### P-01 · Single-step checkout
**Severity:** Critical · **Category:** Clicks · Confusion

Current: Configure → Pay. Missing: Choose Program → Choose Batch → See Schedule → See Coach → See Seats → Apply Coupon → Review → Pay → Confirm → Welcome.

### P-02 · No payment history for students
**Severity:** High · **Category:** Missing state

No receipts page, no enrollment history, no renewal reminders.

### P-03 · No renewal flow
**Severity:** High · **Category:** Dead end

When 1-week or 1-month period ends, no prompt to renew. "Buy Class" button reappears silently.

### P-04 · Competition entry fees not integrated
**Severity:** High · **Category:** Missing state

Competition registration completes without payment step.

### P-05 · Coupon redemption may not complete server-side
**Severity:** Medium · **Category:** Missing state

Known bug: server fulfillment may not mark coupon as used.

---

## Terminology Problems (Marketplace → Academy)

| Current term | Problem | Should become |
|--------------|---------|---------------|
| Buy Online Class | E-commerce language | Join Program / Enroll |
| 1-on-1 | Generic | Personal Coaching |
| 1-to-many / Group | Generic | Training Batch |
| Proceed to Pay | Transactional | Confirm Enrollment |
| Find Teachers | Marketplace listing | Discover Coaches |
| Request Teacher | Informal | Request Introduction |
| Training (nav) | Vague | My Programs |
| Shop | E-commerce | Enrollments |
| Bookings (admin) | Generic | Enrollments |
| Class order | Internal | Enrollment record |
| Buy Class (chat) | E-commerce | Enroll in Program |

---

## Missing States Summary

| State | Who needs it | Current |
|-------|--------------|---------|
| Post-payment welcome | Student | ✗ Missing |
| Enrollment confirmation email | Student | ✗ Missing |
| Trial class booked | Student | ✗ Missing |
| Profile completion while pending | Teacher | ✗ Missing |
| "Set your pricing" prompt | Teacher | ✗ Missing |
| Academy enrollment request | Student | ✗ Missing |
| Batch seat availability | Student | ✗ Missing |
| Renewal reminder | Student | ✗ Missing |
| Payment receipt | Student | ✗ Missing |
| Organizer access request | Teacher | ✗ Missing |
| Judge session reminder | Judge | ✗ Missing |
| Attendance marked | Academy | Partial (live session proxy) |
| Progress report | Student/Teacher | ✗ Missing |

---

## Dead Ends Summary

1. Get Started → "Manage Academy" → student signup
2. Get Started → "Organize Competitions" → teacher register
3. Public academy profile → auth (no enrollment)
4. Student Shop/Payments → "Soon"
5. Organizer/Judge workspace without assignment
6. Academy batch create with UUID fields
7. Competition registration without payment
8. Teacher register → thank you → home (no login)

---

## Duplicated Information

| Information | Appears in |
|-------------|------------|
| Teacher profile | Public profile, student dashboard teachers, explore, chat header |
| Competition list | Public, student dashboard, explore teaser, teacher page |
| Schedule | Teacher schedule, student classes, academy timetable (different sources) |
| Student list | Teacher students, academy students, admin students |
| Earnings/revenue | Teacher earnings, admin reports, academy finance |

---

## Priority Matrix for Redesign

| Priority | Count | Examples |
|----------|-------|---------|
| **P0 — Must fix** | 12 | Terminology, payment flow, academy UUID forms, teacher profile depth, post-payment welcome |
| **P1 — Should fix** | 15 | Explore academies, trial class, student dashboard daily view, role-aware nav |
| **P2 — Nice to have** | 10 | OAuth, community depth, coupon builder UI, email invites |

---

*Next: See `03_PRODUCT_FLOW_V2.md` and numbered flow specs for the redesigned product experience.*
