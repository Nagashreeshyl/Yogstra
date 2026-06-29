# Student Enrollment Flow

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Replaces:** BuyClassModal single-step checkout

---

## Overview

Enrollment is a guided, multi-step funnel that helps students make informed decisions before payment. It applies to all program types: batches, personal coaching, competition camps, workshops.

---

## Entry Points

| Source | Pre-filled |
|--------|------------|
| Coach profile → Enroll | coach_id, program list |
| Coach profile → Book Trial | coach_id, trial program |
| Academy profile → Enroll | academy_id, batch list |
| Program card on Discover | program_id |
| Chat → Enroll | coach_id, thread context |
| Dashboard → Renew | existing enrollment |

---

## Funnel Steps

### Step 1: Choose Program

```
┌─────────────────────────────────────────────────────────────┐
│ ENROLL WITH PRIYA SHARMA                                    │
│ Step 1 of 5 · Choose Program                                │
│                                                             │
│ ○ Foundation Program                                        │
│   8-week beginner batch · ₹4,999/month                      │
│                                                             │
│ ○ Personal Coaching                                         │
│   1-on-1 sessions · ₹1,500/session                          │
│                                                             │
│ ○ Competition Camp                                          │
│   12-week prep · ₹8,999 total                               │
│                                                             │
│ ○ Book Trial Class (Free)                                   │
│   30-min intro session                                      │
│                                                             │
│                                          [Continue →]       │
└─────────────────────────────────────────────────────────────┘
```

**Validation:** Must select one program.

---

### Step 2: Choose Batch / Schedule

*(Skipped for Personal Coaching — goes to availability picker)*

```
┌─────────────────────────────────────────────────────────────┐
│ Step 2 of 5 · Choose Batch                                  │
│                                                             │
│ Foundation Program                                          │
│                                                             │
│ ○ Weekday Batch · Mon/Wed 6 PM                             │
│   Starts Jul 15 · 8 seats left · Coach: Priya              │
│                                                             │
│ ○ Weekend Batch · Sat/Sun 8 AM                             │
│   Starts Jul 20 · 3 seats left · Coach: Priya              │
│                                                             │
│ ◀ Back                                    [Continue →]      │
└─────────────────────────────────────────────────────────────┘
```

**Data:** Batch schedule, capacity, assigned coach, start date.

**Empty state:** "No batches open — Message coach to join waitlist"

---

### Step 3: Review Details

```
┌─────────────────────────────────────────────────────────────┐
│ Step 3 of 5 · Review                                        │
│                                                             │
│ Program    Foundation Program                               │
│ Batch      Weekday · Mon/Wed 6 PM                          │
│ Coach      Priya Sharma                                     │
│ Starts     July 15, 2026                                    │
│ Duration   8 weeks                                          │
│                                                             │
│ WHAT'S INCLUDED                                             │
│ ✓ 16 live group sessions                                    │
│ ✓ Practice assignments                                      │
│ ✓ Progress tracking                                         │
│ ✓ Certificate on completion                                 │
│                                                             │
│ SCHEDULE PREVIEW                                            │
│ Mon Jul 15 · 6:00 PM                                        │
│ Wed Jul 17 · 6:00 PM                                        │
│ Mon Jul 22 · 6:00 PM                                        │
│ ... [View all 16 sessions]                                  │
│                                                             │
│ CANCELLATION POLICY                                         │
│ Full refund if cancelled 7+ days before start.              │
│                                                             │
│ ◀ Back                                    [Continue →]      │
└─────────────────────────────────────────────────────────────┘
```

---

### Step 4: Apply Coupon & Confirm Price

