# Teacher Profile Specification — Premium Coach Page

**Sprint 8 · Phase 3**  
**Date:** June 30, 2026  
**Goal:** Make the coach profile one of the strongest pages on Yogstra

---

## Design Principles

1. **Premium first impression** — Hero section sets professional tone
2. **Action-oriented** — Every section drives toward enrollment or trial
3. **Trust-building** — Achievements, reviews, certifications prominently displayed
4. **Complete picture** — Student should not need to leave page to decide
5. **Mobile-optimized** — Sticky CTA bar on mobile

---

## Page Structure

### 1. Hero Section

```
┌─────────────────────────────────────────────────────────────┐
│  [Cover photo — yoga studio, practice, or branded gradient] │
│                                                             │
│     ┌──────┐                                                │
│     │Photo │  Priya Sharma                                  │
│     │      │  Certified Iyengar Yoga Instructor             │
│     └──────┘  ★★★★★ 4.9 (127 reviews) · 340+ students      │
│                                                             │
│     [Book Trial Class]  [Enroll in Program]  [Message]      │
│                                                             │
│     📍 Mumbai · 🕐 Weekday evenings · 💬 Responds in 2h    │
└─────────────────────────────────────────────────────────────┘
```

**Data sources:**
- Photo, name, tagline: `teacher_profiles`
- Rating: computed from reviews
- Student count: count of active enrollments
- Location, availability: `teacher_profiles` + schedule
- Response time: computed from chat history

**Mobile:** Sticky bottom bar with [Book Trial] [Enroll] [Message]

---

### 2. About Section

| Element | Content |
|---------|---------|
| Bio | Rich text introduction (2–3 paragraphs) |
| Specializations | Tags: Iyengar, Backbends, Pranayama, Competition Prep |
| Experience | "12 years teaching · 8 years competition coaching" |
| Languages | English, Hindi, Sanskrit |
| Teaching style | Short paragraph on approach |

**CTA:** "Want to learn more? Message Priya →"

---

### 3. Programs & Batches

Tabbed or accordion list of active offerings:

