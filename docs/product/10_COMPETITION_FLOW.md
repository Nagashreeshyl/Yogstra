# Competition Flow — Yogstra V2

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Goal:** One seamless competition journey across all roles

---

## Competition Ecosystem

```
Organizer creates competition
      ↓
Students register (with coach/academy context)
      ↓
Teachers coach preparation
      ↓
Judges score performances
      ↓
Results published → Certificates issued
```

**V1 strength:** Registration wizard, judge session, certificates — keep and extend.  
**V1 gaps:** No entry fee payment, no coach prep tools, no academy team entries, no role gating.

---

## Role Journeys

### Student

```
Discover competition (public, dashboard, coach, academy)
      ↓
View competition detail (events, categories, dates, fees)
      ↓
Start registration wizard
      ↓
Step 1: Select event
Step 2: Select category & division
Step 3: Participant details
Step 4: Coach/academy affiliation (optional)
Step 5: Entry fee payment (NEW)
Step 6: Confirmation
      ↓
Preparation phase (coach assignments, practice plans)
      ↓
Competition day (check-in, perform)
      ↓
View results & download certificate
```

### Teacher (Coach)

```
Student registers with coach affiliation
      ↓
Coach sees registration in Competition Coaching dashboard
      ↓
Assign preparation plan (asanas, routines, timeline)
      ↓
Track student readiness (% complete)
      ↓
Send feedback and adjustments
      ↓
Competition day: view student performance
      ↓
View results, celebrate achievements
```

### Academy

```
Browse competitions
      ↓
Register academy team (batch entry)
      ↓
Assign students to categories
      ↓
Track all academy participants' preparation
      ↓
View team results and certificates
```

### Organizer

```
Request organizer access (NEW — not teacher register)
      ↓
Admin grants access
      ↓
Create competition (7-step wizard — existing)
      ↓
Configure events, categories, divisions, fees
      ↓
Assign judges (email invitation)
      ↓
Publish → registration opens
      ↓
Monitor registrations & payments
      ↓
Event day: manage check-in, announcements
      ↓
Judges submit scores
      ↓
Review & publish results
      ↓
Certificates auto-generated
```

### Judge

```
Receive assignment notification (email + in-app)
      ↓
Review competition brief & scoring criteria
      ↓
Session reminder (30 min before)
      ↓
Enter judge session
      ↓
Score participants (structured UI — existing)
      ↓
Submit scores
      ↓
Review published results
```

---

## Registration Wizard (Enhanced)

### Current Steps (Keep)

1. Select competition
2. Select event
3. Select category
4. Select division
5. Participant details
6. Review & confirm
7. Confirmation

### New Steps

**Step 4.5: Affiliation (NEW)**

```
┌─────────────────────────────────────────────────────────────┐
│ AFFILIATION (Optional)                                      │
│                                                             │
│ Coach: [Priya Sharma ▾] (your enrolled coaches)            │
│ Academy: [Shanti Yoga Academy ▾] (your academies)          │
│                                                             │
│ Affiliation helps your coach track your preparation.        │
└─────────────────────────────────────────────────────────────┘
```

**Step 6.5: Entry Fee (NEW)**

```
┌─────────────────────────────────────────────────────────────┐
│ ENTRY FEE                                                   │
│                                                             │
│ State Level Championship · Senior Division                  │
│ Entry fee: ₹500                                             │
│                                                             │
│ Coupon: [          ] [Apply]                                │
│                                                             │
│ [Proceed to Pay →]                                          │
└─────────────────────────────────────────────────────────────┘
```

On payment success → registration status = `confirmed`.

---

## Preparation Phase (NEW)

### Coach View

```
┌─────────────────────────────────────────────────────────────┐
│ COMPETITION PREP · Rahul · State Level · Senior            │
│ Event: Aug 15 · 46 days remaining                           │
│                                                             │
│ READINESS: ████████░░ 75%                                   │
│                                                             │
│ ASSIGNED PRACTICE                                           │
│ ☑ Surya Namaskar (daily)                                   │
│ ☑ Padmasana hold 60s                                       │
│ ☐ Backbend sequence                                         │
│ ☐ Competition routine (full)                                │
│                                                             │
│ [Assign Practice] [Send Feedback] [View Registration]       │
└─────────────────────────────────────────────────────────────┘
```

### Student View

