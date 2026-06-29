# Enrollment Flow Audit — Sprint 15

**Date:** 2026-06-30  
**Scope:** Teacher profile → payment → enrollment → dashboard sync

---

## Flow map

```
TeacherProfilePage / WhatsAppChatWindow
  → ensureDirectChat()                    [chat_threads]
  → BuyClassModal                         [UI: program, date, coupon]
  → openRazorpayCheckout()                [payments.ts]
  → POST /api/razorpay-order              [class_orders INSERT pending]
  → Razorpay checkout
  → POST /api/razorpay-fulfill            [signature verify + fulfillPaidClassOrder]
  → (parallel) POST /api/razorpay-webhook [payment.captured → same fulfill]
  → Dashboard refresh via realtime + enrollmentEvents
```

---

## Step-by-step audit

| Step | File | Before Sprint 15 | After Sprint 15 |
|---|---|---|---|
| Enroll CTA | `TeacherProfilePage.tsx` | Disabled button, same label | **Enrolled** + Continue Training + View Program |
| Purchase modal | `BuyClassModal.tsx` | Closed on success, no sync | Refetch + enrollment event dispatch |
| Order creation | `api/razorpay-order.ts` | Pending order + validation | Unchanged (server-side amount/coupon validation) |
| Payment verify | `api/razorpay-fulfill.ts` | Signature + access check | Unchanged (authoritative path) |
| Fulfillment | `server/fulfillPayment.ts` | Partial writes, duplicate risk | **Atomic claim**, idempotent side effects |
| Booking | `bookings` table | Skipped on active renewal | **Always upsert** active booking |
| Coupon | `coupon_deliveries` | Never redeemed server-side | **Redeemed on fulfill** |
| Academy | `batch_students` | Not linked | **Auto-enroll on group + teacher academy** |
| Notifications | `teacher_notifications` only | Teacher only | **+ enrollment_notifications** (student/academy/admin) |
| Student dashboard | `StudentDashboardPage.tsx` | Static until navigation | **Live refresh** + enrollment notifications |
| Teacher dashboard | `TeacherDashboardPage.tsx` | Static | **Live refresh** + enrollment event listener |
| Duplicate purchase | — | Client-only check | **Server rejects active paid order** |
| Payment history | `financeService.ts` | Wrong column names | **Fixed** (`amount`, `gross_amount`, `coupon_id`) |

---

## Gaps closed this sprint

1. Payment success now completes full enrollment atomically
2. Server-side signature verification remains authoritative (client success never trusted alone)
3. Idempotent fulfillment prevents duplicate schedules/messages/notifications
4. Coupon redemption on server
5. Academy batch enrollment for group programs
6. Enrollment notifications for all parties
7. Dashboard live sync without manual refresh
8. Enrolled UI state on teacher profile

---

## Remaining known limitations (MVP)

| Item | Notes |
|---|---|
| Recurring sessions | Only first `schedules` row created; renewal extends booking not multi-session generation |
| `class_sessions` / LiveKit room | Created on join, not at payment |
| Competition enrollment | Separate flow (still stub payment) |
| Email/push dispatch | In-app notifications only |

---

## Key files

| Area | Path |
|---|---|
| Client checkout | `src/services/payments.ts` |
| Fulfillment | `server/fulfillPayment.ts` |
| Order validation | `server/orderValidation.ts` |
| Enrollment events | `src/services/enrollmentEvents.ts` |
| Notifications | `src/services/enrollmentNotifications.ts` |
| Migration | `supabase/migrations/013_enrollment_notifications.sql` |
