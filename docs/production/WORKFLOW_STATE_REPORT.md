# Workflow State Report — Sprint 15

**Date:** 2026-06-30  
**Topic:** Database state after successful class enrollment payment

---

## Tables modified on enrollment

| Table | Operation | Key fields set |
|---|---|---|
| **`class_orders`** | UPDATE (claim) | `payment_status=paid`, `razorpay_payment_id`, `schedule_id`, `transfer_status` |
| **`schedules`** | INSERT | `teacher_id`, `student_id`, `class_type`, `scheduled_at`, `duration_minutes=60` |
| **`bookings`** | INSERT or UPDATE | `status=active`, `payment_status=paid`, `monthly_fee`, `start_date` |
| **`payouts`** | INSERT | `teacher_id`, `class_order_id`, `gross_amount`, `teacher_amount`, `status` |
| **`coupon_deliveries`** | UPDATE | `used_at`, `order_id` (if coupon used) |
| **`teacher_coupons`** | UPDATE | `use_count + 1` (if coupon used) |
| **`batch_students`** | INSERT | Group class + teacher academy affiliation (if applicable) |
| **`direct_messages`** | INSERT | Booking confirmation in chat thread |
| **`teacher_notifications`** | INSERT | `type=class_booking`, new student enrolled |
| **`enrollment_notifications`** | INSERT | Student, teacher, academy owner, admin recipients |

---

## State relationships after enrollment

```
profiles (student)
  ├── class_orders (paid) ──→ schedules (first session)
  │                        ──→ payouts (teacher share)
  │                        ──→ enrollment_notifications
  ├── bookings (active) ──→ links student ↔ teacher
  ├── batch_students (optional) ──→ batches ──→ academies
  └── direct_messages (confirmation)

profiles (teacher)
  ├── teacher_notifications (new enrollment)
  ├── enrollment_notifications
  └── bookings (active student count source)

academy_members (owners/managers)
  └── enrollment_notifications (student joined)
```

---

## Enrollment status source of truth

| Question | Source |
|---|---|
| Is student enrolled with teacher? | `class_orders` WHERE paid AND within duration window |
| Active coaching relationship | `bookings` WHERE status=active AND payment_status=paid |
| Academy membership | `batch_students` WHERE status=active |
| Payment receipt | `class_orders` + `payouts` |
| Next class | `schedules` nearest future row |

**UI rule:** `useActiveClassPurchase` checks paid `class_orders` expiry. Profile shows **Enrolled** when active purchase exists.

---

## Realtime subscriptions

| Scope | Tables watched | Consumers |
|---|---|---|
| `schedules` | schedules, class_orders, enrollment_notifications | Student/teacher dashboards, active purchase hook |
| `bookings` | bookings | Dashboards, teacher students page |
| `payouts` | payouts | Teacher earnings/revenue |

Client `enrollmentEvents` provides immediate same-tab refresh before realtime propagates.

---

## Notification matrix

| Recipient | Table | Title |
|---|---|---|
| Student | `enrollment_notifications` | Enrollment successful |
| Teacher | `teacher_notifications` + `enrollment_notifications` | New student enrolled |
| Academy owner/manager | `enrollment_notifications` | Student joined academy |
| Platform admin | `enrollment_notifications` | New paid enrollment |

---

## Before vs after purchase (UI)

| Component | Before | After |
|---|---|---|
| Teacher profile button | Enroll in Program | Enrolled + Continue Training |
| Student dashboard coach card | Empty / stale | Shows enrolled coach |
| Student notifications | Schedule changes only | + Enrollment successful |
| Teacher student count | Stale | Updates via bookings realtime |
| Teacher revenue widget | Stale | Updates via payouts realtime |
| Finance pages | Broken column refs | Shows paid transactions |

---

## Migration

`013_enrollment_notifications.sql` — new table + RLS + realtime publication.

Applied to production Supabase project on 2026-06-30.
