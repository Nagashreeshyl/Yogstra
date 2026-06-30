# RLS_AUDIT — Sprint 18

**Scope:** All `public.*` tables, storage buckets, RPC helpers  
**State:** Post-migrations `018` + `019` (applied production 2026-06-30)

---

## Policy model

- **Default deny:** RLS enabled on all domain tables; access only via explicit policies (OR-combined per command).
- **Admin bypass:** `is_admin()` on most sensitive tables.
- **Service role:** Bypasses RLS for payment fulfillment (server-only).

---

## Table audit matrix

| Table | Purpose | Current policies (summary) | Risk | Recommended |
|-------|---------|---------------------------|------|-------------|
| **profiles** | User identity | SELECT: public + chat/booking counterpart; INSERT: own, role ∈ {student,teacher}; UPDATE: own; ALL: admin | **Medium** — phone exposed on public SELECT | Split phone to private table or public view |
| **teacher_profiles** | Teacher public profile | SELECT: public; INSERT: own pending; UPDATE: own; ALL: admin + trigger | **Low** — status locked by trigger | OK |
| **categories** | Taxonomy | SELECT: all; ALL: admin | Low | OK |
| **bookings** | Student–teacher enrollment | SELECT: parties/admin; INSERT: pending only (019); UPDATE: teacher/admin; trigger blocks payment | **Low** (post-019) | OK |
| **schedules** | Session slots | SELECT: parties; INSERT: teacher/student/admin; UPDATE: teacher/admin | Low | OK |
| **posts** | Community feed | SELECT: all; INSERT: author; UPDATE/DELETE: admin | Low | OK |
| **comments** | Post comments | SELECT: all; INSERT: author | Low | OK |
| **messages** | Legacy booking chat | SELECT: booking parties; INSERT: sender on active booking | Low | OK |
| **payouts** | Teacher payouts | SELECT: teacher/admin; INSERT/UPDATE: admin | Low | OK |
| **chat_threads** | DM threads | SELECT/UPDATE: participant; INSERT: requester | Low | OK |
| **direct_messages** | DM content | SELECT: accepted participants; INSERT: accepted thread | Low | OK |
| **chat_thread_reads** | Read receipts | Own user_id | Low | OK |
| **chat_thread_settings** | Per-user settings | Own user_id | Low | OK |
| **chat_reports** | Abuse reports | INSERT: reporter in thread; SELECT: reporter/admin; UPDATE: admin | Low | OK |
| **class_orders** | Paid class purchases | INSERT: student pending (019); SELECT: parties; UPDATE: parties; trigger guards payment | **Low** (post-019) | OK |
| **direct_video_calls** | Video calls | SELECT/UPDATE: caller/callee; INSERT: caller only | **Medium** — no thread membership check | Add accepted-thread check on INSERT |
| **platform_settings** | Commission etc. | SELECT: authenticated; UPDATE: admin | Low | OK |
| **teacher_payout_private** | Razorpay/UPI secrets | Own teacher; ALL: admin | Low | OK |
| **teacher_coupons** | Discount codes | ALL: owner; SELECT: student received | Low | OK |
| **coupon_deliveries** | Coupon grants | Teacher ALL; student SELECT/UPDATE own | Low | OK |
| **teacher_notifications** | In-app alerts | Teacher SELECT/UPDATE; student INSERT on own order | Low | OK |
| **schedule_change_requests** | Reschedule flow | Student ALL; teacher UPDATE | Low | OK |
| **class_sessions** | Live class rooms | Teacher ALL; student SELECT/UPDATE ringing | Low | OK |
| **academies** | Academy orgs | SELECT: active/public/member/creator; INSERT: creator; UPDATE: manager | Low | OK |
| **academy_settings** | Academy config | View/manage via `can_*` helpers | Low | OK |
| **academy_members** | RBAC membership | View/manage via helpers; bootstrap INSERT owner | Low | OK |
| **teacher_academies** | Teacher affiliation | View/manage via helpers | Low | OK |
| **batches** | Class batches | View academy; manage manager/teacher | Low | OK |
| **batch_students** | Batch roster | View academy; manage manager | Low | OK |
| **competitions** | Events | SELECT: viewer/creator/organizer; INSERT: creator; UPDATE/DELETE: manager | Low | OK |
| **competition_events** | Schedule items | SELECT: viewer; ALL: organizer | Low | OK |
| **competition_categories** | Categories | SELECT: viewer; ALL: organizer | Low | OK |
| **competition_divisions** | Divisions | Via category permissions | Low | OK |
| **competition_registrations** | Sign-ups | SELECT: registrant/organizer; INSERT: registrant open; UPDATE: organizer or registrant (trigger blocks payment) | **Low** (post-019) | OK |
| **competition_participants** | Entrants | SELECT: student/judge/organizer; INSERT: registrant self; ALL: organizer | Low | OK |
| **competition_judges** | Judge roster | SELECT: judge/organizer; ALL: organizer | Low | OK |
| **competition_scores** | Judge scores | INSERT/UPDATE: assigned judge or organizer | Low | OK |
| **competition_results** | Published results | SELECT: published/participant/judge; ALL: organizer | Low | OK |
| **competition_certificates** | Certs + QR | SELECT: recipient/organizer/issued+token; ALL: organizer | Low | OK |
| **competition_rankings** | Leaderboard | SELECT: public; ALL: organizer/admin | Low (intentional) | OK |
| **competition_announcements** | News | SELECT: published/organizer; ALL: organizer | Low | OK |
| **profile_preferences** | User prefs | Own user_id | Low | OK |
| **enrollment_notifications** | Enrollment alerts | SELECT/UPDATE: own; no user INSERT | Low | OK |
| **platform_activity_log** | Activity feed | INSERT: own or null; SELECT: admin | **Low** — null user_id spam | Restrict null INSERT |
| **admin_audit_log** | Admin actions | INSERT/SELECT: admin | Low | OK |
| **beta_feedback** | Feedback | INSERT: own; SELECT: own/admin; UPDATE: admin | Low | OK |
| **platform_analytics_events** | Analytics | INSERT: own or null; SELECT: admin | Low | OK |

