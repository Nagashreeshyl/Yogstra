# Final Database Report — Yogstra MVP

**Date:** 2026-06-30  
**Sprint:** 16

---

## Migration status

**15 migration files** — apply in order via `supabase db push`:

| # | File | Purpose |
|---|---|---|
| 000 | `extensions_and_helpers.sql` | Extensions, shared functions |
| 001 | `core_schema.sql` | profiles, bookings, schedules, community |
| 002 | `chat_and_orders.sql` | chat, class_orders, video calls |
| 003 | `marketplace_payouts.sql` | platform_settings, payouts |
| 004 | `teacher_platform.sql` | coupons, notifications, class_sessions |
| 005 | `academy_domain.sql` | academies, batches, batch_students |
| 006 | `competition_domain.sql` | 12 competition tables |
| 007 | `realtime_storage_admin.sql` | Realtime pubs, storage buckets |
| 008 | `upgrade_from_legacy.sql` | Legacy upgrade path |
| 009 | `profile_email_lookup.sql` | Invite email lookup |
| 010 | `profile_preferences.sql` | Workspace persistence |
| 010 | `direct_video_calls_room_name.sql` | Video room column |
| 011 | `academy_bootstrap_rls.sql` | Academy creation RLS fix |
| 012 | `academy_creator_visibility.sql` | Inactive academy slug conflict fix |
| 013 | `enrollment_notifications.sql` | **Required for enrollment notifications** |

⚠️ **Migration 013 must be applied in production** before launch. Without it, enrollment notifications are silently skipped (fulfillment still succeeds).

---

## Enrollment write sequence (post-payment)

After Razorpay payment verified:

1. `class_orders` → `payment_status = paid`
2. `schedules` → INSERT (if missing)
3. `class_orders` → link `schedule_id`
4. `payouts` → INSERT (if missing)
5. `coupon_deliveries` + `teacher_coupons` → redeem (if coupon)
6. `bookings` → UPSERT active/paid
7. `batch_students` → INSERT/UPDATE (group + academy only)
8. `direct_messages` → booking card (if thread)
9. `teacher_notifications` → INSERT
10. `enrollment_notifications` → INSERT (student, teacher, academy owners, admins)

All steps idempotent on retry (Sprint 16 fix).

---

## Constraints validated

| Table | Constraint | Sprint 16 note |
|---|---|---|
| `batch_students.enrollment_type` | `academy` \| `independent` | Fixed invalid `'paid'` value |
| `batch_students` | UNIQUE(batch_id, student_id) | Re-enrollment updates `removed` → `active` |
| `class_orders` | UNIQUE razorpay_order_id, razorpay_payment_id | Duplicate payment prevention |
| `payouts` | UNIQUE class_order_id | One payout per order |
| `enrollment_notifications` | UNIQUE(order_id, role, user_id) | Idempotent notifications |

---

## RLS summary

| Domain | RLS | Notes |
|---|---|---|
| All domain tables | ✅ Enabled | |
| class_orders | Student read own; service role fulfills | |
| bookings | Teacher/student scoped | |
| batch_students | Academy managers + student | |
| academies | Bootstrap fix in 011, visibility in 012 | |
| competitions | Organizer/judge/student scoped | |
| enrollment_notifications | User reads own | |

---

## Indexes

Good coverage on foreign keys and lookup columns. No missing indexes identified as launch blockers.

---

## Realtime publications

Tables in realtime (migration 007 + app):

- `class_orders`, `schedules`, `bookings`, `enrollment_notifications`
- `batch_students` (subscribed in app Sprint 16)
- `posts`, `comments`, `payouts`, `class_sessions`

---

## Pre-launch database checklist

- [ ] `supabase db push` all migrations through 013
- [ ] Verify RLS with anon key smoke test
- [ ] Confirm storage buckets exist (avatars, academy-logos, competition-banners, etc.)
- [ ] Seed at least one verified teacher for public listing
- [ ] Set `platform_settings.commission_percent`

See `FINAL_DEPLOYMENT_GUIDE.md` for commands.
