# Implementation Plan — Yogstra V2 Product Redesign

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Prerequisite:** All product documentation complete (this folder)  
**Rule:** No code changes until this plan is approved

---

## Implementation Philosophy

1. **Terminology first** — lowest effort, highest perception impact
2. **Enrollment funnel** — core revenue flow redesign
3. **Dashboards** — daily experience for students and teachers
4. **Academy ops** — eliminate UUID friction
5. **Competition extensions** — build on existing strength
6. **Infrastructure** — unified enrollment model, notifications

---

## Sprint Breakdown

### Sprint 8.1 — Terminology & Navigation (1 week)

**Goal:** Yogstra stops sounding like a marketplace

| Task | Files | Priority |
|------|-------|----------|
| Create `terminology.ts` constants | `src/constants/terminology.ts` | P0 |
| Replace nav labels (student, teacher, academy) | `src/constants/mobileNav.ts`, sidebar configs | P0 |
| Replace CTAs on coach profile | `src/pages/TeacherProfilePage.tsx` | P0 |
| Rename BuyClassModal labels | `src/components/chat/BuyClassModal.tsx` | P0 |
| Update dashboard page titles | Various dashboard pages | P0 |
| Replace "Shop (Soon)" with Enrollments placeholder | Student nav | P0 |
| Fix "Training" → "My Programs" (no silent rename) | Student nav | P0 |
| Update public website copy | Landing, Explore, Pricing pages | P1 |

**Exit criteria:** No user-facing "Buy," "Shop," or "1-on-1" strings remain.

---

### Sprint 8.2 — Enrollment Funnel (2 weeks)

**Goal:** Replace BuyClassModal with guided enrollment

| Task | Files | Priority |
|------|-------|----------|
| Create EnrollmentFunnel component | `src/components/enrollment/` | P0 |
| Step 1: Choose Program | New program selector | P0 |
| Step 2: Choose Batch/Schedule | Batch picker with seats | P0 |
| Step 3: Review Details | Summary with policy | P0 |
| Step 4: Coupon & Price | Enhanced from BuyClassModal | P0 |
| Step 5: Razorpay integration | Reuse existing payment service | P0 |
| Step 6: Confirmation & Welcome | New confirmation page/modal | P0 |
| Wire funnel to coach profile CTAs | `TeacherProfilePage.tsx` | P0 |
| Wire funnel to academy profile | Academy public page | P1 |
| Trial class flow (free, abbreviated) | EnrollmentFunnel variant | P1 |
| Fix coupon server redemption | `server/fulfillPayment.ts` | P0 |
| Post-payment welcome overlay | Student dashboard | P1 |

**Exit criteria:** Student can enroll via 5-step funnel from coach profile; confirmation screen shown.

---

### Sprint 8.3 — Teacher Profile Premium (1.5 weeks)

**Goal:** Coach profile becomes flagship page

| Task | Files | Priority |
|------|-------|----------|
| Redesign layout: single scroll page | `TeacherProfilePage.tsx` | P0 |
| Hero section with sticky mobile CTA | Profile hero component | P0 |
| Programs & Batches section | Pull from teacher programs | P0 |
| Achievements & Credentials section | Existing data + formatting | P0 |
| Schedule preview (next 7 days) | Schedule service | P1 |
| Gallery & Videos section | New storage + upload in settings | P1 |
| FAQs & Policies section | New JSON field on teacher_profiles | P1 |
| Academy affiliations section | `teacher_academies` | P1 |
| SEO slugs (`/coach/:slug`) | Route + slug generation | P2 |

**Exit criteria:** Profile matches 04_TEACHER_PROFILE_SPEC layout; mobile sticky CTA works.

---

### Sprint 8.4 — Student Dashboard "Today" (1 week)

**Goal:** Dashboard answers "What do I do today?"

| Task | Files | Priority |
|------|-------|----------|
| Rename Home → Today | Route + nav | P0 |
| Today's Schedule section (next class + join) | Dashboard home | P0 |
| Today's Practice section | Placeholder (prep for assignments) | P1 |
| Coach Message section | Latest chat message | P0 |
| Coming Up section | Next 3-5 events | P0 |
| Progress summary widgets | Link to progress page | P1 |
| Competition widget with prep % | Dashboard | P1 |
| Renewal banner | Enrollment status check | P1 |
| Welcome overlay (post-enrollment) | First-login detection | P1 |
| My Programs page (consolidated) | Renamed from Classes/Training | P0 |
| Enrollments page (payment history) | New page | P1 |
| Progress page | New page | P2 |

**Exit criteria:** Today page shows prioritized daily actions; no silent nav renames.

---

### Sprint 8.5 — Teacher Programs & Dashboard (1.5 weeks)

**Goal:** Teachers manage programs, not pricing columns

| Task | Files | Priority |
|------|-------|----------|
| Programs page (create, list, manage) | New teacher page | P0 |
| Create Program flow (6 steps) | New component | P0 |
| Move pricing from Settings to Programs | Settings refactor | P0 |
| Enhanced overview (today, stats, actions) | Teacher dashboard | P1 |
| Onboarding checklist | New teacher prompt | P1 |
| Promotions page (renamed Coupons) | Existing page + UI polish | P1 |
| Enhanced earnings breakdown | Earnings page | P1 |
| Student detail view (attendance, progress) | Students page | P2 |
| Profile completion during pending | Pending page | P1 |

**Exit criteria:** Teacher can create named programs; overview shows action items.

---

### Sprint 8.6 — Academy Operations (2 weeks)

