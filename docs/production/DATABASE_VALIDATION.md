# Database Validation Report — Sprint 14

**Date:** 2026-06-30  
**Project:** Yogstra V2  
**Migrations reviewed:** `supabase/migrations/000` through `011` (13 files)

---

## Executive summary

The Yogstra V2 schema is **coherent, RLS-protected, and production-ready** for MVP deployment. All domain tables have primary keys, foreign keys with appropriate `ON DELETE` behavior, indexes on lookup columns, and row-level security policies. No orphaned unused tables were found in migrations.

| Check | Result |
|---|---|
| Primary keys | ✅ All tables |
| Foreign keys | ✅ With cascade/restrict as appropriate |
| Indexes | ✅ Good coverage; minor recommendations below |
| RLS | ✅ Enabled on all public domain tables |
| Triggers | ✅ Profile bootstrap, updated_at, competition helpers |
| Functions | ✅ `can_manage_academy`, `is_platform_admin`, etc. |
| Policies | ✅ Role-scoped; bootstrap fix in `011` |

---

## Migration inventory

| File | Purpose |
|---|---|
| `000_extensions_and_helpers.sql` | Extensions, shared functions |
| `001_core_schema.sql` | profiles, teachers, bookings, schedules, community, payouts |
| `002_chat_and_orders.sql` | chat threads, direct messages, class_orders, video calls |
| `003_marketplace_payouts.sql` | platform_settings, teacher_payout_private |
| `004_teacher_platform.sql` | coupons, notifications, schedule requests, class_sessions |
| `005_academy_domain.sql` | academies, members, batches, teacher_academies |
| `006_competition_domain.sql` | 12 competition tables |
| `007_realtime_storage_admin.sql` | Realtime publications, storage buckets |
| `008_upgrade_from_legacy.sql` | Legacy migration path |
| `009_profile_email_lookup.sql` | Email lookup helper for invites |
| `010_profile_preferences.sql` | Workspace persistence |
| `010_direct_video_calls_room_name.sql` | Video call room name column |
| `011_academy_bootstrap_rls.sql` | Fix chicken-and-egg academy creation RLS |

**Note:** Two files share prefix `010_`. Apply in filename order; both are idempotent.

---

## Table inventory (42 domain tables)

### Core (`001`)
- `categories`, `profiles`, `teacher_profiles`, `bookings`, `schedules`, `posts`, `comments`, `messages`, `payouts`

### Chat & orders (`002`)
- `chat_threads`, `direct_messages`, `chat_thread_reads`, `chat_thread_settings`, `chat_reports`, `class_orders`, `direct_video_calls`

### Marketplace (`003`)
- `platform_settings`, `teacher_payout_private`

### Teacher platform (`004`)
- `teacher_coupons`, `coupon_deliveries`, `teacher_notifications`, `schedule_change_requests`, `class_sessions`

### Academy (`005`)
- `academies`, `academy_settings`, `academy_members`, `teacher_academies`, `batches`, `batch_students`

### Competition (`006`)
- `competitions`, `competition_events`, `competition_categories`, `competition_divisions`, `competition_registrations`, `competition_participants`, `competition_judges`, `competition_scores`, `competition_results`, `competition_certificates`, `competition_rankings`, `competition_announcements`

### Preferences (`010`)
- `profile_preferences`

---

## Primary keys

All tables use `uuid` primary keys with `gen_random_uuid()` defaults (via `000` helpers). No composite-only PK tables without surrogate keys.

**Status:** ✅ Pass

---

## Foreign keys & cascade rules

| Relationship | ON DELETE | Assessment |
|---|---|---|
| `profiles.id` → `auth.users` | CASCADE | ✅ Correct |
| `bookings.student_id` → `profiles` | CASCADE | ✅ |
| `academy_members.academy_id` → `academies` | CASCADE | ✅ |
| `batch_students.batch_id` → `batches` | CASCADE | ✅ |
| `competition_registrations.competition_id` → `competitions` | CASCADE | ✅ |
| `competition_scores.participant_id` → `competition_participants` | CASCADE | ✅ |
| `class_orders.teacher_id` → `teacher_profiles` | RESTRICT/SET NULL | ✅ Protects financial records |

Competition domain uses consistent `competition_id` FKs with cascade on child records when parent competition is deleted (organizer/admin action).

**Status:** ✅ Pass

---

## Indexes

### Existing (verified in migrations)

