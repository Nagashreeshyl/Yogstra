# Enrollment Workflow Report — Sprint 15

**Date:** 2026-06-30

---

## Summary

Sprint 15 completes the **payment-to-enrollment** business workflow. A successful Razorpay payment now atomically creates all enrollment records, notifies all parties, and updates dashboards in real time.

---

## Workflow (post-payment)

```
Razorpay payment.captured
        ↓
verifyPaymentSignature (client fulfill) OR webhook HMAC
        ↓
assertOrderFulfillAccess (student owns order)
        ↓
fulfillPaidClassOrder()
  1. Claim order (payment_status: pending → paid) — idempotent
  2. Create schedule (if missing)
  3. Create payout record (if missing)
  4. Redeem coupon (if applicable)
  5. Upsert active booking
  6. Enroll in academy batch (group + teacher academy)
  7. Insert chat confirmation message (once)
  8. Insert notifications (teacher, student, academy owners, admins)
        ↓
Supabase Realtime propagates changes
        ↓
Client enrollmentEvents + useLiveDataRefresh refetch dashboards
```

---

## Backend events

| Event | Trigger | Handler |
|---|---|---|
| `order.created` | Razorpay order API | `createPendingClassOrder()` |
| `payment.verified` | Client fulfill / webhook | `verifyPaymentSignature()` |
| `enrollment.claimed` | Fulfill start | UPDATE `class_orders` WHERE pending |
| `schedule.created` | After claim | INSERT `schedules` |
| `booking.activated` | After claim | UPSERT `bookings` |
| `payout.recorded` | After claim | INSERT `payouts` |
| `coupon.redeemed` | After claim | UPDATE `coupon_deliveries`, `teacher_coupons` |
| `academy.enrolled` | Group class | INSERT `batch_students` |
| `notification.dispatched` | After claim | INSERT `teacher_notifications`, `enrollment_notifications` |
| `enrollment.complete` | Client after verify | `dispatchEnrollmentComplete()` |

---

## UI state transitions

| Surface | Before payment | After payment |
|---|---|---|
| Teacher profile CTA | Enroll in Program | Enrolled (disabled) + Continue Training |
| Student dashboard | No coach / stale | My Coach, Next Class, notifications |
| Teacher dashboard | Stale counts | Updated students, revenue, alerts |
| Payment history | Missing/wrong amounts | Correct paid transactions |
| Chat | — | Booking confirmation message |

---

## Idempotency guarantees

- Order claim uses `UPDATE ... WHERE payment_status = 'pending'`
- Already-paid orders return `{ alreadyFulfilled: true }` without side effects
- Notifications use unique index on `(order_id, role, user_id)`
- Chat message deduped by payment reference substring
- Payout deduped by `class_order_id`
- Webhook + client fulfill can race safely

---

## Edge case behavior

| Case | Behavior |
|---|---|
| Double-click Pay | `submitting` guard blocks second checkout open |
| Refresh during payment | Webhook fulfills if client fails |
| Browser close after pay | Webhook fulfills asynchronously |
| Duplicate callbacks | Idempotent claim + deduped inserts |
| Payment failure | Razorpay `payment.failed` handler; order stays pending |
| Cancelled payment | Modal dismiss; order stays pending |
| Already enrolled | Server rejects new order if active paid period exists |
| Invalid signature | 400 from fulfill API; no enrollment |

---

## Validation

```bash
npm run lint   # passes (warnings only)
npm run build  # passes
```
