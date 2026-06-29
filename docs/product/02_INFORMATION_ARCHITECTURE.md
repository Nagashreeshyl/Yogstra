# Information Architecture — Yogstra V2

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Principle:** Navigation reflects user goals, not database entities

---

## IA Principles

1. **Goal-oriented navigation** — "What do I want to do?" not "What table does this map to?"
2. **Progressive disclosure** — Show depth only when needed
3. **Role isolation** — Each workspace has its own nav; no cross-contamination
4. **Public vs authenticated** — Clear separation between discovery and action
5. **No internal architecture** — Never expose UUIDs, table names, or system concepts

---

## Site Map (Redesigned)

```
YOGSTRA
│
├── PUBLIC (unauthenticated)
│   ├── Home (/)
│   ├── Discover (/discover)          ← unified explore: coaches + academies + programs
│   │   ├── Coaches (/discover/coaches)
│   │   ├── Academies (/discover/academies)
│   │   ├── Programs (/discover/programs)
│   │   └── Competitions (/discover/competitions)
│   ├── Coach Profile (/coach/:slug)
│   ├── Academy Profile (/academy/:slug)
│   ├── Competition Detail (/competition/:slug)
│   ├── Community (/community)
│   ├── Pricing (/pricing)
│   ├── About (/about)
│   ├── Contact (/contact)
│   ├── Help (/help)
│   └── Legal (terms, privacy)
│
├── AUTH (/auth)
│   ├── Get Started (/auth/get-started)
│   ├── Login (/auth/login)
│   ├── Student Sign Up (/auth/student)
│   ├── Teach on Yogstra (/auth/teach)
│   ├── Academy Setup (/auth/academy)       ← NEW
│   ├── Organizer Request (/auth/organizer) ← NEW
│   └── Workspace Picker (/auth/workspace)
│
├── STUDENT WORKSPACE (/app/student)
│   ├── Today (/app/student)                ← renamed from "Home"
│   ├── My Programs (/app/student/programs)
│   ├── Schedule (/app/student/schedule)
│   ├── Messages (/app/student/messages)
│   ├── Competitions (/app/student/competitions)
│   │   ├── Browse
│   │   ├── My Registrations
│   │   ├── Results
│   │   └── Certificates
│   ├── Discover (/app/student/discover)    ← in-app discovery
│   ├── Progress (/app/student/progress)    ← NEW: attendance, achievements
│   ├── Enrollments (/app/student/enrollments) ← renamed from "Shop"
│   └── Settings (/app/student/settings)
│
├── TEACHER WORKSPACE (/app/teacher)
│   ├── Overview (/app/teacher)
│   ├── Students (/app/teacher/students)
│   ├── Programs (/app/teacher/programs)    ← NEW: batches, courses
│   ├── Schedule (/app/teacher/schedule)
│   ├── Classes (/app/teacher/classes)
│   ├── Messages (/app/teacher/messages)
│   ├── Competitions (/app/teacher/competitions)
│   ├── Earnings (/app/teacher/earnings)
│   ├── Promotions (/app/teacher/promotions) ← renamed from "Coupons"
│   └── Settings (/app/teacher/settings)
│
├── ACADEMY WORKSPACE (/app/academy)
│   ├── Overview (/app/academy)
│   ├── Programs & Batches (/app/academy/programs)
│   ├── Students (/app/academy/students)
│   ├── Teachers (/app/academy/teachers)
│   ├── Schedule (/app/academy/schedule)     ← renamed from "Timetable"
│   ├── Attendance (/app/academy/attendance)
│   ├── Finance (/app/academy/finance)
│   ├── Competitions (/app/academy/competitions)
│   ├── Members (/app/academy/members)
│   └── Settings (/app/academy/settings)
│
├── ORGANIZER WORKSPACE (/app/organizer)     ← gated by assignment
│   ├── Overview (/app/organizer)
│   ├── Competitions (/app/organizer/competitions)
│   ├── Create (/app/organizer/create)
│   ├── Registrations (/app/organizer/registrations)
│   ├── Judges (/app/organizer/judges)
│   ├── Results (/app/organizer/results)
│   └── Settings (/app/organizer/settings)
│
├── JUDGE WORKSPACE (/app/judge)             ← gated by assignment
│   ├── Assignments (/app/judge)
│   ├── Active Session (/app/judge/session/:id)
│   └── History (/app/judge/history)
│
└── ADMIN (/admin)                           ← platform admin only
    ├── Overview
    ├── Teachers
    ├── Students
    ├── Academies
    ├── Competitions
    ├── Enrollments                          ← renamed from "Bookings"
    ├── Payouts
    ├── Reports
    └── Settings
```

