# Admin Architecture — Yogstra V2

**Sprint 13 · Platform Control Center**  
**Date:** June 30, 2026

---

## Overview

The admin portal (`/admin`) is the platform control center for Yogstra operators. Access is gated by platform admin email in `platformAdmin.ts`.

---

## Layout

| Component | Path |
|-----------|------|
| Admin layout | `src/components/admin/AdminLayout.tsx` |
| Navigation | `src/components/shell/nav/adminNav.ts` |
| Shared table | `src/components/admin/AdminTable.tsx` |

---

## Sections

### Dashboard (`/admin`)
- Live platform statistics with HelpTooltip explanations
- Pending teacher approval queue with approve/reject
- Recent activity feed
- InstructionPanel for admin workflow overview

### Users
| Route | Page | Capabilities |
|-------|------|--------------|
| `/admin/teachers` | AdminTeachersPage | Verification queue, approve/reject/remove |
| `/admin/students` | AdminStudentsPage | Student list, profile view, bookings |
| `/admin/users` | AdminUsersPage | Cross-role user registry |

### Academies (`/admin/academies`)
- Search and status filter (active, inactive, archived)
- Suspend, archive, restore actions via `adminUpdateAcademyStatus()`

### Competitions (`/admin/competitions`)
- Search and status filter (draft, registration_open, in_progress, completed, archived)
- Archive and restore via `archiveCompetition()` / `updateCompetitionStatus()`

### Community (`/admin/community`)
- Post creation, pin/unpin, moderation

### Operations
| Route | Purpose |
|-------|---------|
| `/admin/bookings` | Enrollment records |
| `/admin/schedules` | Teacher schedule oversight |
| `/admin/chats` | Reported chat moderation |
| `/admin/payouts` | Coach payout ledger |
| `/admin/reports` | Platform aggregate stats |
| `/admin/audit` | Activity feed (expand to full audit log) |
| `/admin/categories` | Yoga style categories |
| `/admin/settings` | Platform commission configuration |

---

## Service Layer

| Service | Admin functions |
|---------|-----------------|
| `academyOperations.ts` | `adminUpdateAcademyStatus()` |
| `organizerOperations.ts` | `archiveCompetition()`, `updateCompetitionStatus()` |
| `teachers.ts` | `updateTeacherStatus()` |
| `platformSettings.ts` | `updateCommissionPercent()` |
| `admin.ts` | Dashboard stats, activity feed |

---

## Design Principles

1. Read-only by default; actions require explicit confirmation for destructive operations
2. Empty states explain what data appears and why
3. Instruction panels guide new admins through workflows
4. No technical vendor names in user-facing copy

---

## Planned Expansion

- Entity detail drawers (academy → teachers, students, programs)
- Dedicated payments hub (earnings, payouts, refunds, transactions)
- True audit log with actor, action, target, timestamp
- RBAC for multiple platform admins

---

*Navigation map: `14_NAVIGATION_MAP.md`*
