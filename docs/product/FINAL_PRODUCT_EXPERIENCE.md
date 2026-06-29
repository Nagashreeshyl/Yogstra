# Final Product Experience — Yogstra MVP

**Sprint 9 · Product Experience Finalization**  
**Date:** June 30, 2026  
**Status:** Implemented specification

---

## Product Positioning

> **Yogstra is the Operating System for Yoga Academies, Teachers, Students and Competitions.**

Not a marketplace. Not teacher SaaS. Not a subscription website. A premium training platform.

Every visitor should answer: **What is Yogstra? Why use it? What do I do next?**

---

## Final User Journey

```
Visit Landing → Understand platform → Choose path (Get Started)
      ↓
┌─────────────┬─────────────┬─────────────┬─────────────┐
│ Learn Yoga  │ Become Coach│ Run Academy │ Host Comps  │
│  (Student)  │  (Teacher)  │  (Academy)  │ (Organizer) │
└──────┬──────┴──────┬──────┴──────┬──────┴──────┬──────┘
       ↓             ↓             ↓             ↓
   Discover      Apply &       Register      Register
   Enroll        Teach         Academy       Organizer
       ↓             ↓             ↓             ↓
   Dashboard     Dashboard     Dashboard     Dashboard
```

---

## Final Navigation

### Public Header
Logo · Discover · Teachers · Academies · Competitions · Community · About · Help Center · Login · Get Started

### Public Footer (pinned)
Logo + mission · Discover · Teachers · Academies · Competitions · Community · About · Help · Privacy · Terms · Refund · Copyright

### Removed from Navigation
Pricing · Contact · Enterprise · Newsletter · Resources dropdown · Shop (public)

---

## Final Public Pages

| Page | Route | Purpose |
|------|-------|---------|
| Landing | `/` | Hero, platform overview, showcases, FAQ, CTA |
| Discover | `/discover` | Entry point — coaches, academies, programs, competitions |
| Teachers | `/teachers` | Coach directory with premium cards |
| Academies | `/academies` | Academy directory |
| Academy Profile | `/academies/:slug` | Public academy page |
| Coach Profile | `/teachers/:id` | Premium scroll profile |
| Competitions | `/competitions` | Discover, upcoming, live, completed |
| Community | `/community` | Instagram-like feed |
| About | `/about` | Mission and story |
| Help Center | `/help` | FAQ and support |
| How Yogstra Works | `/how-it-works` | Replaces pricing — explains roles + commission model |
| Legal | `/privacy-policy`, `/terms-of-service`, `/refund-policy` | Required legal |

### Pages Removed
- `/pricing` → redirects to `/how-it-works`
- `/contact` → removed
- Newsletter forms → removed
- Enterprise tier → removed
- OAuth placeholders → removed

---

## Final Authentication Flow

### Login (`/auth/login`)
- Email + Password + Remember Me + Forgot Password
- **No OAuth buttons**
- Auto-redirect by account type:
  - Student → Student Dashboard
  - Teacher → Teacher Dashboard
  - Academy Owner → Academy Dashboard
  - Organizer → Organizer Dashboard
  - Judge → Judge Dashboard
  - Admin → Admin Dashboard
- Workspace picker only when account has multiple workspaces

### Get Started (`/auth/get-started`)
- **Not login** — onboarding journey picker
- 4 premium cards with Lucide icons (no emojis):
  1. Learn Yoga → `/auth/student`
  2. Become a Coach → `/auth/teacher/register`
  3. Run a Yoga Academy → `/auth/academy`
  4. Host Yoga Competitions → `/auth/organizer`

---

## Final Signup Flows