---

## Navigation by Role

### Student — Mobile (Bottom Tab Bar)

| Tab | Icon | Destination |
|-----|------|-------------|
| Today | Home | Daily action dashboard |
| Programs | Book | My enrolled programs |
| Schedule | Calendar | Upcoming classes |
| Messages | Chat | Coach conversations |
| More | Menu | Competitions, Discover, Progress, Enrollments, Settings |

### Student — Desktop (Sidebar)

```
Today
My Programs
Schedule
Messages
─────────────
Competitions
Discover
Progress
Enrollments
─────────────
Settings
```

### Teacher — Desktop

```
Overview
Students
Programs          ← NEW
Schedule
Classes
Messages
─────────────
Competitions
Earnings
Promotions
─────────────
Settings
```

### Academy — Desktop (Role-Aware)

| Nav Item | Owner | Manager | Teacher | Receptionist | Finance |
|----------|-------|---------|---------|--------------|---------|
| Overview | ✓ | ✓ | ✓ | ✓ | ✓ |
| Programs | ✓ | ✓ | ✓ | — | — |
| Students | ✓ | ✓ | ✓ | ✓ | — |
| Teachers | ✓ | ✓ | — | — | — |
| Schedule | ✓ | ✓ | ✓ | ✓ | — |
| Attendance | ✓ | ✓ | ✓ | ✓ | — |
| Finance | ✓ | ✓ | — | — | ✓ |
| Members | ✓ | — | — | — | — |
| Settings | ✓ | ✓ | — | — | — |

---

## Content Hierarchy

### Coach Public Profile (see 04_TEACHER_PROFILE_SPEC)

```
Hero (photo, name, tagline, CTA)
├── About (bio, specializations, experience)
├── Programs (batches, personal coaching, competition camps)
├── Schedule (upcoming sessions, availability)
├── Achievements (certifications, competition wins, students trained)
├── Gallery & Videos
├── Reviews
├── Academies (affiliations)
├── FAQs & Policies
└── Contact (chat, book trial, enroll)
```

### Academy Public Profile

```
Hero (logo, name, location, CTA)
├── About (mission, facilities, history)
├── Programs & Batches (open enrollment)
├── Our Coaches (linked profiles)
├── Schedule (public timetable)
├── Gallery
├── Reviews
├── Competitions (participation history)
└── Enroll (request enrollment)
```

---

## URL Strategy

| Pattern | Example | Notes |
|---------|---------|-------|
| `/discover/coaches` | List | Filterable |
| `/coach/priya-sharma` | Profile | Slug from name |
| `/academy/shanti-yoga-academy` | Profile | Slug from name |
| `/competition/national-yoga-2026` | Detail | Slug from title |
| `/app/student` | Dashboard | Authenticated |
| `/app/teacher/programs/foundation-batch` | Program detail | Nested |

**Migration note:** Current `/dashboard/student` → `/app/student` (optional, can keep existing paths initially)

---

## Search & Discovery

### Unified Discover Page

Single entry point with tabs:
- **Coaches** — filter by style, location, price, rating, availability
- **Academies** — filter by location, programs offered, rating
- **Programs** — filter by type (batch, personal, competition camp), level, price
- **Competitions** — filter by date, location, level

### Compare Mode (Future)

Side-by-side comparison of up to 3 coaches or academies on: price, schedule, reviews, specializations.

---

## Information Relationships

```
Coach ──────┬── Programs (batches, personal coaching, camps)
            ├── Academies (affiliations)
            ├── Students (enrolled)
            └── Competitions (coaching)

Academy ────┬── Programs & Batches
            ├── Teachers (members)
            ├── Students (enrolled)
            └── Competitions (participation)

Student ────┬── Enrollments (programs)
            ├── Schedule (classes)
            ├── Coach(es)
            ├── Academy (if applicable)
            └── Competitions (registrations)

Competition ┬── Organizer
            ├── Judges
            ├── Participants (students)
            └── Academies (team entries)
```

---

*See 03_PRODUCT_FLOW_V2.md for end-to-end flows through this architecture*
