# Terminology Guide — Yogstra V2

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Rule:** Every user-facing string should sound like a premium yoga academy platform

---

## Core Positioning

| Old | New |
|-----|-----|
| Yoga marketplace | Training platform |
| Find teachers | Discover coaches |
| Teacher listing | Coach profile |
| Buy / Purchase | Enroll / Join |
| Shop | Enrollments |
| Orders | Enrollments |
| Bookings | Enrollments |

---

## Program Types

| Old | New | Context |
|-----|-----|---------|
| 1-on-1 | Personal Coaching | Individual sessions |
| 1-to-many | Training Batch | Group classes |
| Group class | Training Batch | Group classes |
| Group coaching | Training Batch | Group classes |
| Online class | Live Session | Video class |
| Course | Program | Structured training |
| Buy course | Join program | Enrollment CTA |
| Subscription | Enrollment | Ongoing access |
| Package | Program | Fee structure |

### New Program Type Names

| Term | Use for |
|------|---------|
| Foundation Program | Beginner-level structured training |
| Advanced Program | Intermediate/advanced training |
| Training Batch | Ongoing group class series |
| Personal Coaching | 1-on-1 sessions |
| Competition Camp | Competition preparation program |
| Workshop | Single or multi-day intensive |
| Masterclass | Guest expert session |
| Seasonal Camp | Time-bound intensive (summer, winter) |
| Weekend Batch | Weekend-only schedule |

---

## User Roles

| Old | New | Notes |
|-----|-----|-------|
| Teacher | Coach | Public-facing only; keep "Teacher" in admin/DB |
| Student | Student | Unchanged |
| Admin | Platform Admin | When visible to users |

---

## Navigation Labels

### Student

| Old | New |
|-----|-----|
| Home | Today |
| Training | My Programs |
| Classes | My Programs (consolidated) |
| Shop | Enrollments |
| Find Teachers | Discover |
| Teachers | My Coaches |

### Teacher

| Old | New |
|-----|-----|
| Coupons | Promotions |
| Pricing (settings) | Programs |
| Earnings | Earnings (unchanged) |
| Buy Class notification | New enrollment |

### Academy

| Old | New |
|-----|-----|
| Timetable | Schedule |
| Batches | Programs & Batches |
| Bookings | Enrollments |

### Admin

| Old | New |
|-----|-----|
| Bookings | Enrollments |
| Class orders | Enrollments |
| Schedules | Sessions |

---

## Action Buttons & CTAs

| Old | New | Context |
|-----|-----|---------|
| Buy Online Class | Enroll in Program | Coach profile |
| Proceed to Pay | Confirm Enrollment | Payment step |
| Buy Class | Enroll | Chat action |
| Request Teacher | Request Introduction | First contact |
| Book Now | Book Trial Class | Trial booking |
| Pay Now | Confirm & Pay | Payment |
| Add to Cart | — | Remove (no cart) |
| Checkout | Complete Enrollment | Payment flow |
| Purchase | Enroll | Any context |

---

## Status Labels

| Old | New |
|-----|-----|
| Active booking | Active enrollment |
| Paid order | Confirmed enrollment |
| Pending order | Pending enrollment |
| Class order | Enrollment record |
| Ongoing | Active |
| Expired booking | Lapsed enrollment |

---

## Payment & Finance

| Old | New |
|-----|-----|
| Order | Enrollment |
| Order ID | Enrollment ID |
| Receipt / Order receipt | Enrollment receipt |
| Refund order | Cancel enrollment |
| Payout | Coach payout |
| Revenue | Earnings |

---

## Competition

| Old | New | Notes |
|-----|-----|-------|
| Register | Register | Unchanged |
| Sign up | Register | Competition context |
| Entry | Registration | Noun form |
| Contest | Competition | Always "competition" |
| Event | Event | Unchanged (sub-unit of competition) |

---

## Messaging

| Old | New |
|-----|-----|
| Chat | Messages |
| Send message | Message |
| Conversation | Conversation (unchanged) |
| Inbox | Messages |

---

## Empty States & Prompts

| Old | New |
|-----|-----|
| No bookings yet | No enrollments yet |
| You haven't purchased any classes | You haven't joined any programs |
| Find a teacher to get started | Discover a coach to begin your journey |
| Set your pricing | Create your first program |
| No students yet | No students enrolled yet |

---

## Error Messages

| Old | New |
|-----|-----|
| Failed to create order | Enrollment could not be completed |
| Order not found | Enrollment not found |
| Payment required | Complete enrollment to continue |
| Booking expired | Your enrollment has ended |

---

## Email & Notification Templates

| Old | New |
|-----|-----|
| Your class order is confirmed | You're enrolled in {program_name} |
| New booking from {student} | {student} joined {program_name} |
| Your booking expires soon | Your enrollment renews in {days} days |
| Buy class reminder | Continue your training — renew enrollment |

---

## Public Website Copy

| Old | New |
|-----|-----|
| Find the perfect yoga teacher | Discover world-class yoga coaches |
| Browse teachers | Discover coaches |
| Online yoga classes | Live yoga training programs |
| Book a class | Join a program |
| Yoga marketplace | The operating system for yoga academies |
| Buy classes online | Enroll in professional training programs |

---

## Terms to Never Use (User-Facing)

- Marketplace
- Buy / Purchase / Shop
- 1-on-1 / 1-to-many
- Order (use "enrollment")
- Listing
- Cart / Checkout
- Subscription (use "enrollment")
- Customer (use "student")
- Vendor (use "coach")
- Product (use "program")

---

## Database vs UI

Internal code and database tables may keep existing names (`class_orders`, `bookings`, `teacher_profiles`). Only **user-facing strings** change.

| DB/Code | UI Label |
|---------|----------|
| `class_orders` | Enrollment |
| `bookings` | Enrollment |
| `teacher_profiles` | Coach profile |
| `teacher_coupons` | Promotion |
| `batches` | Batch (unchanged) |
| `schedules` | Session / Class |

---

## Migration Strategy

### Phase 1: High-visibility strings (P0)
- All CTAs on coach profile, enrollment funnel, dashboard nav
- BuyClassModal → EnrollmentFunnel labels
- Navigation tab names

### Phase 2: Secondary strings (P1)
- Settings pages, admin labels, notification text
- Empty states, error messages
- Email templates

### Phase 3: Deep strings (P2)
- Help center articles, legal pages
- Admin reports, audit logs
- API response messages

### Implementation approach
- Create `src/constants/terminology.ts` with all labels
- Replace hardcoded strings with constants
- Single source of truth for future localization

```typescript
export const TERMS = {
  enroll: 'Enroll in Program',
  personalCoaching: 'Personal Coaching',
  trainingBatch: 'Training Batch',
  myPrograms: 'My Programs',
  discoverCoaches: 'Discover Coaches',
  confirmEnrollment: 'Confirm Enrollment',
  // ...
} as const;
```

---

*Apply during implementation per 12_IMPLEMENTATION_PLAN.md*
