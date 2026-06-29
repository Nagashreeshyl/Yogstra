# Yogstra V2 — Database Migration Guide

Sprint 1 consolidates 34 ad-hoc SQL files into 9 ordered migrations under `Yogstra/supabase/migrations/`.

## Prerequisites

- Supabase project with PostgreSQL 15+
- Supabase Auth enabled
- SQL Editor or Supabase CLI access

## Scenario A — Fresh database

Run migrations **in numeric order** (000 → 007). Skip 008.

```
000_extensions_and_helpers.sql
001_core_schema.sql
002_chat_and_orders.sql
003_marketplace_payouts.sql
004_teacher_platform.sql
005_academy_domain.sql
006_competition_domain.sql
007_realtime_storage_admin.sql
```

Verify:

```sql
select tablename from pg_tables where schemaname = 'public' order by tablename;
select proname from pg_proc join pg_namespace n on n.oid = pronamespace
  where n.nspname = 'public' and proname like 'is_%' or proname like 'can_%';
```

Expected table count: **~45** public tables including academy and competition domains.

## Scenario B — Existing Yogstra V1/V2 database (legacy ad-hoc migrations)

If you previously ran files from `supabase/archive/`:

1. **Backup** the database (Supabase Dashboard → Backups or `pg_dump`).
2. Run migrations **000–007** — all statements are idempotent (`IF NOT EXISTS`, `DO $$ … EXCEPTION duplicate_object`).
3. Run **`008_upgrade_from_legacy.sql`** to:
   - Add missing `updated_at` / `gender` / `pinned` columns
   - Migrate payout columns from `teacher_profiles` → `teacher_payout_private`
   - Remove duplicate `upi_id` from `teacher_profiles`
   - Backfill payout ledger rows for paid class orders
   - Normalize payouts RLS policy

4. Verify payout migration:

```sql
select count(*) from teacher_payout_private;
select column_name from information_schema.columns
  where table_name = 'teacher_profiles' and column_name like '%bank%';
-- Should return 0 rows after upgrade
```

## Scenario C — Partial legacy (some modules only)

| If you have… | Run |
|--------------|-----|
| Core only (schema.sql) | 000–004, 007, 008 |
| + Academy | add 005 |
| + Competition | add 005–006 |
| + Chat | ensure 002 ran (or legacy setup-messaging) |

When unsure, run 000–008 in order; idempotent guards prevent double-application errors.

## What changed in consolidation

### Removed duplicates

- **Chat:** `setup-messaging.sql` + `chat-threads.sql` + `chat-reads.sql` + `admin-chat-policies.sql` → single `002`
- **Payouts:** bank fields no longer on `teacher_profiles`; consolidated in `teacher_payout_private` with `upi_id`
- **Redundant patches:** `teacher-cover.sql`, `teacher-remove.sql`, `teacher-coupons-fix.sql` merged or dropped

### Added standards

- `updated_at` + triggers on all mutable core tables
- `created_at` on `teacher_payout_private`, `teacher_profiles` (upgrade path)
- Consistent `ON DELETE CASCADE` on user-owned child rows
- Index coverage on FK and status columns

### Unchanged (application compatibility)

- Table and column names used by `src/repositories/` and services
- RLS behavior semantics (students see own data; admins bypass via `is_admin()`)
- Competition and academy domain schemas (copied from foundation migrations)

## Rollback

Migrations are forward-only. To rollback:

1. Restore from Supabase backup taken before migration
2. Do not drop tables manually in production

## Admin seed

Uncomment the seed block in `007_realtime_storage_admin.sql` or run manually after creating an auth user:

```sql
update public.profiles set role = 'admin' where id = (
  select id from auth.users where email = 'your-admin@example.com'
);
```

## CI/CD (future)

For Supabase CLI projects, rename files to timestamp format:

```
supabase migration new yogstra_v2_baseline
```

and paste consolidated content, or use:

```bash
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -f "$f"; done
```

## Support checklist

After migration, confirm:

- [ ] Student signup creates `profiles` row (auth trigger)
- [ ] Teacher can save payout details (`teacher_payout_private`)
- [ ] Chat threads accept messages
- [ ] Class order payment creates payout row
- [ ] Academy/competition dashboards load without RLS errors
- [ ] `npm run build` passes (no app changes required)