**Goal:** Academies run without UUIDs

| Task | Files | Priority |
|------|-------|----------|
| Academy onboarding flow (`/auth/academy`) | New auth route | P0 |
| Email-based teacher invite | Academy teachers page | P0 |
| Email-based student enrollment | Academy students page | P0 |
| Role-aware navigation | Academy sidebar config | P0 |
| Academy switcher dropdown | Header component | P1 |
| Batch-native timetable | Academy schedule page | P1 |
| Hybrid attendance (auto + manual) | Academy attendance page | P1 |
| Public academy profile enrollment | Academy public page | P1 |
| Enrollment request queue | Academy dashboard | P1 |
| Fix Get Started academy journey | `GetStartedPage.tsx` | P0 |

**Exit criteria:** Academy staff can enroll students by email; no UUID fields visible.

---

### Sprint 8.7 — Competition Extensions (1.5 weeks)

**Goal:** Seamless competition across roles

| Task | Files | Priority |
|------|-------|----------|
| Role gating: organizer workspace | Route guard | P0 |
| Role gating: judge workspace | Route guard | P0 |
| Organizer request flow (`/auth/organizer`) | New auth route | P1 |
| Entry fee payment in wizard | Competition registration | P1 |
| Coach affiliation step in wizard | Registration wizard | P1 |
| Coach prep tools (basic) | Teacher competition page | P1 |
| Student prep view on dashboard | Student competition widget | P2 |
| Judge session notification | Notification service | P2 |
| Fix Get Started organizer journey | `GetStartedPage.tsx` | P0 |

**Exit criteria:** Unassigned users cannot access organizer/judge; entry fees collectable.

---

### Sprint 8.8 — Unified Model & Polish (1 week)

**Goal:** Clean architecture for future growth

| Task | Files | Priority |
|------|-------|----------|
| Unified Discover page (coaches + academies + programs) | Public explore refactor | P1 |
| Unified enrollment data model | Migration + service layer | P1 |
| Terminology constants sweep (remaining strings) | Codebase-wide | P1 |
| Confirmation email (enrollment) | Email service | P2 |
| Renewal flow (banner + shortened funnel) | Student dashboard + funnel | P1 |
| Unified notification center | New component | P2 |
| Post-login routing consistency | Auth routing utils | P1 |
| Remove OAuth placeholders or implement | Login page | P2 |

**Exit criteria:** Consistent auth routing; renewal flow works; terminology complete.

---

## Database Migrations Needed

| Migration | Sprint | Description |
|-----------|--------|-------------|
| 011_teacher_programs | 8.5 | Programs table for teacher-owned offerings |
| 012_enrollments | 8.8 | Unified enrollment entity |
| 013_teacher_profile_extras | 8.3 | Gallery, FAQs, policies fields |
| 014_competition_fees | 8.7 | Entry fee + payment on registrations |
| 015_competition_prep | 8.7 | Preparation plans table |
| 016_organizer_requests | 8.7 | Organizer access requests |
| 017_academy_enrollment_requests | 8.6 | Student enrollment request queue |
| 018_schedules_batch_id | 8.6 | Use batch_id on schedules (column exists) |

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Enrollment model migration breaks payments | Critical | Parallel run: create enrollments from orders, don't delete orders |
| Teacher program creation scope creep | High | MVP: name, type, schedule, price only |
| Academy UUID removal breaks existing data | Medium | Keep UUID as fallback in API, hide in UI |
| Competition fee payment adds wizard complexity | Medium | Optional fee (₹0 = skip payment step) |
| Terminology change confuses existing users | Low | Changes are strictly better; no functional change |

---

## Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Enrollment funnel steps | 1 (modal) | 5–6 (guided) |
| Time to first enrollment (new student) | Unknown | < 5 min |
| UUID fields visible to users | 4+ forms | 0 |
| Marketplace terms in UI | 30+ | 0 |
| Empty workspace dead ends | 2 (organizer, judge) | 0 |
| Post-payment welcome | None | 100% of enrollments |
| Coach profile sections | 5 tabs | 9 sections |
| Student dashboard daily actions | 2 widgets | 5+ prioritized sections |

---

## Document Index

| Doc | Purpose |
|-----|---------|
| CURRENT_PRODUCT_ANALYSIS.md | Phase 1 — how it works today |
| UX_PROBLEMS.md | Phase 2 — what's broken |
| 01_COMPLETE_USER_JOURNEY.md | All role journeys |
| 02_INFORMATION_ARCHITECTURE.md | Site map, nav, URLs |
| 03_PRODUCT_FLOW_V2.md | Target product flows |
| 04_TEACHER_PROFILE_SPEC.md | Premium coach page |
| 05_STUDENT_ENROLLMENT_FLOW.md | Enrollment funnel |
| 06_PAYMENT_FLOW.md | Payment journey |
| 07_TEACHER_DASHBOARD_FLOW.md | Teacher workspace |
| 08_STUDENT_DASHBOARD_FLOW.md | Student workspace |
| 09_ACADEMY_FLOW.md | Academy operations |
| 10_COMPETITION_FLOW.md | Competition lifecycle |
| 11_TERMINOLOGY_GUIDE.md | Language standards |
| 12_IMPLEMENTATION_PLAN.md | This document |

---

## Approval Gate

**Implementation begins only after:**

1. ✅ All 14 product documents complete
2. ☐ User reviews and approves product direction
3. ☐ Sprint 8.1 scope confirmed as first implementation sprint

---

*Sprint 8 documentation complete. Ready for review.*
