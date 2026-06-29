# Competition Domain Architecture

**Module:** V2 Core — Competition Foundation  
**Status:** Phase 1 (schema + services + reserved routes)  
**Migration:** `supabase/competition-foundation.sql`  
**PRD:** [`../../../docs/PRD/10_COMPETITIONS.md`](../../../docs/PRD/10_COMPETITIONS.md)

---

## Hierarchy

```
Platform (Yogstra)
  └── Competition
        ├── Events (stages / sessions)
        ├── Categories (age + style)
        │     └── Divisions (sub-groups)
        ├── Registrations
        │     └── Participants
        ├── Judges
        │     └── Scores
        ├── Results
        ├── Certificates (QR verification ready)
        ├── Rankings (student / teacher / academy / state / national)
        └── Announcements
```

**Integration paths:**

| Actor | Registration path | Notes |
|---|---|---|
| Student | Direct registration | `registrant_type = student` |
| Teacher | Register students | `registrant_type = teacher` |
| Academy | Bulk registration | `registrant_type = academy` + `academy_id` |
| Organizer | Manage competition | `organizer_id` or academy owner/manager |
| Judge | Score only | `competition_judges` assignment |
| Admin | Platform control | `is_admin()` bypass |

Academy-hosted competitions link via `competitions.academy_id`. Team registrations can reference `batches` via `competition_registrations.batch_id`. See [Academy Domain](./ACADEMY_DOMAIN.md) for academy/batch relationships.

---

## Entity relationships

```
competitions
  ├── competition_events
  ├── competition_categories
  │     └── competition_divisions
  ├── competition_registrations ──► competition_participants
  ├── competition_judges ──► competition_scores
  ├── competition_results
  ├── competition_certificates
  ├── competition_rankings
  └── competition_announcements

Foreign keys to existing domain:
  competitions.academy_id              → academies
  competition_registrations.academy_id → academies
  competition_registrations.batch_id   → batches
  competitions.organizer_id            → profiles
  competition_participants.student_id  → profiles
```

---

## Database tables

| Table | Purpose |
|---|---|
| `competitions` | Core event entity with lifecycle status |
| `competition_events` | Stages, sessions, and schedule slots |
| `competition_categories` | Age group + style categories |
| `competition_divisions` | Sub-groups within categories |
| `competition_registrations` | Who registered (student / teacher / academy) |
| `competition_participants` | Individual performers linked to registrations |
| `competition_judges` | Judge assignments with category/event scope |
| `competition_scores` | Digital scoring with criteria JSON |
| `competition_results` | Approved final results and medals |
| `competition_certificates` | QR-verifiable certificates with signature metadata |
| `competition_rankings` | Historical rankings at multiple scopes |
| `competition_announcements` | Audience-targeted announcements |

No existing tables are modified or dropped. Existing bookings, payments, and teacher logic remain unchanged.

---

## Competition lifecycle

```
draft → published → registration_open → registration_closed
  → in_progress → scoring → results_pending → completed → archived
```

Status enums in SQL `check` constraints match TypeScript `CompetitionStatus` in `src/domain/competition/models.ts`.

---

## Permission model

### Platform roles (existing — unchanged)

`student` | `teacher` | `admin` on `profiles.role`

### Competition actor roles (Phase 1 design)

| Role | Capabilities |
|---|---|
| Student | Register for competitions |
| Teacher | Register students |
| Academy | Bulk registration via academy manager |
| Judge | Score assigned participants only |
| Organizer | Full competition management |
| Admin | Platform control |

Permission helpers live in `src/domain/competition/permissions.ts`.

RLS SQL helpers:

- `is_competition_organizer(competition_id)`
- `is_competition_judge(competition_id)`
- `is_competition_participant(competition_id)`
- `can_manage_competition(competition_id)`
- `can_view_competition(competition_id)`
- `can_register_for_competition(competition_id)`
- `can_score_competition(competition_id)`

Platform admin (`is_admin()`) bypasses competition checks.

---

## Application layers

```
src/domain/competition/   — Models + permission rules
src/repositories/         — Supabase data access (thin)
src/services/             — Business orchestration
  competitionService.ts
  registrationService.ts
  judgeService.ts
  rankingService.ts
  certificateService.ts
src/utils/competitionMappers.ts
```

**Do not duplicate** existing `bookings.ts`, `teachers.ts`, or dashboard services. Competition services compose with academy and auth when future modules integrate.

---

## Source file map

