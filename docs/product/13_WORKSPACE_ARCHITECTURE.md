# Workspace Architecture — Yogstra V2

**Sprint 12 · Product Architecture**  
**Date:** June 30, 2026

---

## Account Model

Yogstra supports two signup identities:

| Identity | Purpose |
|----------|---------|
| **Student** | Learn, enroll, compete, track progress |
| **Teacher** | Coach, run academies, host competitions, judge when assigned |

There are no separate Academy, Organizer, or Judge account types during signup.

---

## Teacher Workspaces

A verified teacher uses **one login** and switches between workspaces from the dashboard header.

| Workspace | Internal route prefix | When available |
|-----------|----------------------|----------------|
| Coach | `/dashboard/teacher` | Always (verified teacher) |
| Academy | `/dashboard/academy` | Always (create or join an academy) |
| Competitions | `/dashboard/organizer` | Always (create competitions) |
| Judge | `/dashboard/judge` | Only when assigned to judge a competition |

Workspace visibility is resolved at runtime via `fetchWorkspaceAccess()` — no database schema changes required.

---

## Navigation Independence

Each workspace has its own sidebar navigation while sharing:

- Authentication session
- Profile and settings context
- Messages and notifications infrastructure

The workspace switcher (`RoleSwitcher`) shows user-facing labels from `WORKSPACE_LABELS` in `src/constants/terminology.ts`.

---

## Signup Flow

```
Get Started
├── Student → /auth/student
└── Teacher → /auth/teacher/register
         └── After verification → Coach workspace
              ├── Enable Academy workspace → Create academy
              ├── Enable Competition workspace → Create competition
              └── Judge workspace appears when assigned
```

Legacy URLs `/auth/academy` and `/auth/organizer` redirect to teacher registration with contextual messaging.

---

## Implementation Map

| Concern | Location |
|---------|----------|
| Workspace labels | `src/constants/terminology.ts` |
| Access resolution | `src/services/workspaceAccess.ts` |
| React hook | `src/hooks/useWorkspaceAccess.ts` |
| Switcher UI | `src/components/shell/RoleSwitcher.tsx` |
| Post-login picker | `src/pages/public/WorkspacePickerPage.tsx` |
| Route detection | `src/utils/dashboardRoutes.ts` |

---

## Design Principles

1. Never expose internal role enums in user-facing copy
2. Prefer "Create an Academy" over "Register as Academy"
3. Judge workspace is assignment-gated, not self-service
4. Students remain in a single student dashboard — no workspace switcher

---

*See also: `13_HELP_TOOLTIP_GUIDE.md`, `14_NAVIGATION_MAP.md`*