| Role | Route | Fields | Outcome |
|------|-------|--------|---------|
| Student | `/auth/student` | Name, email, password, phone, location, experience, goals, agreement | Welcome → dashboard |
| Coach | `/auth/teacher/register` | Name, email, password, phone, experience, styles, languages, location, bio, photo | Application submitted |
| Academy | `/auth/academy` | Owner, email, password, academy name, location, phone, description, logo | Create academy → dashboard |
| Organizer | `/auth/organizer` | Organization, contact, email, password, phone, type, website | Application submitted |

**Rule:** Login and signup are never mixed on the same page.

---

## Final Coach Profile

Single scroll page (no tabs):

1. Cover + Hero with verified badge
2. About + teaching styles + languages
3. Programs (Training Batch, Personal Coaching, Competition Coaching)
4. Upcoming trial sessions
5. Gallery + certificates + achievements
6. Student reviews
7. FAQs + policies
8. Sticky CTAs: Book Trial · Enroll in Program · Message Coach

---

## Final Student Profile

Display profile (not settings):

- Current coach · academy · programs
- Attendance · practice streak
- Upcoming classes · competition history
- Certificates · achievements · progress

Settings → separate `/dashboard/student/settings`

---

## Final Academy Profile

Cover · gallery · teachers · programs · facilities · competition results · reviews · Enroll · Contact Academy

---

## Final Competition Journey

Discover → filter (upcoming/live/completed) → detail (countdown, venue, organizer) → Register → Prepare → Results → Certificates

---

## Final Revenue Model

**How Yogstra Works** (replaces Pricing):

- Yogstra is free to join
- Platform earns a small commission on successful paid enrollments and competition registrations
- No monthly SaaS plans shown to users
- Coaches set their own program fees
- Academies manage their own pricing
- Secure online payments handled in-app

---

## Terminology Applied

| Old | New |
|-----|-----|
| Buy Course | Enroll in Program |
| 1-to-1 | Personal Coaching |
| Group Class | Training Batch |
| Teacher Listing | Coach Discovery |
| Orders | Enrollments |
| Marketplace | Platform |
| Manage an Academy | Run a Yoga Academy |
| Organize Competitions | Host Yoga Competitions |
| Buy Class | Enroll in Program |
| Book Session | Book Trial |

---

## Components Replaced

| Component | Change |
|-----------|--------|
| `JourneyCard` | Lucide icons, wider cards, bullet subtitles |
| `TeacherCard` | Premium V2 card with all metadata |
| `TeacherProfilePage` | Tab layout → scroll sections |
| `PublicFooter` | Removed newsletter, simplified links |
| `PublicTopNav` | Final nav, no Resources dropdown |
| `LandingPage` | Complete redesign, no pricing |
| `LoginPage` | Login only, no OAuth |
| `StudentAuthPage` | Signup only |
| `GetStartedPage` | Premium onboarding cards |

---

## UX Improvements

1. **Clear product identity** — every page reinforces OS positioning
2. **Separated auth** — login ≠ signup ≠ onboarding
3. **No dead-end pages** — pricing/contact/newsletter removed
4. **No fake features** — OAuth, enterprise, newsletter gone
5. **Premium coach profiles** — strongest conversion page
6. **Discover as hub** — single entry point for exploration
7. **Auto-redirect login** — no unnecessary workspace picker
8. **Dedicated signup flows** — academy and organizer no longer route to student auth
9. **No technical jargon** — LiveKit/Razorpay/Supabase never shown to users
10. **Consistent V2 design** — cards, buttons, spacing, typography unified

---

## Reasoning

The previous public experience mixed marketplace patterns (pricing cards, buy class, OAuth placeholders) with academy OS positioning. Users encountered conflicting mental models.

Sprint 9 resolves this by:
- Removing pages that don't serve discover/learn/teach/enroll/compete/manage
- Making every auth path explicit and role-specific
- Elevating coach profiles as the primary conversion surface
- Explaining revenue through commission model, not SaaS pricing
- Applying premium product patterns (Airbnb/Notion-level clarity) throughout

---

*Implementation details in `SPRINT_9_REPORT.md`*
