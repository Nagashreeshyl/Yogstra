# Repository Audit Report

**Date:** 2026-06-29  
**Scope:** `Yogstra/src`, `Yogstra/public`, `Yogstra/supabase`  
**Rule:** Report generated before deletions; P0 items removed in this sprint.

---

## Summary

| Category | Found | Removed | Kept (intentional) |
|---|---|---|---|
| Duplicate components | 2 name collisions | Renamed | Shell vs filter `SearchBar` (different roles) |
| Duplicate services | 0 functional duplicates | — | Layered judge/organizer services |
| Duplicate hooks | 0 | — | — |
| Dead routes | 0 orphaned pages | — | Foundation stub routes |
| Unused pages/components | 4 exports | 4 cleaned | Placeholder pages |
| Unused utilities | 2 functions | 2 removed | — |
| Unused assets | 3 files | 3 deleted | PWA assets kept |
| Unused SQL | 0 in active path | — | Archive only |

---

## Duplicate components (resolved)

| Was | Now | Reason |
|---|---|---|
| `components/student/competition/CompetitionCard.tsx` | `StudentCompetitionListCard.tsx` | Name collision with dashboard widget |
| `components/student/dashboard/CompetitionCard.tsx` | `DashboardCompetitionWidget.tsx` | Same export name, different types |

**Kept (not duplicates):**

- `components/shell/SearchBar.tsx` — global search placeholder in TopBar (disabled, future module)
- `components/filters/SearchBar.tsx` — teacher explore filters (live)

---

## Removed dead code (P0)

| Item | Path | Evidence |
|---|---|---|
| Deprecated layout wrapper | `components/layout/ResponsiveShell.tsx` | 0 imports |
| Deprecated alias | `ResponsiveLayout` in `AppShell.tsx` | 0 external imports |
| Duplicate skeleton | `TeacherDashboardSkeleton` in `ui/Skeleton.tsx` | Duplicate of `teacher/dashboard/TeacherDashboardSkeleton` |
| Unused route guard export | `StudentClassesGuard` in `StudentClassesPage.tsx` | 0 imports |
| Unused hook export | `useFilteredTeachers` in `filters/SearchBar.tsx` | 0 imports |
| Unused utility | `getRegistrationProgress` in `studentRegistrationDraft.ts` | 0 callers |
| Unused barrel export | `JudgeDashboardPage` from `judgePages.tsx` | App routes via `competitionPages` |
| Default Vite assets | `src/assets/vite.svg`, `src/assets/react.svg` | 0 references |
| Unused icon sprite | `public/icons.svg` | 0 references |

---

## Intentionally kept

| Item | Reason |
|---|---|
| `academyMemberService.ts`, `batchService.ts` | Academy scaffold — wired when academy UI ships |
| `CompetitionPlaceholderPage`, `AcademyPlaceholderPage` | Foundation stub routes behind access guards |
| `studentCompetitionPages.tsx` barrel | Re-export barrel for internal use |
| `supabase/archive/*.sql` | Historical reference; not for fresh installs |
| Parallel URL namespaces (`/dashboard/student/results` vs `/dashboard/results`) | Student live routes vs organizer foundation stubs |

---

## Route inventory

All 56 page modules are reachable from `App.tsx` or re-exported through routed barrels. No orphaned page files.

**Stub routes (placeholder UI):**

- `/dashboard/competitions`, `/dashboard/competitions/:id`
- `/dashboard/results`, `/dashboard/rankings`, `/dashboard/certificates`
- `/dashboard/academy/*` (5 routes)

**Live routes:**

- Student competition experience (`/dashboard/student/competitions/*`, results, certificates, rankings)
- Judge portal (`/dashboard/judge/*`)
- Organizer dashboard (`/dashboard/organizer`)

---

## Recommendations (future, not in scope)

1. Wire academy services when academy pages replace placeholders.
2. Consolidate public `/competitions` mock data with live Supabase feed.
3. Add student nav links for results/certificates/rankings hubs.
4. Split `StudentMyCompetitionsPage` into its own file for finer lazy chunks.
