# Academy Flow — Yogstra V2

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Vision:** Academies run professional training institutions on Yogstra

---

## Academy Lifecycle

```
Create Academy
      ↓
Invite Teachers (with roles)
      ↓
Create Programs & Batches
      ↓
Publish Public Profile
      ↓
Accept Student Enrollments
      ↓
Run Operations (schedule, attendance, finance)
      ↓
Participate in Competitions
```

---

## Phase 1: Academy Onboarding

### Entry Point (NEW)

Get Started → "Manage an Academy" → `/auth/academy`

**Not** student signup. Dedicated flow:

```
Step 1: Account
  Name, email, password (or login if existing)

Step 2: Academy Details
  Academy name, location, description, logo

Step 3: Your Role
  "You will be the Academy Owner"

Step 4: Confirm
  → Create academy record
  → Add user as owner in academy_members
  → Redirect to Academy dashboard
```

### First-Time Dashboard

```
┌─────────────────────────────────────────────────────────────┐
│ Welcome to Shanti Yoga Academy!                             │
│                                                             │
│ GETTING STARTED                                             │
│ ☐ Invite your first teacher                                │
│ ☐ Create your first program                                │
│ ☐ Set up your public profile                               │
│ ☐ Open enrollment for students                             │
│                                                             │
│ Quick Actions:                                              │
│ [Invite Teacher] [Create Program] [Edit Profile]           │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 2: Team Management

### Invite Teachers

```
┌─────────────────────────────────────────────────────────────┐
│ INVITE TEACHER                                              │
│                                                             │
│ Email: [teacher@email.com        ]                          │
│ Role:  [Teacher ▾]                                          │
│        Owner / Manager / Teacher / Assistant / Receptionist │
│                                                             │
│ [Send Invitation]                                           │
└─────────────────────────────────────────────────────────────┘
```

**Improvements over V1:**
- Email-based (not UUID)
- Send invitation email to non-users (signup link)
- Role selection at invite time
- Pending invitations list

### Member Roles & Permissions

| Role | Programs | Students | Teachers | Finance | Settings |
|------|----------|----------|----------|---------|----------|
| Owner | ✓ | ✓ | ✓ | ✓ | ✓ |
| Manager | ✓ | ✓ | ✓ | ✓ | ✓ |
| Teacher | ✓ | ✓ | — | — | — |
| Assistant | View | ✓ | — | — | — |
| Receptionist | — | ✓ | — | — | — |
| Finance Manager | — | — | — | ✓ | — |

**Navigation hides unauthorized sections** (not just RLS block).

---

## Phase 3: Programs & Batches

### Create Program

```
Step 1: Program Details
  Name: "Foundation Yoga Program"
  Type: Foundation Program
  Description, level, duration

Step 2: Batch Setup
  Batch name: "Weekday Morning"
  Schedule: Mon/Wed/Fri 7 AM
  Capacity: 20
  Assigned teacher: [Select from academy teachers ▾]
  Start date, end date

Step 3: Pricing
  Fee: ₹5,999/month
  Billing: Monthly

Step 4: Publish
  Status: Draft → Open for enrollment
```

### Batch Management

```
┌─────────────────────────────────────────────────────────────┐
│ PROGRAMS & BATCHES                         [+ Create]       │
│                                                             │
│ Foundation Yoga Program                                     │
│ ├── Weekday Morning · Mon/Wed/Fri 7 AM · 14/20 · Active   │
│ │   Teacher: Priya · Starts Jul 1                          │
│ │   [Manage] [Enroll Student] [View Roster]               │
│ └── Weekend Batch · Sat/Sun 8 AM · 8/15 · Open            │
│     Teacher: Amit · Starts Jul 15                           │
│     [Manage] [Enroll Student] [View Roster]                 │
│                                                             │
│ Advanced Program · No batches yet · [Create Batch]         │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 4: Student Enrollment

### Staff-Initiated Enrollment (Academy Dashboard)

```
┌─────────────────────────────────────────────────────────────┐
│ ENROLL STUDENT                                              │
│                                                             │
│ Search: [rahul@email.com / Rahul Kumar    ] 🔍             │
│ → Found: Rahul Kumar (student@yogstra.com)                 │
│                                                             │
│ Program: [Foundation Yoga Program ▾]                        │
│ Batch:   [Weekday Morning ▾]                               │
│                                                             │
│ Payment: ○ Collect now  ○ Invoice later  ○ Already paid    │
│                                                             │
│ [Enroll Student]                                            │
└─────────────────────────────────────────────────────────────┘
```

**No UUIDs.** Search by name or email.

### Student-Initiated Enrollment (Public Profile)