```
┌─────────────────────────────────────────────────────────────┐
│ COMPETITION PREP · State Level · Aug 15                     │
│ Coach: Priya Sharma · Readiness: 75%                        │
│                                                             │
│ TODAY'S COMPETITION PRACTICE                                  │
│ ☐ Backbend sequence · 30 min                               │
│ ☐ Competition routine run-through                           │
│                                                             │
│ [Mark Complete] [Message Coach]                             │
└─────────────────────────────────────────────────────────────┘
```

---

## Academy Team Entry (NEW)

```
Academy → Competitions → Register Team
      ↓
Select competition + event
      ↓
Select batch (e.g., "Competition Prep Batch")
      ↓
Assign students to categories/divisions
      ↓
Bulk registration (entry fees per student)
      ↓
Track team preparation
      ↓
Team results view
```

---

## Organizer Dashboard (Enhanced)

### Access Control (NEW)

- Route guard: only users with `competition_organizers` assignment
- Get Started → "Organize Competitions" → `/auth/organizer` (request form)
- Admin approves → organizer workspace unlocked

### Create Competition (Existing — Keep)

7-step wizard remains; add:
- Entry fee configuration per category/division
- Academy team entry toggle
- Coach affiliation requirement toggle

### Live Event Management

```
┌─────────────────────────────────────────────────────────────┐
│ State Level Championship · LIVE · Aug 15                    │
│                                                             │
│ Registrations: 142 confirmed · 8 pending payment          │
│ Check-in: 98/142                                            │
│                                                             │
│ [Send Announcement] [View Registrations] [Check-in QR]     │
│                                                             │
│ JUDGE SESSIONS                                              │
│ Senior Division · Judge: Meera · In Progress               │
│ Junior Division · Judge: Amit · Waiting                     │
│                                                             │
│ [Publish Results] (when all scores submitted)               │
└─────────────────────────────────────────────────────────────┘
```

---

## Judge Session (Existing — Keep + Enhance)

Keep current scoring UI. Add:

- Push notification 30 min before session
- One-click entry from notification
- Competition brief accessible in session
- Score confirmation before submit

### Access Control (NEW)

- Route guard: only assigned judges
- No empty judge workspace for unassigned teachers

---

## Results & Certificates (Existing — Keep)

Current flow works well:
- Organizer publishes results
- Rankings computed
- Certificates generated with verification URL
- Student downloads from dashboard

Enhance:
- Coach notified of student results
- Academy team results aggregated
- Social sharing (future)

---

## Competition Discovery

### Public

- `/discover/competitions` — filterable list
- `/competition/:slug` — detail page with registration CTA

### In-App

- Student dashboard widget
- Coach dashboard (students' registrations)
- Academy dashboard (team entries)
- Explore page teaser

---

## Data Model Extensions

```sql
-- Entry fee on competition categories
ALTER TABLE competition_categories ADD COLUMN entry_fee numeric DEFAULT 0;

-- Registration payment
ALTER TABLE competition_registrations ADD COLUMN payment_order_id text;
ALTER TABLE competition_registrations ADD COLUMN payment_status text;

-- Coach affiliation
ALTER TABLE competition_registrations ADD COLUMN coach_id uuid REFERENCES profiles;
ALTER TABLE competition_registrations ADD COLUMN academy_id uuid REFERENCES academies;

-- Preparation plans (new)
competition_prep_plans (
  id uuid PK,
  registration_id uuid FK,
  coach_id uuid FK,
  items jsonb, -- [{name, completed, due_date}]
  readiness_percent numeric,
  created_at timestamptz
);

-- Organizer access requests (new)
organizer_access_requests (
  id uuid PK,
  user_id uuid FK,
  organization_name text,
  status text, -- pending, approved, rejected
  created_at timestamptz
);
```

---

## Integration Points

| From | To | Link |
|------|-----|------|
| Student enrollment | Competition registration | Coach pre-filled |
| Academy batch | Team entry | Batch students bulk-registered |
| Coach prep plan | Student dashboard | Today's competition practice |
| Competition results | Coach dashboard | Student achievement notification |
| Competition results | Teacher profile | Achievements section |
| Certificate | Student progress | Achievements page |

---

## Priority

| Priority | Feature | Effort |
|----------|---------|--------|
| P0 | Role gating (organizer/judge) | Low |
| P1 | Entry fee payment | Medium |
| P1 | Coach affiliation in wizard | Low |
| P1 | Coach prep tools | High |
| P2 | Academy team entry | High |
| P2 | Organizer request flow | Medium |
| P2 | Judge notifications | Low |

---

*Strongest existing module — extend, don't rebuild*
