# Teacher Dashboard Flow

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Vision:** Teacher manages a professional coaching practice, not a marketplace listing

---

## Dashboard Philosophy

The teacher dashboard should feel like **running a professional academy** — managing programs, students, schedules, and business — not like maintaining a marketplace profile.

---

## Overview Page (`/app/teacher`)

### Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Good morning, Priya · Monday, June 30                       │
│                                                             │
│ ┌─ TODAY ──────────────────────────────────────────────┐   │
│ │ 6:00 PM · Foundation Batch (8 students)              │   │
│ │ 7:30 PM · Personal Coaching · Rahul                  │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ QUICK STATS ────────────────────────────────────────┐   │
│ │ Active Students: 24  │  This Month: ₹42,000         │   │
│ │ Open Enrollments: 3  │  Pending Messages: 2         │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ ACTION ITEMS ───────────────────────────────────────┐   │
│ │ ⚠ Set up your first program to start accepting students│  │
│ │ 📝 2 students need progress feedback                   │   │
│ │ 💬 Reply to Ananya's message                          │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                             │
│ ┌─ RECENT ENROLLMENTS ─────────────────────────────────┐   │
│ │ Rahul joined Competition Camp · 2 hours ago           │   │
│ │ Meera renewed Foundation Program · yesterday          │   │
│ └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Action Items (Smart Prompts)

| Condition | Prompt |
|-----------|--------|
| No programs created | "Set up your first program" |
| No pricing set | "Configure your program fees" |
| Pending messages > 0 | "Reply to N messages" |
| Students need feedback | "N students need progress feedback" |
| Profile incomplete | "Complete your public profile" |
| Pending verification | Redirect to pending page |

---

## Programs Page (`/app/teacher/programs`) — NEW

Replaces implicit "1-on-1 / group" pricing with explicit program management.

### Program List

```
┌─────────────────────────────────────────────────────────────┐
│ MY PROGRAMS                              [+ Create Program] │
│                                                             │
│ Foundation Program · Training Batch                         │
│ Mon/Wed 6 PM · 16/20 enrolled · Active                     │
│ [Manage] [View Enrollments] [Edit]                          │
│                                                             │
│ Personal Coaching · 1-on-1                                  │
│ Flexible · 8 active students · Always open                  │
│ [Manage] [View Enrollments] [Edit]                          │
│                                                             │
│ Competition Camp · Seasonal                                 │
│ Starts Aug 1 · 5/8 enrolled · Open                         │
│ [Manage] [View Enrollments] [Edit]                          │
└─────────────────────────────────────────────────────────────┘
```

### Create Program Flow

```
Step 1: Program Type
  ○ Foundation Program
  ○ Advanced Program
  ○ Training Batch
  ○ Personal Coaching
  ○ Competition Camp
  ○ Workshop
  ○ Masterclass

Step 2: Details
  Name, description, level, duration

Step 3: Schedule
  Days, times, start date, capacity

Step 4: Pricing
  Fee, billing period (per month / per session / total)

Step 5: Policies
  Cancellation, what's included

Step 6: Publish
  Draft → Open for enrollment
```

---

## Students Page (`/app/teacher/students`)

### Enhanced Student Roster

```
┌─────────────────────────────────────────────────────────────┐
│ MY STUDENTS · 24 active                    [Search...]      │
│                                                             │
│ Filter: [All Programs ▾] [All Status ▾]                    │
│                                                             │
│ Rahul Kumar · Competition Camp · Active · ★ Needs feedback│
│ Meera Shah · Foundation Program · Active · 92% attendance   │
│ Ananya Patel · Personal Coaching · Active · Next: Thu 7 PM  │
│ ...                                                         │
└─────────────────────────────────────────────────────────────┘
```

### Student Detail View