```
Academy public profile → "Request Enrollment"
      ↓
Student selects program + batch
      ↓
Request submitted (status: pending)
      ↓
Academy staff sees in dashboard → Approve / Decline
      ↓
If approved → student receives payment link or auto-enrolled
```

### Enrollment Requests Queue

```
┌─────────────────────────────────────────────────────────────┐
│ PENDING ENROLLMENT REQUESTS · 3                             │
│                                                             │
│ Rahul Kumar · Foundation · Weekday · 2 hours ago           │
│ [Approve] [Decline] [Message]                               │
│                                                             │
│ Meera Shah · Advanced · Weekend · 1 day ago                │
│ [Approve] [Decline] [Message]                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 5: Operations

### Schedule (Batch-Native Timetable)

```
┌─────────────────────────────────────────────────────────────┐
│ SCHEDULE · Week of Jun 30                                   │
│                                                             │
│       Mon    Tue    Wed    Thu    Fri    Sat    Sun        │
│ 7 AM  FDN    —      FDN    —      FDN    ADV    ADV       │
│       Priya         Priya         Priya  Amit   Amit       │
│ 6 PM  —      ADV    —      ADV    —      —      —          │
│             Amit          Amit                              │
│                                                             │
│ FDN = Foundation Batch · ADV = Advanced Batch              │
│ Click session → attendance, notes, cancel                     │
└─────────────────────────────────────────────────────────────┘
```

**Uses `schedules.batch_id`** — batch-native, not individual teacher bookings.

### Attendance

```
┌─────────────────────────────────────────────────────────────┐
│ ATTENDANCE · Foundation Batch · Mon Jun 30 · 7 AM          │
│                                                             │
│ ☑ Rahul Kumar    ☑ Meera Shah    ☐ Ananya Patel           │
│ ☑ Vikram Singh   ☑ Priya Desai   ☑ Arjun Mehta            │
│ ... (14 present / 16 enrolled)                              │
│                                                             │
│ [Save Attendance]                                           │
│                                                             │
│ Auto-marked from live session: 12                          │
│ Manual override: 2                                          │
└─────────────────────────────────────────────────────────────┘
```

**Hybrid:** LiveKit session start auto-marks + manual roll call override.

---

## Phase 6: Public Academy Profile

### Structure

```
Hero (logo, name, location, "Request Enrollment")
├── About (mission, facilities, history)
├── Programs & Batches (open enrollment with seats)
├── Our Coaches (linked profiles)
├── Schedule (public timetable)
├── Gallery
├── Reviews
├── Competitions (participation history)
└── Contact (location, phone, email)
```

### Discovery

- Listed on `/discover/academies`
- Filterable by location, programs, rating
- Compare with other academies (future)

---

## Phase 7: Finance

```
┌─────────────────────────────────────────────────────────────┐
│ FINANCE · June 2026                                         │
│                                                             │
│ Total Revenue: ₹1,24,000                                    │
│ Academy Share: ₹24,800 (20%)                                │
│ Teacher Payouts: ₹99,200                                    │
│                                                             │
│ BY PROGRAM                                                  │
│ Foundation · ₹80,000 · 16 enrollments                      │
│ Advanced · ₹44,000 · 8 enrollments                          │
│                                                             │
│ BY TEACHER                                                  │
│ Priya Sharma · ₹72,000 · 20 sessions                         │
│ Amit Kumar · ₹52,000 · 16 sessions                           │
│                                                             │
│ [Export Report] [View Transactions]                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 8: Competition Participation

```
Academy dashboard → Competitions
      ↓
Browse upcoming competitions
      ↓
Register academy batch as team entry
      ↓
Assign students to competition categories
      ↓
Track preparation across academy
      ↓
View results and certificates
```

---

## Academy Switcher (NEW)

For users in multiple academies:

```
Header: [Shanti Yoga Academy ▾]
  → Shanti Yoga Academy (current)
  → Yoga Institute Mumbai
  → + Create New Academy
```

Stored in context; replaces localStorage-only auto-select.

---

## Student Experience (Academy-Enrolled)

Students enrolled via academy see:

- Academy name on dashboard
- Academy programs in "My Programs"
- Academy announcements (future)
- Batchmates view (future)

---

## Migration from V1

| V1 | V2 |
|----|-----|
| UUID student enrollment | Name/email search |
| UUID teacher invite | Email invitation |
| Get Started → student auth | Dedicated academy onboarding |
| All nav visible | Role-aware navigation |
| Teacher booking schedule as timetable | Batch-native schedule |
| Live session proxy attendance | Hybrid attendance |
| No public enrollment | Request enrollment flow |
| No academy switcher | Header dropdown |

---

*See 02_INFORMATION_ARCHITECTURE.md for nav structure, 09 referenced in competition flow*