---

## Cross-tenant / cross-account checks

| Scenario | Result |
|----------|--------|
| Student reads another student's bookings | ❌ Denied |
| Teacher modifies another academy's batches | ❌ Denied (`can_manage_academy`) |
| Student scores competition they don't judge | ❌ Denied |
| Registrant confirms own paid registration | ❌ Denied (trigger + API) |
| User updates another profile | ❌ Denied (UPDATE own id only) |
| Anonymous reads competition rankings | ✅ Allowed (public leaderboard) |

---

## Policy conflicts / duplicates

- **profiles SELECT:** Multiple policies OR-combined — public + chat + booking. Intentional; increases exposure (phone issue).
- **competition_registrations UPDATE:** Organizer policy + registrant policy — registrant limited by trigger (no conflict).
- No duplicate conflicting ALL + UPDATE policies found on same role.

---

## Realtime

Tables in `007_realtime_storage_admin.sql` publication: chat, orders, sessions, competition entities — subject to same RLS on subscription.

---

## Storage RLS

| Bucket | INSERT | SELECT | Risk |
|--------|--------|--------|------|
| avatars | Authenticated own folder | Public | Listing warning |
| post-media | Author | Public | Listing warning |
| competition-documents | Registrant/organizer | Scoped private | OK |

---

## Changes in Sprint 18

| Migration | Policy/trigger change |
|-----------|----------------------|
| 018 | Profile INSERT role check; teacher INSERT pending; payment UPDATE triggers; chat/booking profile SELECT |
| 019 | class_orders INSERT pending; bookings INSERT pending; removed student activate-after-payment UPDATE policy; registration INSERT trigger |

---

## Recommendations (priority)

1. Replace open `profiles` SELECT with column-safe view
2. Revoke `EXECUTE` on internal SECURITY DEFINER functions from `anon`
3. Add thread membership check on `direct_video_calls` INSERT
4. Restrict `find_profile_id_by_email` to authenticated + academy invite context