| Path | Role |
|---|---|
| `supabase/competition-foundation.sql` | Schema, indexes, RLS, triggers |
| `src/domain/competition/models.ts` | Entity interfaces + input DTOs |
| `src/domain/competition/permissions.ts` | Client-side permission helpers |
| `src/domain/competition/index.ts` | Barrel exports |
| `src/utils/competitionMappers.ts` | DB row → domain mapping |
| `src/repositories/competitionRepository.ts` | Competitions, events, categories, announcements |
| `src/repositories/competitionRegistrationRepository.ts` | Registrations + participants |
| `src/repositories/competitionJudgeRepository.ts` | Judges, scores, results |
| `src/repositories/competitionRankingRepository.ts` | Rankings |
| `src/repositories/competitionCertificateRepository.ts` | Certificates |
| `src/services/competitionService.ts` | Competition CRUD + summary |
| `src/services/registrationService.ts` | Registration workflow |
| `src/services/judgeService.ts` | Judge assignment + scoring |
| `src/services/rankingService.ts` | Rankings by scope |
| `src/services/certificateService.ts` | Certificate issue + QR verify |
| `src/components/auth/RequireCompetitionFoundationAccess.tsx` | Route guard |
| `src/components/competition/CompetitionRouteLayout.tsx` | Placeholder layout |
| `src/pages/competition/competitionPages.tsx` | Reserved route pages |

---

## Certificates (architecture)

Certificates are designed for:

- **QR verification** — unique `qr_code_token` per certificate; public lookup via `/verify/certificate/:token` (route ships in a future module)
- **Digital signatures** — `signature_data` JSONB stores algorithm, signer, timestamp, checksum
- **PDF generation** — `pdf_url` reserved for future Supabase Storage + PDF generator integration

Flow: `createCertificateDraft` → sign → `issueCertificate` → QR scan verifies authenticity.

---

## Rankings (architecture)

Rankings support multiple scopes in a single table:

| Scope | Subject type | Use case |
|---|---|---|
| `student` | student | Individual athlete rankings |
| `teacher` | teacher | Coach performance rankings |
| `academy` | academy | Academy standings |
| `state` | student / teacher / academy | State-level aggregates |
| `national` | student / teacher / academy | National leaderboard |
| `international` | student / teacher / academy | Future global rankings |

`competition_id` is nullable for aggregate rankings spanning multiple events. `season`, `period_start`, and `period_end` support historical tracking. `metadata` JSONB stores breakdown details.

---

## Reserved routes (placeholders)

| Route | Purpose |
|---|---|
| `/dashboard/competitions` | Competition hub |
| `/dashboard/competitions/:id` | Competition detail |
| `/dashboard/judge` | Judge scoring portal |
| `/dashboard/organizer` | Organizer management |
| `/dashboard/results` | Published results |
| `/dashboard/rankings` | Rankings leaderboard |
| `/dashboard/certificates` | Certificate library |

Access during foundation phase: authenticated **student**, **teacher**, or **admin** via `RequireCompetitionFoundationAccess`. Existing public `/competitions` route and dashboard widgets remain unchanged.

---

## Service API summary

### competitionService

- `fetchCompetitionById`, `fetchCompetitionBySlug`
- `fetchPublishedCompetitions`, `fetchOrganizerCompetitions`
- `fetchCompetitionEvents`, `fetchCompetitionCategories`, `fetchCompetitionAnnouncements`
- `createCompetition` — draft with unique slug
- `fetchCompetitionSummary` — aggregated read

### registrationService

- `fetchRegistrationById`, `fetchCompetitionRegistrations`, `fetchUserRegistrations`
- `fetchCompetitionParticipants`, `fetchRegistrationParticipants`
- `submitRegistration`, `addParticipant`
- `fetchRegistrationStats`

### judgeService

- `fetchCompetitionJudges`, `fetchJudgeAssignment`, `assignJudge`
- `submitScore`, `fetchCompetitionScores`
- `fetchCompetitionResults`, `fetchPublishedResults`
- `isUserAssignedJudge`

### rankingService

- `fetchRankingsByScope`, `fetchStudentRankings`, `fetchTeacherRankings`
- `fetchAcademyRankings`, `fetchStateRankings`, `fetchNationalRankings`
- `fetchCompetitionRankings`, `fetchSubjectRankingHistory`
- `recordRankingEntry`

### certificateService

- `fetchCertificateById`, `verifyCertificateByQrToken`
- `fetchUserCertificates`, `fetchCompetitionCertificates`
- `createCertificateDraft`, `issueCertificate`

---

## Migration instructions

1. Apply all prior Supabase SQL migrations (including `academy-foundation.sql`).
2. Run `competition-foundation.sql` once in the Supabase SQL Editor.
3. Verify tables exist and RLS is enabled.
4. No application restart required — new code is backward compatible until competition data is created.

---

## Future modules

| Module | Builds on |
|---|---|
| Competition Dashboard UI | Routes + `competitionService` |
| Registration + Payment | `registrationService` + Razorpay |
| Digital Judging UI | `judgeService` + realtime scores |
| Certificate PDF + QR page | `certificateService` |
| Rankings UI | `rankingService` |
| Student/Teacher dashboard widgets | Replace constants in `src/lib/constants.ts` |

---

## Compatibility guarantees

- Existing teacher marketplace flows use `bookings`, `schedules`, `teacher_profiles` unchanged.
- Existing student and teacher dashboards continue using `lib/constants.ts` competition teasers until wired to `fetchPublishedCompetitions`.
- Public `/competitions` page unchanged in foundation phase.
- Nullable FKs on registrations (`academy_id`, `batch_id`) are inert until explicitly set.
