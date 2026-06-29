# Navigation Map — Yogstra V2

**Sprint 12 · Terminology Audit**  
**Date:** June 30, 2026

---

## Public Navigation

| Label | Route | Notes |
|-------|-------|-------|
| Discover | `/discover` | Coaches, academies, community |
| Academies | `/academies` | Public academy listings |
| Competitions | `/competitions` | Public competition listings |
| How It Works | `/how-it-works` | Student + Teacher only |
| Help | `/help` | Help Center + FAQs |
| Get Started | `/auth/get-started` | Student or Teacher |

**Removed from signup:** Separate Academy / Organizer journeys

---

## Student Dashboard

| Label | Route |
|-------|-------|
| Today | `/dashboard/student` |
| My Programs | Training hub |
| Discover | `/dashboard/student/explore` |
| My Coaches | `/dashboard/student/teachers` |
| Competitions | `/dashboard/student/competitions` |
| Messages | `/dashboard/student/messages` |
| Community | `/dashboard/student/community` |
| Certificates | `/dashboard/student/certificates` |
| Enrollments | `/dashboard/student/shop` |

---

## Coach Workspace (`/dashboard/teacher`)

| Label | Route |
|-------|-------|
| Dashboard | `/dashboard/teacher` |
| Students | `/dashboard/teacher/students` |
| Classes | `/dashboard/teacher/classes` |
| Messages | `/dashboard/teacher/messages` |
| Schedule | `/dashboard/teacher/schedule` |
| Community | `/dashboard/teacher/community` |
| Promotions | `/dashboard/teacher/coupons` |
| Earnings | `/dashboard/teacher/earnings` |
| Competitions | `/dashboard/teacher/competitions` |
| Settings | `/dashboard/teacher/settings` |

---

## Academy Workspace (`/dashboard/academy`)

| Label | Route |
|-------|-------|
| Dashboard | `/dashboard/academy` |
| Teachers | `/dashboard/academy/teachers` |
| Students | `/dashboard/academy/students` |
| Training Batches | `/dashboard/academy/batches` |
| Timetable | `/dashboard/academy/timetable` |
| Attendance | `/dashboard/academy/attendance` |
| Competitions | `/dashboard/academy/competitions` |
| Finance | `/dashboard/academy/finance` |
| Members | `/dashboard/academy/members` |
| Settings | `/dashboard/academy/settings` |

---

## Competition Workspace

| Label | Route |
|-------|-------|
| Dashboard | `/dashboard/organizer` |
| Competitions | `/dashboard/competitions` |
| Judge | `/dashboard/judge` |
| Results | `/dashboard/results` |
| Rankings | `/dashboard/rankings` |
| Certificates | `/dashboard/certificates` |

---

## Workspace Switcher

Visible when a user has more than one workspace. Labels:

- Coach
- Academy
- Competitions
- Judge (assignments only)

Source: `WORKSPACE_LABELS` in `src/constants/terminology.ts`

---

## Terminology Standards

| Use | Avoid |
|-----|-------|
| Programs | Courses, packages |
| Training Batches | Batches (in academy nav only) |
| Create an Academy | Register Academy, Manage an Academy |
| Create Competitions | Become an Organizer |
| My Judge Assignments | Register as Judge |
| Messages | Chat |
| Enrollments | Shop, orders |

---

*Nav definitions: `src/components/shell/nav/*.ts`*