- `profiles`: email, role lookups
- `teacher_profiles`: user_id, verification status
- `bookings`: student_id, teacher_id, status
- `schedules`: teacher_id, scheduled_at
- `class_orders`: razorpay_order_id (unique), student_id, teacher_id
- `academies`: created_by, status
- `academy_members`: (academy_id, user_id) unique
- `batches`: academy_id
- `competition_registrations`: competition_id, user_id
- `competition_judges`: competition_id, user_id
- `competition_certificates`: qr_code_token (unique)
- `profile_preferences`: user_id (unique)

### Recommended additions (non-blocking)

| Table | Index | Reason |
|---|---|---|
| `competition_registrations` | `(user_id, status)` | Student dashboard "my registrations" filter |
| `competition_participants` | `(competition_id, status)` | Live event participant lists |
| `posts` | `(created_at DESC)` | Community feed pagination |
| `direct_messages` | `(thread_id, created_at)` | Message history scroll |
| `teacher_notifications` | `(user_id, read_at, created_at)` | Unread notification queries |

These are optimizations, not blockers for MVP traffic.

---

## RLS coverage

RLS is **enabled** on every domain table in migrations `001`–`006`, `010`. Storage policies in `007` cover `avatars` and `post-media` buckets.

### Policy patterns

| Pattern | Tables | Example |
|---|---|---|
| Owner read/write | profiles, preferences | `auth.uid() = id` |
| Role-scoped | teacher_profiles | Teachers edit own; admins moderate |
| Membership-scoped | academy_* | `can_manage_academy()` / member checks |
| Competition-scoped | competition_* | Organizer, judge, participant policies |
| Public read | competitions (published), posts | Anon/authenticated SELECT |
| Service role bypass | N/A client-side | Server API uses service role for webhooks |

### Critical fix — `011_academy_bootstrap_rls.sql`

**Problem:** Academy creator could insert `academies` but not `academy_members` (owner) or `academy_settings` because `can_manage_academy()` required existing membership.

**Fix:** Bootstrap policies allow creator to insert own owner membership and settings immediately after academy creation.

**Status:** ✅ Applied to production project

---

## Triggers & functions

| Function / trigger | Purpose |
|---|---|
| Profile bootstrap on signup | Creates `profiles` row from auth metadata |
| `updated_at` triggers | Auto-timestamp on mutable tables |
| `can_manage_academy()` | Academy permission helper |
| `is_platform_admin()` | Admin console access |
| `get_profile_by_email()` | Academy/teacher invite lookup (`009`) |

---

## Realtime publications (`007`)

18 tables added to `supabase_realtime` publication:

- Core: profiles, bookings, schedules, posts, comments, messages
- Chat: threads, reads, settings, reports, direct_messages
- Commerce: class_orders, payouts, platform_settings
- Teacher: teacher_profiles, notifications, schedule_change_requests, class_sessions

**Not realtime:** Academy and competition tables (polling/refetch on navigation — acceptable for MVP).

---

## Storage buckets (`007`)

| Bucket | Public | Policies |
|---|---|---|
| `avatars` | Yes | Public read; uid-folder write/delete |
| `post-media` | Yes | Public read; uid-folder write/delete |

Missing buckets (documented, not in schema): academy-logos, competition-assets, certificates.

---

## Duplicate columns / unused tables

| Finding | Assessment |
|---|---|
| Duplicate `010_` prefix files | Naming only; no schema conflict |
| `messages` vs `direct_messages` vs `chat_threads` | Intentional — legacy + new chat models coexist |
| No unused migration tables | All tables referenced in repositories |

---

## Missing constraints (low priority)

| Item | Recommendation |
|---|---|
| `competition_registrations.payment_status` | CHECK enum already in app layer; consider DB CHECK |
| `profiles.role` | CHECK constraint for valid roles |
| Soft-delete columns | Academies/competitions use `status` — consistent |

---

## Query patterns & duplication

Repositories generally use single-purpose queries. Minor duplication:

- Competition list + detail sometimes re-fetch overlapping registration data
- Student competition home aggregates multiple repository calls (acceptable orchestration)

No N+1 patterns found in hot paths; list queries use `.select()` with joins where needed.

---

## Validation checklist

- [x] All migrations are idempotent (`IF NOT EXISTS`, `ON CONFLICT`)
- [x] RLS enabled before policies applied
- [x] FK order respects dependency chain
- [x] Bootstrap RLS for academy creation
- [x] Storage policies match bucket design
- [x] Realtime limited to high-churn tables
- [ ] Recommended indexes (optional, post-MVP)
- [ ] Competition payment Razorpay columns (future migration)

---

## Apply migrations (production)

```bash
supabase db push
# or via Supabase Dashboard → SQL → run migrations in order
```

Verify with:

```sql
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;
```

All `rowsecurity` should be `true` for domain tables.
