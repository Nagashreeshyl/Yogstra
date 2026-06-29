# Complete User Journeys — Yogstra V2

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Vision:** Yogstra is the Operating System for Yoga Academies, Teachers, and Competitions

---

## Journey Map Overview

```
                    ┌─────────────────────────────────────────┐
                    │           PUBLIC DISCOVERY               │
                    │  Landing → Explore → Profiles → Enroll   │
                    └─────────────────┬───────────────────────┘
                                      │
          ┌───────────────────────────┼───────────────────────────┐
          ▼                           ▼                           ▼
   ┌─────────────┐            ┌─────────────┐            ┌─────────────┐
   │   STUDENT   │            │   TEACHER   │            │   ACADEMY   │
   │  Dashboard  │            │  Dashboard  │            │  Dashboard  │
   └──────┬──────┘            └──────┬──────┘            └──────┬──────┘
          │                          │                          │
          └──────────────────────────┼──────────────────────────┘
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │              COMPETITIONS                │
                    │  Register → Prepare → Compete → Cert   │
                    └─────────────────────────────────────────┘
```

---

## 1. Student Journey (Redesigned)

### Phase A — Discovery

| Step | Action | Goal |
|------|--------|------|
| 1 | Land on homepage | Understand Yogstra value proposition |
| 2 | Browse Explore | Discover coaches, academies, programs, competitions |
| 3 | Filter & compare | Style, location, price, ratings, batch availability |
| 4 | View coach profile | Full professional profile (see 04_TEACHER_PROFILE_SPEC) |
| 5 | View academy profile | Programs, batches, teachers, facilities, reviews |
| 6 | Chat before joining | Ask questions via structured intro chat |

### Phase B — Enrollment

| Step | Action | Goal |
|------|--------|------|
| 7 | Book trial class | Free or paid intro session with calendar picker |
| 8 | Choose program | Foundation, Advanced, Personal Coaching, Competition Camp |
| 9 | Choose batch | Weekend, weekday, seasonal — see schedule & seats |
| 10 | Review enrollment | Coach, schedule, price, policy, coupon |
| 11 | Pay | Razorpay with confirmation preview |
| 12 | Welcome screen | What happens next, add to calendar, meet your coach |

### Phase C — Active Training

| Step | Action | Goal |
|------|--------|------|
| 13 | Daily dashboard | Today's class, practice, assignments, coach message |
| 14 | Attend classes | Live sessions via LiveKit |
| 15 | Track attendance | See history and streak |
| 16 | Complete assignments | Practice routines, feedback |
| 17 | View progress | Reports, achievements, certificates |

### Phase D — Competition

| Step | Action | Goal |
|------|--------|------|
| 18 | Discover competitions | From dashboard, coach, or academy |
| 19 | Register | Guided wizard with coach/academy context |
| 20 | Prepare | Coach assignments, practice plans |
| 21 | Compete | Attend event, view results |
| 22 | Certificate | Download, verify, share |

### Phase E — Renewal & Growth

| Step | Action | Goal |
|------|--------|------|
| 23 | Renewal reminder | Before enrollment expires |
| 24 | Renew or upgrade | Next program, advanced batch |
| 25 | Refer & review | Leave review, share achievement |

---

## 2. Teacher Journey (Redesigned)

### Phase A — Onboarding

| Step | Action | Goal |
|------|--------|------|
| 1 | Apply to teach | Professional registration form |
| 2 | Complete profile while pending | Photo, bio, certifications, specializations |
| 3 | Admin approval | Notification + dashboard access |
| 4 | Set up programs | Create batches, pricing, availability |
| 5 | Connect to academies | Accept academy invitations |

### Phase B — Program Management

| Step | Action | Goal |
|------|--------|------|
| 6 | Create programs | Foundation Batch, Personal Coaching, Competition Camp |
| 7 | Manage batches | Schedule, capacity, enrollment |
| 8 | Set availability | Calendar for personal coaching slots |
| 9 | Publish profile | Premium public profile goes live |

### Phase C — Student Management

| Step | Action | Goal |
|------|--------|------|
| 10 | Receive enrollments | Notification + dashboard |
| 11 | Manage students | Roster, attendance, progress |
| 12 | Assign practice | Homework, routines, feedback |
| 13 | Issue certificates | Completion, achievement |
| 14 | Send announcements | Batch-wide or individual |

### Phase D — Business

