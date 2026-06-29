# Yogstra V2 — SQL Migrations

Ordered, idempotent migrations for Supabase (PostgreSQL + RLS).

## Fresh install

Run files in numeric order in the Supabase SQL Editor (or via CLI):

| File | Domain |
|------|--------|
| `000_extensions_and_helpers.sql` | `set_updated_at()`, `is_admin()`, auth trigger |
| `001_core_schema.sql` | profiles, teachers, bookings, community |
| `002_chat_and_orders.sql` | chat threads, class orders, video calls |
| `003_marketplace_payouts.sql` | platform settings, `teacher_payout_private`, payout ledger |
| `004_teacher_platform.sql` | coupons, notifications, schedule changes, LiveKit sessions |
| `005_academy_domain.sql` | academies, batches, members |
| `006_competition_domain.sql` | competitions (12 tables), RLS helpers |
| `007_realtime_storage_admin.sql` | realtime publications, storage buckets |
| `008_upgrade_from_legacy.sql` | **Existing DBs only** — patches legacy drift |

## Legacy files

Ad-hoc SQL previously in `supabase/*.sql` is archived under `supabase/archive/`.
Do not run archive files on new installs.

## Rules

- All primary keys: `uuid` with `gen_random_uuid()` default
- Mutable tables include `created_at` + `updated_at` (trigger via `set_updated_at()`)
- Audit columns (`created_by`) on domain roots: `academies`, `competitions`, `competition_announcements`
- Payout bank/UPI data: **`teacher_payout_private` only** (not `teacher_profiles`)
- Child FKs use `ON DELETE CASCADE` or `SET NULL` as documented in ER diagram

## Application compatibility

Repositories in `src/repositories/` target these table/column names.
No application code changes are required when applying this migration set.
