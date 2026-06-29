# Academy Domain Architecture

**Module:** V2 Core — Academy Foundation  
**Status:** Phase 1 (schema + services + reserved routes)  
**Migration:** `supabase/migrations/005_academy_domain.sql`

---

## Hierarchy

```
Platform (Yogstra)
  └── Academy (root or branch via parent_academy_id)
        └── Teachers (teacher_academies + academy_members)
        └── Batches
              └── Students (batch_students)
```

**Parallel path (unchanged):** Student ↔ Booking ↔ Independent Teacher

Students are associated as either:

| Path | Storage today | Notes |
|---|---|---|
| Academy batch | `batch_students` → `batches` → `academies` | Primary V2 model |
| Independent teacher | `bookings` (existing) | Continues to work unchanged |
| Unassigned | — | No batch, no active booking |

---

## Database tables

| Table | Purpose |
|---|---|
| `academies` | Core business entity; `parent_academy_id` reserved for branches |
| `academy_settings` | Timezone, currency, JSON settings per academy |
| `academy_members` | Staff roles: owner, manager, teacher, assistant_teacher, receptionist, finance_manager |
| `teacher_academies` | Teacher affiliation (employed / affiliated / visiting) |
| `batches` | Training groups within an academy |
| `batch_students` | Student enrollment in batches |

**Additive columns on existing tables:**

- `bookings.academy_id` (nullable) — future academy-scoped coaching
- `schedules.batch_id` (nullable) — future batch timetable link

No existing rows are modified. No tables dropped.

---

## Permission model

### Platform roles (existing — unchanged)

`student` | `teacher` | `admin` on `profiles.role`

### Academy member roles (new)

| Role | Capabilities (Phase 1 design) |
|---|---|
| Owner | Full academy control |
| Manager | Manage teachers, students, batches, settings |
| Teacher | Manage assigned batches |
| Assistant Teacher | Support assigned batches |
| Receptionist | Student admin (future UI) |
| Finance Manager | Finance module (future UI) |

Permission helpers live in `src/domain/academy/permissions.ts`.

RLS SQL helpers:

- `is_academy_member(academy_id, roles?)`
- `is_academy_teacher(academy_id)`
- `can_manage_academy(academy_id)`
- `can_view_academy(academy_id)`

Platform admin (`is_admin()`) bypasses academy checks.

---

## Application layers

```
src/domain/academy/     — Models + permission rules
src/repositories/       — Supabase data access (thin)
src/services/           — Business orchestration
  academyService.ts
  academyMemberService.ts
  batchService.ts
src/utils/academyMappers.ts
```

**Do not duplicate** `teachers.ts`, `bookings.ts`, or `students.ts`. Academy services compose with existing services when modules integrate.

---

## Source file map

| Path | Role |
|---|---|
| `supabase/migrations/005_academy_domain.sql` | Schema, indexes, RLS, triggers |
| `src/domain/academy/models.ts` | Entity interfaces + input DTOs |
| `src/domain/academy/permissions.ts` | Client-side permission helpers |
| `src/domain/academy/index.ts` | Barrel exports |
| `src/utils/academyMappers.ts` | DB row → domain mapping |
| `src/repositories/academyRepository.ts` | Academies + settings |
| `src/repositories/academyMemberRepository.ts` | Members + teacher affiliations |
| `src/repositories/batchRepository.ts` | Batches + enrollments |
| `src/services/academyService.ts` | Academy orchestration |
| `src/services/academyMemberService.ts` | Member + teacher linking |
| `src/services/batchService.ts` | Batch operations |
| `src/components/auth/RequireAcademyFoundationAccess.tsx` | Route guard |
| `src/components/academy/AcademyRouteLayout.tsx` | Placeholder layout |
| `src/pages/academy/academyPages.tsx` | Reserved route pages |

---

## Reserved routes (placeholders)

| Route | Purpose |
|---|---|
| `/dashboard/academy` | Academy home (future dashboard) |
| `/dashboard/academy/teachers` | Teacher management |
| `/dashboard/academy/students` | Student management |
| `/dashboard/academy/batches` | Batch management |
| `/dashboard/academy/finance` | Finance hub |

Access during foundation phase: authenticated **teacher** or **admin** via `RequireAcademyFoundationAccess`. No impact on student or existing teacher dashboard routes.

---

## Service API summary

### academyService

- `fetchAcademyById`, `fetchAcademyBySlug`
- `fetchAcademiesForUser`, `fetchActiveAcademies`
- `fetchAcademyBranches`
- `createAcademy` — creates academy + settings + owner member
- `fetchStudentAcademyAssociation` — resolves batch vs unassigned

### academyMemberService

- `fetchAcademyMembers`, `fetchAcademyTeachers`
- `fetchAcademyMembership`, `addAcademyMember`
- `linkTeacherToAcademy`
- `getUserAcademyRole`, `isUserAcademyTeacher`

### batchService

- `fetchBatchById`, `fetchAcademyBatches`, `createBatch`
- `fetchBatchStudents`, `enrollStudentInBatch`
- `fetchStudentBatchMemberships`

---

## Migration instructions

1. Apply all prior Supabase SQL migrations.
2. Run migrations `000`–`005` in order (see [Migration Guide](../database/MIGRATION_GUIDE.md)), or apply `005_academy_domain.sql` on an existing core schema.
3. Verify tables exist and RLS is enabled.
4. No application restart required — new code is backward compatible until academy data is created.

---

## Future modules

| Module | Builds on |
|---|---|
| Academy Dashboard UI | Routes + `academyService` |
| Auth multi-role | `academy_members` + platform role switcher |
| Student dashboard academy card | `fetchStudentAcademyAssociation` |
| Competition teams | `batches` + `academies` |
| Finance | `academy_settings` + existing Razorpay |
| Attendance | `batches` + new `attendance_records` (later) |

---

## Compatibility guarantees

- Existing teacher marketplace flows use `bookings`, `schedules`, `teacher_profiles` unchanged.
- Existing student dashboard uses coaching/booking data until batch enrollment is populated.
- Nullable FK columns on `bookings` / `schedules` are inert until explicitly set by future modules.
