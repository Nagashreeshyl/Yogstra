# Student Dashboard Flow

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Core question:** "What do I do today?"

---

## Dashboard Philosophy

The student dashboard is a **daily command center** — not a generic home page. Every element answers: What should I do right now? What's coming up? How am I progressing?

---

## Today Page (`/app/student`) — Renamed from "Home"

### Priority Layout (Top → Bottom)

```
┌─────────────────────────────────────────────────────────────┐
│ Good morning, Ananya · Monday, June 30                        │
│ 🔥 12-day practice streak                                   │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ TODAY'S SCHEDULE                                            │
│ ═══════════════════════════════════════════════════════════ │
│                                                             │
│ ┌─ NEXT CLASS ──────────────────────────────────────────┐  │
│ │ 🧘 Foundation Batch · 6:00 PM · in 4 hours            │  │
│ │ Coach: Priya Sharma                                    │  │
│ │                              [Join Class] [Details]    │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ TODAY'S PRACTICE ─────────────────────────────────────┐  │
│ │ Hold each asana for 30 seconds · 20 min                 │  │
│ │ Assigned by Priya · Due today                           │  │
│ │                                    [Start Practice]     │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ COACH MESSAGE ────────────────────────────────────────┐  │
│ │ "Great progress on backbends! Focus on..." — Priya      │  │
│ │                                          [Reply]        │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ COMING UP                                                   │
│ ═══════════════════════════════════════════════════════════ │
│                                                             │
│ Wed Jul 2 · Foundation Batch · 6 PM                        │
│ Sat Jul 5 · Competition: State Level · 9 AM                 │
│ Mon Jul 7 · Foundation Batch · 6 PM                        │
│                                    [View Full Schedule →]   │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ YOUR PROGRESS                                               │
│ ═══════════════════════════════════════════════════════════ │
│                                                             │
│ Attendance: 18/20 (90%)  │  Assignments: 8/10 done        │
│ [View Progress →]                                           │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ COMPETITIONS                                                │
│ ═══════════════════════════════════════════════════════════ │
│                                                             │
│ State Level Championship · Registered · Aug 15             │
│ Prep progress: ████████░░ 75%                              │
│                                    [View Preparation →]     │
│                                                             │
│ ═══════════════════════════════════════════════════════════ │
│ ENROLLMENT                                                  │
│ ═══════════════════════════════════════════════════════════ │
│                                                             │
│ Foundation Program · Renews in 12 days                      │
│                                    [Renew Now]              │
└─────────────────────────────────────────────────────────────┘
```

---

## Section Specifications

### 1. Today's Schedule

**Data sources:**
- Next class: `schedules` where date = today, student enrolled
- Join button: active 15 min before start → links to LiveKit

**Empty state:** "No class today. Next class: Wed 6 PM"

### 2. Today's Practice

**Data source:** Teacher-assigned practice routines (new feature)

**Empty state:** Hidden if no assignment

### 3. Coach Message

**Data source:** Latest unread/pinned message from coach in chat

**Empty state:** Hidden if no recent message

### 4. Coming Up

Next 3–5 events: classes + competitions

### 5. Your Progress

Summary widgets linking to full Progress page

### 6. Competitions

Active registrations with prep progress (if coach assigned plan)

### 7. Enrollment Status

Renewal banner when `renewal_due`

---

## New Student (Post-Enrollment Welcome)

First login after enrollment shows welcome overlay:

```
┌─────────────────────────────────────────────────────────────┐
│ Welcome to Foundation Program! 🎉                           │
│                                                             │
│ Coach Priya Sharma will reach out soon.                     │
│ Your first class: Mon Jul 15 at 6 PM                       │
│                                                             │
│ GETTING STARTED                                             │
│ ☐ Add first class to calendar                              │
│ ☐ Say hello to your coach                                  │
│ ☐ Review practice guidelines                               │
│ ☐ Complete your profile                                    │
│                                                             │
│                              [Go to Dashboard]              │
└─────────────────────────────────────────────────────────────┘
```

Dismissible; checklist persists until complete.

---

## My Programs Page (`/app/student/programs`)

Renamed from "Classes" / "Training"

```
┌─────────────────────────────────────────────────────────────┐
│ MY PROGRAMS                                                 │
│                                                             │
│ ┌─ Foundation Program ──────────────────────────────────┐  │
│ │ Coach: Priya Sharma · Active · Renews Jul 12        │  │
│ │ Mon/Wed 6 PM · 18/20 sessions attended              │  │
│ │ [View Schedule] [Message Coach] [Renew]              │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Personal Coaching ───────────────────────────────────┐  │
│ │ Coach: Priya Sharma · Active                          │  │
│ │ Next session: Thu Jul 3 · 7 PM                        │  │
│ │ [View Schedule] [Message Coach]                       │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ [Discover More Programs →]                                │
└─────────────────────────────────────────────────────────────┘
```

---

## Schedule Page (`/app/student/schedule`)

Calendar view of all enrolled program sessions:

- Color-coded by program
- Click session → details + join link (if live)
- Add to device calendar export

---

## Progress Page (`/app/student/progress`) — NEW

```
┌─────────────────────────────────────────────────────────────┐
│ MY PROGRESS                                                 │
│                                                             │
│ ATTENDANCE                                                  │
│ Foundation Program: 18/20 (90%)                             │
│ ████████████████████░░                                      │
│                                                             │
│ ASSIGNMENTS                                                 │
│ 8 of 10 completed                                           │
│                                                             │
│ ACHIEVEMENTS                                                │
│ 🏅 12-day streak                                            │
│ 🏅 First month complete                                     │
│ 🏅 Competition registered                                   │
│                                                             │
│ CERTIFICATES                                                │
│ [View all certificates →]                                   │
└─────────────────────────────────────────────────────────────┘
```

---

## Enrollments Page (`/app/student/enrollments`)

Renamed from "Shop (Soon)"

Payment history + active enrollments:

| Program | Period | Amount | Status | Receipt |
|---------|--------|--------|--------|---------|
| Foundation Program | Jun 1 – Jul 12 | ₹4,100 | Active | ↓ |
| Trial Class | May 28 | Free | Completed | — |

---

## Discover Page (`/app/student/discover`)

In-app discovery (same as public Discover but with enrollment CTAs):

- Recommended coaches based on current programs
- Academies near student
- Open programs accepting enrollment
- Upcoming competitions

---

## Mobile Navigation

Bottom tab bar (existing Sprint 6.1 pattern):

| Tab | Page |
|-----|------|
| Today | Daily dashboard |
| Programs | My Programs |
| Schedule | Calendar |
| Messages | Chat |
| More | Competitions, Discover, Progress, Enrollments, Settings |

**Key fix:** Tab label stays "Programs" always — no silent rename from "Training" to "Classes"

---

## Empty States by Student Lifecycle

| State | Dashboard shows |
|-------|-----------------|
| New signup, no enrollment | Discover coaches CTA, getting started guide |
| Trial booked | Trial details + "Enroll in full program" after |
| Active enrollment | Full Today view |
| Renewal due | Prominent renewal banner |
| Lapsed | "Welcome back" + re-enroll CTA |
| Competition only | Competition-focused dashboard |

---

## Notifications (Unified — Future)

Single notification center accessible from header:

- Class starting in 30 min
- New assignment from coach
- Coach message
- Competition update
- Renewal reminder
- Enrollment confirmed

---

*See 05_STUDENT_ENROLLMENT_FLOW.md for how students arrive here, 06_PAYMENT_FLOW.md for renewal*