```
┌─────────────────────────────────────────────────────────────┐
│ Step 4 of 5 · Payment                                       │
│                                                             │
│ Foundation Program · Weekday Batch                          │
│                                                             │
│ Program fee                              ₹4,999             │
│ Platform fee                               ₹100             │
│ ─────────────────────────────────────────────               │
│ Subtotal                                 ₹5,099             │
│                                                             │
│ Coupon code  [SUMMER20        ] [Apply]                     │
│                                                             │
│ Discount (20%)                          -₹999               │
│ ─────────────────────────────────────────────               │
│ Total                                    ₹4,100             │
│                                                             │
│ ◀ Back                              [Proceed to Pay →]      │
└─────────────────────────────────────────────────────────────┘
```

**Coupon validation:** Same as current — check `teacher_coupons`, expiry, usage limit.

---

### Step 5: Payment (Razorpay)

Standard Razorpay checkout overlay. On success → Confirmation screen.

---

### Step 6: Confirmation & Welcome

```
┌─────────────────────────────────────────────────────────────┐
│ ✓ YOU'RE ENROLLED!                                          │
│                                                             │
│ Foundation Program · Weekday Batch                          │
│ Coach: Priya Sharma                                         │
│ Starts: Monday, July 15 at 6:00 PM                          │
│                                                             │
│ WHAT'S NEXT                                                 │
│ 1. Priya will send a welcome message                        │
│ 2. Your first class is Mon Jul 15 at 6 PM                   │
│ 3. Check your dashboard for practice assignments            │
│                                                             │
│ [Add to Calendar]  [Message Coach]  [Go to Dashboard]     │
│                                                             │
│ Receipt sent to student@email.com                           │
└─────────────────────────────────────────────────────────────┘
```

**Backend actions on success:**
1. Create enrollment record
2. Create schedule entries
3. Activate booking
4. Mark coupon used (server-side)
5. Send chat confirmation card
6. Notify teacher
7. Send confirmation email (future)

---

## Trial Class Flow (Abbreviated)

```
Choose "Book Trial Class"
      ↓
Pick available slot (calendar)
      ↓
Confirm (free — no payment)
      ↓
Confirmation + calendar add
      ↓
After trial: "Enroll in full program?" prompt
```

---

## Academy Enrollment Flow

When enrolling via academy profile:

```
Step 1: Choose Program (academy batches)
Step 2: Choose Batch
Step 3: Review (includes academy name, facilities)
Step 4: Payment (may include academy fee split)
Step 5: Confirmation (welcome from academy + assigned coach)
```

**Alternative:** "Request Enrollment" for academies that require approval before payment.

---

## Error & Edge Cases

| Scenario | Handling |
|----------|----------|
| Batch full | Show waitlist option |
| Payment failed | Retry with same enrollment draft |
| Coupon invalid | Inline error, allow proceed without |
| Not logged in | Save funnel state, redirect to auth, resume |
| Coach unverified | Block enrollment, show "Coach pending verification" |
| Duplicate enrollment | "You're already enrolled in this program" |

---

## Data Model

### Enrollment (new unified entity)

```sql
enrollments (
  id uuid PK,
  student_id uuid FK profiles,
  coach_id uuid FK profiles,
  academy_id uuid FK academies NULL,
  program_id uuid FK programs NULL,
  batch_id uuid FK batches NULL,
  program_type text, -- foundation, personal, competition_camp, workshop, trial
  status text, -- prospect, trial, active, renewal_due, lapsed, completed
  start_date date,
  end_date date,
  amount_paid numeric,
  coupon_id uuid NULL,
  payment_order_id text NULL,
  created_at timestamptz
)
```

**Migration path:** Map existing `class_orders` + `bookings` → `enrollments`

---

## UI Component Structure

```
<EnrollmentFunnel>
  <StepIndicator current={step} total={5} />
  <StepChooseProgram />
  <StepChooseBatch />
  <StepReview />
  <StepPayment />
  <StepConfirmation />
</EnrollmentFunnel>
```

Can be full-page (/enroll/:coachId) or modal on smaller screens.

---

*Payment details in 06_PAYMENT_FLOW.md*
