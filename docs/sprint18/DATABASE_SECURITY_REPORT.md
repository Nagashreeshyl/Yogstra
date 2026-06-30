# DATABASE_SECURITY_REPORT — Sprint 18

**Database:** Supabase Postgres (`cgctoacarkzkftizkcjl`)  
**Migrations applied:** `000`–`019` (018–019 Sprint 18 hardening)

---

## Schema integrity

| Area | Status | Notes |
|------|--------|-------|
| Primary keys | ✅ | UUID on all domain tables |
| Foreign keys | ✅ | CASCADE/SET NULL appropriate |
| Unique constraints | ✅ | Razorpay order/payment ids, slugs |
| Indexes | ✅ | Lookup columns indexed |
| `created_at` / `updated_at` | ✅ | `set_updated_at` trigger on most tables |
| Soft delete | Partial | Competitions/academies use status fields |
| Audit logs | ✅ | `admin_audit_log`, `platform_activity_log` |

---

## Security definer functions

| Function | Role | Sprint 18 change |
|----------|------|------------------|
| `handle_new_user()` | Signup profile bootstrap | Role clamped student/teacher |
| `is_admin()` | Policy helper | Unchanged |
| `protect_profile_privileged_fields()` | **New** — role lock | 018 |
| `protect_teacher_profile_privileged_fields()` | **New** — verification lock | 018 |
| `protect_class_order_payment_fields()` | Payment tamper guard | 018 UPDATE; 019 INSERT |
| `protect_booking_payment_fields()` | Booking payment guard | 018 UPDATE; 019 INSERT |
| `protect_competition_registration_privileged_fields()` | Registration guard | 018 UPDATE; 019 INSERT |
| `can_manage_academy`, `can_view_academy`, etc. | RBAC | Unchanged |
| `can_manage_competition`, `is_competition_judge`, etc. | Competition RBAC | Unchanged |
| `find_profile_id_by_email` | Email lookup | **Risk:** anon executable |
| `redeem_coupon` | Coupon redemption | Server-side validation |

**Advisor finding:** Many helpers grant EXECUTE to `anon` — recommend revoking on non-RPC helpers.

---

## Triggers (security-relevant)

```
on_auth_user_created          → handle_new_user()
trg_protect_profile_privileged_fields
trg_protect_teacher_profile_privileged_fields
trg_protect_class_order_payment_fields      (BEFORE INSERT OR UPDATE)
trg_protect_booking_payment_fields          (BEFORE INSERT OR UPDATE)
trg_protect_competition_registration_privileged_fields (BEFORE INSERT OR UPDATE)
```

Service role inserts (`auth.uid() IS NULL`) bypass user-facing triggers by design.

---

## Views / materialized views

No materialized views in migrations. Public data exposure is via direct table SELECT policies (profiles, teacher_profiles, posts).

---

## Migration changelog (Sprint 18)

### 018_security_hardening.sql

- Sanitize signup role metadata
- Profile role escalation trigger
- Teacher self-verification trigger
- Payment UPDATE protection (class_orders, bookings, competition_registrations)
- Chat/booking participant profile read policies

### 019_insert_payment_hardening.sql

- Extended payment triggers to BEFORE INSERT
- class_orders INSERT policy requires `payment_status = 'pending'`
- bookings INSERT policy requires `status = 'pending'` + `payment_status = 'pending'`
- Dropped `"Students can activate own bookings after payment"` (client path removed)
- competition_registrations INSERT forces unpaid/pending for registrants

---

## Data reset script

`supabase/scripts/reset_production_test_data.sql` — truncates test data, preserves admin. Storage objects require Dashboard cleanup (SQL DELETE blocked on `storage.objects`).

---

## Supabase security advisor (2026-06-30)

| Lint | Count | Severity |
|------|-------|----------|
| Anon SECURITY DEFINER executable | 20+ | WARN |
| Public bucket listing (avatars, post-media) | 2 | WARN |
| Leaked password protection disabled | 1 | WARN |
| Mutable search_path on `set_updated_at` | 1 | WARN |

---

## Recommended next migrations

1. `020_profile_phone_private.sql` — move phone to `profile_contact_private` with restricted RLS
2. `021_revoke_anon_rpc.sql` — REVOKE EXECUTE on internal functions from PUBLIC/anon
3. `022_direct_video_call_thread_check.sql` — INSERT policy requires accepted chat thread

---

## Verification query (RLS enabled)

```sql
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
-- Expected: rowsecurity = true for all domain tables
```
