# Yogstra V2 Public Website & Authentication Redesign — Sprint 7 Report

**Date:** June 30, 2026  
**Branch:** `feature/v2-app-shell`  
**Commit:** `feat(public): complete Yogstra V2 public website and authentication redesign`

---

## Summary

Sprint 7 replaces the V1 public experience with a premium forest-green marketing site aligned to the V2 dashboard design system. Public pages now use a dedicated horizontal navigation layout (not the dashboard sidebar), pinned footer, journey-based authentication, and workspace picker for multi-role accounts.

**Brand positioning:** *The Operating System for Yoga Academies & Competitions.*

---

## Pages Redesigned / Added

| Route | Page | Status |
|-------|------|--------|
| `/` | LandingPage | **New** — hero, journeys, pricing teaser, FAQ, CTA |
| `/explore` | ExplorePage | **Redesigned** — V2 header, discovery layout |
| `/teachers` | FindTeachersPage | **Updated** — V2 typography, premium TeacherCard |
| `/teachers/:id` | TeacherProfilePage | Existing (V2 tokens via shell) |
| `/academies` | AcademiesPage | **New** — academy directory |
| `/academies/:slug` | AcademyProfilePage | **New** — academy profile |
| `/competitions` | CompetitionsPage | Existing public shell |
| `/competitions/:slug` | PublicCompetitionDetailPage | Existing |
| `/community` | CommunityPage | Existing public shell |
| `/pricing` | PricingPage | **New** — plans + comparison table |
| `/about` | AboutPage | **New** |
| `/contact` | ContactPage | **New** |
| `/help` | HelpCenterPage | **New** |
| Legal pages | Privacy, Terms, Refund | Existing via public layout |

---

## Authentication Redesign

| Route | Component | Change |
|-------|-----------|--------|
| `/auth/get-started` | GetStartedPage | **New** — 4 journey cards (Student, Teacher, Academy, Organizer) |
| `/auth/login` | LoginPage | **New** — unified email/password login, forgot password, OAuth placeholders |
| `/auth/workspace` | WorkspacePickerPage | **New** — multi-workspace selector with “Remember my choice” |
| `/auth/student` | StudentAuthPage | **Redesigned** — AuthLayout, workspace-aware redirect |
| `/auth/teacher` | TeacherLoginPage | Existing (links preserved) |
| `/auth/teacher/register` | TeacherRegistrationPage | Existing flow preserved |
| `/auth/role` | — | Redirects to `/auth/get-started` |

**Removed:** Role dropdown / binary student-teacher modal as primary entry. RoleSelectionModal now offers Get Started / Log in only.

**Preserved:** All Supabase auth services, sign-up flows, teacher verification, and backend logic unchanged.

---

## New Components

| Component | Purpose |
|-----------|---------|
| `PublicWebsiteLayout` | Top nav + content + pinned footer |
| `PublicTopNav` | Desktop horizontal nav, Resources dropdown |
| `PublicMobileNav` | Hamburger drawer for mobile |
| `PublicFooter` | Company / Platform / Resources / Legal + newsletter |
| `PublicSection` | Consistent marketing section wrapper |
| `JourneyCard` / `JourneyGrid` | Onboarding journey cards |
| `AuthLayout` | Centered auth pages with back-to-home |
| `publicNavLinks.ts` | Central nav configuration |

---

## Layout Migration

- **Before:** Public routes used `AppShell` with sidebar + bottom tabs (dashboard pattern).
- **After:** Public routes use `PublicWebsiteLayout` with horizontal nav and footer pinned via `flex min-h-screen flex-col`.

---

## Design System

- `.public-site` CSS scope applies forest green palette (`#0F1F17`, `#16281D`, `#1A2E22`, cream text, gold accent).
- Semantic tokens only — no cream/white card backgrounds on public pages.
- Serif headings (`Playfair Display`), sans body (`Inter`).
- Reused V2 `Button`, `Input`, `Badge`, `Card`, `PageContainer`, `PageHeader`.

---

## Teacher Cards

`TeacherCard` upgraded with:
- Large profile photo, verified badge
- Experience, rating, students trained, location
- Monthly fee, specializations
- View Profile + Book Session actions
- V2 elevated dark-green card aesthetic

---

## Utilities

- `workspacePreference.ts` — remember workspace, `resolvePostLoginPath()` for multi-dashboard users.

---

## Legacy Components Removed / Deprecated

| Item | Action |
|------|--------|
| Public `AppShell` sidebar layout | Replaced by `PublicWebsiteLayout` |
| `RoleSelectionPage` UI | Redirect-only stub |
| Binary role modal (student/teacher cards) | Replaced with Get Started / Log in |

---

## Remaining Inconsistencies (Follow-up)

1. **Teacher profile / community feed** — functional but not fully expanded to Sprint 7 spec sections (gallery, achievements grid, Instagram-style community cards). Shell and tokens applied; deep content layout pass optional.
2. **Chat UI** — legacy `cream`/`charcoal` tokens remain in messaging components (dashboard-only, not public).
3. **OAuth** — Google/Apple buttons are placeholders (disabled).
4. **Student onboarding wizard** — multi-step goals/experience flow not added; existing single-page student signup preserved.
5. **Global search** — dashboard SearchBar exists; public global search page not added.
6. **TeacherRegistrationPage / TeacherPendingPage** — styling pass partial; flows work.

---

## QA Checklist

- [x] Landing page renders with V2 palette
- [x] Public nav desktop + mobile drawer
- [x] Footer pinned on short pages
- [x] Explore, Teachers, Academies, Pricing, About, Contact, Help
- [x] Get Started journey cards
- [x] Unified login
- [x] Workspace picker for multi-role users
- [x] Build passes (`npm run build`)
- [ ] Manual responsive QA on all breakpoints
- [ ] Manual auth E2E (signup, login, workspace remember)

---

## Files Changed (High Level)

- `src/components/public/*` — new public shell
- `src/components/layout/AppLayout.tsx` — uses PublicWebsiteLayout
- `src/components/layout/PublicFooter.tsx` — full footer
- `src/pages/public/*` — new public pages
- `src/pages/ExplorePage.tsx`, `FindTeachersPage.tsx`, `StudentAuthPage.tsx`
- `src/components/teachers/TeacherCard.tsx`
- `src/components/auth/RoleSelectionModal.tsx`, `LoggedInRedirect.tsx`
- `src/utils/workspacePreference.ts`
- `src/App.tsx` — routes
- `src/index.css` — `.public-site` tokens