```
┌─────────────────────────────────────────────────────────────┐
│ PROGRAMS & BATCHES                                          │
│                                                             │
│ ┌─ Foundation Program ──────────────────────────────────┐  │
│ │  8-week beginner batch · Mon/Wed 6 PM               │  │
│ │  ₹4,999/month · 8 seats left · Starts Jul 15        │  │
│ │                              [View Details] [Enroll] │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Personal Coaching ───────────────────────────────────┐  │
│ │  1-on-1 sessions · Flexible schedule                  │  │
│ │  ₹1,500/session · Available this week                 │  │
│ │                              [View Details] [Enroll] │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                             │
│ ┌─ Competition Camp ────────────────────────────────────┐  │
│ │  National Yoga Championship prep · 12 weeks           │  │
│ │  ₹8,999 · 3 seats left · Starts Aug 1               │  │
│ │                              [View Details] [Enroll] │  │
│ └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

Each program card links to enrollment funnel (05_STUDENT_ENROLLMENT_FLOW).

---

### 4. Achievements & Credentials

```
┌─────────────────────────────────────────────────────────────┐
│ ACHIEVEMENTS                                                │
│                                                             │
│ 🏆 National Yoga Championship — Gold (2024)                │
│ 🏆 State Level — Silver (2023)                             │
│ 📜 Certified Iyengar Yoga Teacher (RIMYI Pune)             │
│ 📜 500-hour YTT (Kaivalyadhama)                            │
│ 👥 340+ students trained                                    │
│ 🏫 Affiliated: Shanti Yoga Academy, Yoga Institute Mumbai    │
└─────────────────────────────────────────────────────────────┘
```

**Data sources:**
- Competition wins: `competition_results` + `certificates`
- Certifications: `teacher_profiles.certifications` (JSON or related table)
- Students trained: count of enrollments
- Academies: `teacher_academies`

---

### 5. Schedule Preview

Mini calendar showing next 7 days of available/open sessions:

```
┌─────────────────────────────────────────────────────────────┐
│ UPCOMING SESSIONS                                           │
│                                                             │
│ Mon 30  Foundation Batch · 6:00 PM · 8 seats              │
│ Wed 02  Foundation Batch · 6:00 PM · 8 seats              │
│ Thu 03  Personal Coaching · Available slots                 │
│ Sat 05  Workshop: Backbend Intensive · 10:00 AM             │
│                                                             │
│                              [View Full Schedule →]         │
└─────────────────────────────────────────────────────────────┘
```

---

### 6. Gallery & Videos

```
┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐
│ Photo  │ │ Photo  │ │ Video  │ │ Photo  │
│        │ │        │ │ ▶      │ │        │
└────────┘ └────────┘ └────────┘ └────────┘
```

- Photos: Supabase storage, teacher-uploaded
- Videos: YouTube/Vimeo embed or Supabase storage
- Lightbox on click

---

### 7. Student Reviews

```
┌─────────────────────────────────────────────────────────────┐
│ REVIEWS · 4.9 average (127)                                 │
│                                                             │
│ ★★★★★  "Priya transformed my practice..." — Ananya, 2 mo   │
│ ★★★★★  "Best competition coach I've had..." — Rahul, 6 mo  │
│ ★★★★☆  "Great foundation program..." — Meera, 1 mo         │
│                                                             │
│                              [Read all 127 reviews →]       │
└─────────────────────────────────────────────────────────────┘
```

**Only shown:** Reviews from verified enrolled students.

---

### 8. FAQs & Policies

Accordion:

- What should I bring to my first class?
- What is your cancellation policy?
- Can I switch batches?
- Do you offer refunds?
- How do competition camps work?

**Data source:** `teacher_profiles.faqs` (JSON array) + `teacher_profiles.policies`

---

### 9. Contact & Chat

```
┌─────────────────────────────────────────────────────────────┐
│ GET IN TOUCH                                                │
│                                                             │
│ Have questions before enrolling?                            │
│                                                             │
│ [Send Message]  [Book Trial Class]  [Enroll Now]           │
│                                                             │
│ Typically responds within 2 hours                           │
└─────────────────────────────────────────────────────────────┘
```

Message opens chat thread (creates if none exists).

---

## Section Order (Desktop)

1. Hero
2. About
3. Programs & Batches
4. Achievements
5. Schedule Preview
6. Gallery & Videos
7. Reviews
8. FAQs & Policies
9. Contact

## Section Order (Mobile)

Same order; sticky CTA bar always visible at bottom.

---

## SEO & Sharing

| Meta | Source |
|------|--------|
| Title | `{name} — Yoga Coach on Yogstra` |
| Description | First 160 chars of bio |
| OG Image | Profile photo or cover |
| URL | `/coach/{slug}` |

---

## Empty States

| Missing data | Display |
|--------------|---------|
| No programs | "Programs coming soon — Message to inquire" |
| No reviews | Hidden section |
| No gallery | Hidden section |
| No schedule | "Contact for availability" |
| Pending teacher | Profile not public until verified |

---

## Comparison with Current Implementation

| Feature | Current (V1) | Target (V2) |
|---------|--------------|-------------|
| Layout | 5 tabs | Single scroll page |
| CTA | "Buy Online Class" | Book Trial / Enroll / Message |
| Programs | Pricing tab only | Dedicated section with batches |
| Achievements | Tab | Prominent section |
| Gallery | ✗ | ✓ |
| Videos | ✗ | ✓ |
| Schedule preview | ✗ | ✓ |
| FAQs | ✗ | ✓ |
| Academies | ✗ | ✓ |
| Mobile sticky CTA | ✗ | ✓ |

---

## Implementation Notes

- Reuse existing `teacher_profiles`, `teacher_academies`, reviews data
- New: `teacher_programs` table or extend batches to teacher-owned programs
- New: gallery/media storage bucket
- New: FAQs JSON field on teacher_profiles
- Slug generation from name for SEO URLs

---

*Enrollment from this page flows to 05_STUDENT_ENROLLMENT_FLOW.md*
