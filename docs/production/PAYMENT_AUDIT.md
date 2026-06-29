# Payment Audit — Sprint 15

**Date:** 2026-06-30  
**Scope:** Razorpay class booking / enrollment payments

---

## Executive summary

Payment verification is **server-authoritative**. The client Razorpay success handler is a convenience path; the webhook provides async recovery. Fulfillment is **idempotent** and creates complete enrollment records.

| Check | Status |
|---|---|
| Signature verification (client fulfill) | ✅ `verifyPaymentSignature()` |
| Webhook HMAC | ✅ `verifyWebhookSignature()` |
| Auth on order create | ✅ Student bearer token |
| Auth on fulfill | ✅ `assertOrderFulfillAccess()` |
| Amount validation | ✅ Server recalculates fee + coupon |
| Duplicate payment processing | ✅ Atomic order claim |
| Duplicate enrollment purchase | ✅ Active paid order check |
| Coupon single-use | ✅ Server redeem on fulfill |
| Secrets server-only | ✅ Razorpay secret, service role |

---

## Payment paths

### Path A — Client fulfill (primary UX)

```
Razorpay success callback
  → POST /api/razorpay-fulfill
  → verifyPaymentSignature(orderId, paymentId, signature)
  → assertOrderFulfillAccess(token, orderId)
  → fulfillPaidClassOrder()
```

**Invalid signature:** HTTP 400, no DB changes.

### Path B — Webhook (recovery)

```
payment.captured webhook
  → verifyWebhookSignature(rawBody, header)
  → fulfillPaidClassOrder() — same idempotent logic
```

No client trust required.

---

## Order lifecycle

| State | `class_orders.payment_status` | Meaning |
|---|---|---|
| Created | `pending` | Razorpay order created, awaiting payment |
| Completed | `paid` | Verified payment, enrollment fulfilled |
| Failed | `failed` | Payment failed (manual/admin) |
| Cancelled | `cancelled` | Abandoned checkout |

Unique indexes on `razorpay_order_id` and `razorpay_payment_id` prevent duplicate payment IDs.

---

## Financial records created

| Table | Fields | When |
|---|---|---|
| `class_orders` | amount, gross_amount, platform_fee, teacher_amount, razorpay_* | Order create + fulfill update |
| `payouts` | teacher_amount, commission, razorpay_payment_id | On fulfill |
| `bookings` | monthly_fee, payment_status=paid, status=active | On fulfill |
| `coupon_deliveries` | used_at, order_id | On fulfill (if coupon) |

---

## Commission & Route

- Platform commission from `platform_settings` via `prepareOrderSplit()`
- Razorpay Route transfer when teacher linked account active
- `transfer.processed` webhook updates payout status

---

## Fixes applied (Sprint 15)

1. **Never skip fulfillment** — client throws if order API unavailable after payment
2. **Atomic claim** — prevents double schedule/booking on webhook + client race
3. **Coupon redemption** — server-side admin redeem (was client-only dead path)
4. **financeService** — corrected column names for payment history display
5. **Duplicate enrollment guard** — server rejects order if active paid period exists

---

## Refund placeholder

Refunds are not automated in MVP. Manual process:

1. Issue refund in Razorpay Dashboard
2. Update `class_orders.payment_status` → `cancelled` (admin)
3. Update `bookings.status` → `cancelled`
4. Reverse payout record if needed

Future: `refund.created` webhook handler.

---

## API security

| Route | Rate limit | Auth |
|---|---|---|
| `/api/razorpay-order` | 20/min | Student JWT |
| `/api/razorpay-fulfill` | 30/min | Student JWT + order ownership |
| `/api/razorpay-webhook` | — | HMAC signature |

CORS restricted to deployment origin in production.
