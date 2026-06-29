# Workflow Persistence Report — Sprint 13

**Date:** June 30, 2026

---

## Problem

Prior to Sprint 13, workspace state relied entirely on `localStorage`:
- `yogstra_workspace_view` — last selected workspace
- `yogstra_academy_id` — selected academy

This caused:
- Lost preferences on new devices or cleared browser data
- Repeated onboarding prompts after logout/login
- No smart routing based on owned resources

---

## Solution

### Database table: `profile_preferences`

```sql
user_id uuid PRIMARY KEY
preferred_workspace text  -- student | teacher | academy | organizer | judge | admin
preferred_academy_id uuid
updated_at timestamptz
```

Migration: `supabase/migrations/010_profile_preferences.sql`

### Service: `profilePreferencesService.ts`

- `fetchProfilePreferences(userId)` — read from DB
- `saveProfilePreferences(userId, partial)` — upsert with graceful fallback if table missing

### Smart routing: `resolvePostLoginPath()`

Priority order for verified teachers:

1. **DB `preferred_workspace`** if still valid
2. **localStorage remembered workspace** if valid
3. **Inferred default** from ownership:
   - Has academy → Academy workspace
   - Has competitions → Competition workspace
   - Has judge assignments → Judge workspace
   - Else → Coach workspace
4. **Workspace picker** if multiple views and no preference
5. **Role default** via `getPostLoginPath()`

### Persistence triggers

| Action | Persists |
|--------|----------|
| Workspace switcher selection | `preferred_workspace` (DB + localStorage) |
| Workspace picker "Remember" | `preferred_workspace` (DB + localStorage) |
| Academy selection | `preferred_academy_id` (DB + localStorage) |

---

## Academy lifecycle persistence

- Academy creation sets `preferred_academy_id` via `useAcademyContext.setAcademyId()`
- Archived academies filtered from `academyRepository.listForUser()`
- Teachers with existing academy skip create flow (`AcademyCreateSection` only when `academies.length === 0`)

---

## Competition lifecycle persistence

- Organizer dashboard remembers selected competition in component state
- Competition status stored in `competitions.status` column
- Archive transitions to `archived` — excluded from active competition counts in workspace access

---

## Remaining gaps

1. Load `preferred_academy_id` from DB on academy context initialization (currently localStorage-first)
2. Sync workspace preference on every RoleSwitcher change even without explicit "remember"
3. Student dashboard preferences (last viewed program) — not yet persisted

---

## Testing scenarios

| Scenario | Expected behavior |
|----------|-------------------|
| Teacher with academy logs in | Routes to `/dashboard/academy` |
| Teacher with competitions only | Routes to `/dashboard/organizer` |
| Teacher switches workspace | Preference saved to DB |
| Academy archived | Hidden from workspace; create flow if no other academies |
| Admin restores academy | Reappears in admin and teacher lists |

---

*Architecture: `13_WORKSPACE_ARCHITECTURE.md`*
