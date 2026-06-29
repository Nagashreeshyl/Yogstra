# Payment Flow — Yogstra V2

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Replaces:** Simple "Proceed to Pay" modal

---

## Payment Philosophy

Payment is the **final step of enrollment**, not a standalone transaction. Students should never feel like they're "buying a product" — they're **confirming their commitment to a training program**.

---

## End-to-End Payment Journey

```
Student Intent
      ↓
Choose Program ──────────────── (see 05_STUDENT_ENROLLMENT_FLOW)
      ↓
Choose Batch / Schedule
      ↓
Review Summary
  · Program name & description
  · Coach credentials (mini)
  · Schedule preview
  · Seats available
  · What's included
  · Cancellation policy
      ↓
Apply Coupon (optional)
      ↓
Price Breakdown
  · Program fee
  · Platform fee (if applicable)
  · Discount
  · Total
      ↓
Proceed to Pay
      ↓
Razorpay Checkout
      ↓
Server Fulfillment
      ↓
Confirmation Screen
      ↓
Welcome Experience
      ↓
Dashboard (Today view)
```

---

## Payment Types

| Type | Flow | Razorpay |
|------|------|----------|
| Program enrollment | Full funnel | ✓ Order + payment |
| Personal coaching (pack) | Funnel, session pack | ✓ |
| Trial class | Free, no payment | ✗ |
| Competition entry fee | Competition wizard step | ✓ (new) |
| Renewal | Dashboard prompt → shortened funnel | ✓ |
| Academy enrollment | Academy funnel | ✓ |

---

## Price Display Rules

1. **Always show total before Razorpay** — no surprises
2. **Break down fees** — program fee + platform fee (transparent)
3. **Show original + discounted** when coupon applied
4. **Currency:** INR (₹) — formatted with locale
5. **GST note:** "Inclusive of applicable taxes" footer

---

## Coupon Flow

### Student-side

```
Enter code → Validate → Show discount → Apply to total
```

### Validation checks

- Code exists and belongs to coach/academy
- Not expired
- Usage limit not exceeded
- Applicable to selected program type
- Not already used by this student

### Server-side (fix required)

On `fulfillPaidClassOrder`:
1. Verify payment with Razorpay
2. Create enrollment + schedule
3. **Mark coupon as redeemed** ← currently missing
4. Update `coupon_deliveries` or usage count

---

## Razorpay Integration

### Order creation

```javascript
{
  amount: totalInPaise,
  currency: 'INR',
  receipt: `enrollment_${enrollmentId}`,
  notes: {
    student_id,
    coach_id,
    program_id,
    batch_id,
    enrollment_type: 'foundation_batch'
  }
}
```

### Route split (teacher payout)

If teacher has Razorpay linked account:
- Platform fee retained
- Remainder transferred to teacher via Route

### Fulfillment webhook

`/api/fulfill-payment` (existing) extended for:
- Enrollment creation
- Coupon redemption
- Teacher notification
- Confirmation email trigger

---

## Confirmation Screen

```
┌─────────────────────────────────────────────────────────────┐
│                    ✓ Payment Successful                     │
│                                                             │
│  Enrollment confirmed · Receipt #YG-2026-004521             │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │ Foundation Program                                   │   │
│  │ Weekday Batch · Mon/Wed 6 PM                        │   │
│  │ Coach: Priya Sharma                                  │   │
│  │ Starts: July 15, 2026                               │   │
│  │ Amount paid: ₹4,100                                 │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  [Download Receipt]  [Add to Calendar]  [Go to Dashboard]  │
└─────────────────────────────────────────────────────────────┘
```

---

## Welcome Experience (Post-Confirmation)

First-time enrolled students see:

1. **Welcome modal** on dashboard (dismissible, once)
2. **Coach introduction** — auto chat message from coach (template)
3. **First class highlight** — prominent on Today view
4. **Getting started checklist:**
   - ☐ Complete your profile
   - ☐ Read coach's welcome message
   - ☐ Add first class to calendar
   - ☐ Review practice guidelines

---

## Renewal Flow

When enrollment approaches end (`renewal_due` status):

### Dashboard banner

```
Your Foundation Program ends in 5 days.
[Renew Now]  [View Options]
```

### Renewal funnel (shortened)

```
Step 1: Renew same program OR upgrade
Step 2: Confirm schedule (may change batch)
Step 3: Payment
Step 4: Confirmation
```

Pre-filled with previous enrollment data.

---

## Payment History (Enrollments Page)

Student `/app/student/enrollments`:

| Column | Data |
|--------|------|
| Program | Name + coach |
| Period | Start – end date |
| Amount | Paid |
| Status | Active / Completed / Renewal due |
| Receipt | Download link |

---

## Competition Entry Fee Payment

New step in competition registration wizard:

```
Step N: Entry Fee
  Fee: ₹500
  [Apply coupon] (if organizer enabled)
  [Proceed to Pay]
```

On success → registration status = `confirmed` (not just `registered`).

---

## Refund Policy (Display Only — Manual Process)

Shown during review step:

| Timing | Policy |
|--------|--------|
| 7+ days before start | Full refund |
| 3–7 days before | 50% refund |
| < 3 days | No refund |
| After start | No refund |

Admin handles refunds manually via Razorpay dashboard.

---

## Error Handling

| Error | User message | Action |
|-------|--------------|--------|
| Payment cancelled | "Payment was cancelled. Your enrollment is not confirmed." | Retry button |
| Payment failed | "Payment failed. Please try again." | Retry button |
| Fulfillment failed | "Payment received — we're confirming your enrollment." | Support contact + auto-retry |
| Duplicate payment | "You're already enrolled." | Link to dashboard |

---

## Migration from V1

| V1 | V2 |
|----|-----|
| `class_orders` | `enrollments.payment_order_id` |
| BuyClassModal | EnrollmentFunnel |
| "Proceed to Pay" | "Confirm Enrollment" |
| Chat-only purchase | Profile + chat + dashboard |
| No receipt | Receipt download |
| No renewal | Renewal flow |

---

## Implementation Priority

1. **P0:** Enrollment funnel UI (wraps existing Razorpay)
2. **P0:** Confirmation + welcome screen
3. **P0:** Fix coupon server redemption
4. **P1:** Enrollments history page
5. **P1:** Renewal banner + flow
6. **P2:** Competition entry fee payment
7. **P2:** Confirmation email

---

*See 05_STUDENT_ENROLLMENT_FLOW.md for funnel steps, 08_STUDENT_DASHBOARD_FLOW.md for post-payment dashboard*