```
┌─────────────────────────────────────────────────────────────┐
│ Rahul Kumar · Competition Camp                              │
│                                                             │
│ Enrolled: Jun 1 · Expires: Aug 24 · Active                 │
│ Attendance: 18/20 sessions (90%)                            │
│                                                             │
│ [Message] [Mark Attendance] [Send Assignment] [Progress]   │
│                                                             │
│ RECENT ACTIVITY                                             │
│ · Attended Jun 28 session                                   │
│ · Completed backbend assignment                             │
│ · Registered for National Yoga 2026                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Schedule Page (`/app/teacher/schedule`)

Unchanged core functionality; enhanced with:
- Batch sessions shown as group blocks
- Personal coaching as individual slots
- Color-coded by program type
- "Create session" for workshops/masterclasses

---

## Classes Page (`/app/teacher/classes`)

Live session management — join, start, end sessions. Enhanced with:
- Batch name shown (not just student name for groups)
- Pre-class student list
- Post-class attendance auto-mark

---

## Promotions Page (`/app/teacher/promotions`)

Renamed from "Coupons." Enhanced UI:

```
┌─────────────────────────────────────────────────────────────┐
│ PROMOTIONS                               [+ Create Offer]   │
│                                                             │
│ SUMMER20 · 20% off Foundation Program                       │
│ Used: 3/10 · Expires Jul 31 · Active                       │
│ [Copy Code] [Send to Student] [Deactivate]                  │
│                                                             │
│ Create offer:                                               │
│ · Discount type (%, fixed)                                  │
│ · Applicable program                                        │
│ · Usage limit · Expiry                                      │
│ · Auto-generate code                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Earnings Page (`/app/teacher/earnings`)

Enhanced breakdown:

```
┌─────────────────────────────────────────────────────────────┐
│ EARNINGS                                                    │
│                                                             │
│ This Month: ₹42,000 · Last Month: ₹38,500                  │
│ Pending Payout: ₹12,000 · Next payout: Jul 5               │
│                                                             │
│ BY PROGRAM                                                  │
│ Foundation Program    ₹28,000  (16 enrollments)            │
│ Personal Coaching     ₹10,000  (8 sessions)                │
│ Competition Camp       ₹4,000  (2 enrollments)            │
│                                                             │
│ RECENT TRANSACTIONS                                         │
│ Jun 28 · Rahul · Competition Camp · ₹4,000                 │
│ Jun 27 · Meera · Foundation renewal · ₹4,999               │
└─────────────────────────────────────────────────────────────┘
```

---

## Competitions Page (`/app/teacher/competitions`)

Enhanced with coaching tools:

```
┌─────────────────────────────────────────────────────────────┐
│ COMPETITION COACHING                                        │
│                                                             │
│ National Yoga Championship 2026                             │
│ 5 students registered · Event: Aug 15                      │
│ [View Students] [Assign Practice] [Track Progress]          │
│                                                             │
│ STUDENTS                                                    │
│ Rahul · Senior · Registered · Prep: 75%                      │
│ Ananya · Junior · Registered · Prep: 60%                    │
│ [Assign practice plan] [Send feedback]                      │
└─────────────────────────────────────────────────────────────┘
```

---

## Settings Page (`/app/teacher/settings`)

Reorganized tabs:

| Tab | Content |
|-----|---------|
| Profile | Photo, bio, specializations, certifications |
| Public Profile | Cover, gallery, FAQs, policies (feeds 04 spec) |
| Availability | Calendar, blocked dates |
| Notifications | Email, in-app preferences |
| Payout | Razorpay linked account |
| Account | Email, password, delete |

**Pricing moved to Programs** — no longer a separate settings tab.

---

## Onboarding Checklist (New Teachers)

Shown on overview until complete:

```
Getting Started
☑ Create your account
☐ Complete your profile
☐ Add certifications & achievements
☐ Create your first program
☐ Set your availability
☐ Publish your public profile
☐ Get your first enrollment
```

---

## Workspace Switcher Rules

| Workspace | Visible when |
|-----------|--------------|
| Teacher | Always (verified) |
| Academy | Member of ≥1 academy |
| Organizer | Assigned to ≥1 competition |
| Judge | Assigned to ≥1 competition |

**No empty workspace tabs.** If not assigned, option hidden.

---

## Terminology in Teacher Dashboard

| Old | New |
|-----|-----|
| Students | Students (unchanged) |
| Coupons | Promotions |
| Buy Class notifications | New Enrollment notifications |
| 1-on-1 / Group | Personal Coaching / Training Batch |
| Pricing (settings) | Programs |
| Bookings | Enrollments |

---

*See 04_TEACHER_PROFILE_SPEC.md for public-facing profile fed by settings*