| Step | Action | Goal |
|------|--------|------|
| 15 | Track earnings | Revenue by program, payout timeline |
| 16 | Run promotions | Coupon campaigns |
| 17 | View analytics | Enrollment trends, retention |

### Phase E — Competition Coaching

| Step | Action | Goal |
|------|--------|------|
| 18 | Coach competition students | Prep plans, registration support |
| 19 | Track competition progress | Per-student readiness |

---

## 3. Academy Journey (Redesigned)

### Phase A — Setup

| Step | Action | Goal |
|------|--------|------|
| 1 | Create academy | Name, location, description, logo |
| 2 | Invite teachers | Email invitation with role assignment |
| 3 | Configure programs | Academy-branded batches and courses |
| 4 | Set up finance | Fee structure, payout accounts |

### Phase B — Operations

| Step | Action | Goal |
|------|--------|------|
| 5 | Manage batches | Create, schedule, capacity |
| 6 | Enroll students | Search by name/email, not UUID |
| 7 | Timetable | Batch-native schedule view |
| 8 | Attendance | Manual + live session tracking |
| 9 | Announcements | Academy-wide communications |

### Phase C — Public Presence

| Step | Action | Goal |
|------|--------|------|
| 10 | Public academy profile | Programs, teachers, reviews, gallery |
| 11 | Accept enrollment requests | Student applies → academy approves |
| 12 | Competition participation | Register academy batches |

### Phase D — Finance

| Step | Action | Goal |
|------|--------|------|
| 13 | Track revenue | By batch, teacher, program |
| 14 | Manage payouts | Teacher splits, academy share |
| 15 | Reports | Monthly statements |

---

## 4. Organizer Journey (Redesigned)

### Phase A — Access

| Step | Action | Goal |
|------|--------|------|
| 1 | Request organizer access | Dedicated onboarding, not teacher register |
| 2 | Admin grants access | Organizer workspace unlocked |

### Phase B — Event Management

| Step | Action | Goal |
|------|--------|------|
| 3 | Create competition | 7-step wizard (existing strength) |
| 4 | Configure events | Categories, divisions, fees, dates |
| 5 | Assign judges | Email invitation |
| 6 | Publish | Public listing |

### Phase C — Live Event

| Step | Action | Goal |
|------|--------|------|
| 7 | Monitor registrations | Real-time count, payments |
| 8 | Manage announcements | Event updates |
| 9 | Publish results | Rankings, certificates |

---

## 5. Judge Journey (Redesigned)

### Phase A — Assignment

| Step | Action | Goal |
|------|--------|------|
| 1 | Receive assignment | Email + in-app notification |
| 2 | Review competition brief | Rules, scoring criteria |

### Phase B — Scoring

| Step | Action | Goal |
|------|--------|------|
| 3 | Enter judge session | One-click from notification |
| 4 | Score participants | Structured scoring UI |
| 5 | Submit scores | Confirmation |

### Phase C — Post-Event

| Step | Action | Goal |
|------|--------|------|
| 6 | Review results | Published rankings |
| 7 | Certificate verification | Optional audit |

---

## 6. Cross-Journey Touchpoints

| Touchpoint | Student | Teacher | Academy | Organizer | Judge |
|------------|---------|---------|---------|-----------|-------|
| Messaging | ✓ | ✓ | — | — | — |
| Notifications | ✓ | ✓ | ✓ | ✓ | ✓ |
| Competitions | ✓ | ✓ | ✓ | ✓ | ✓ |
| Payments | ✓ | ✓ (receive) | ✓ (finance) | ✓ (fees) | — |
| Certificates | ✓ | ✓ (issue) | ✓ | ✓ (publish) | — |
| Public profile | View | Manage | Manage | — | — |

---

## 7. Lifecycle States

### Student enrollment states
`Prospect → Trial Booked → Enrolled → Active → Renewal Due → Renewed / Lapsed → Alumni`

### Teacher states
`Applicant → Pending → Verified → Active → Suspended → Alumni`

### Batch states
`Draft → Open → Full → In Progress → Completed → Archived`

### Competition states
`Draft → Registration Open → Registration Closed → In Progress → Scoring → Results Published → Archived`

---

*See individual flow specs: 05 (Enrollment), 06 (Payment), 07 (Teacher Dashboard), 08 (Student Dashboard), 09 (Academy), 10 (Competition)*
