# UI Migration Report — Sprint 6

**Date:** June 30, 2026  
**Branch:** `feature/v2-app-shell`  
**Scope:** Migrate all remaining pages to the Yogstra V2 design system without changing business logic or backend services.

---

## Summary

Sprint 6 completed a repository-wide UI migration to the V2 design language defined by the App Shell, Student/Teacher dashboards, Organizer dashboard, and Judge dashboard.

| Metric | Before | After |
|--------|--------|-------|
| Legacy color tokens in `src/` (`cream`, `charcoal`, `teal`, `surface`) | ~97 files | **0** |
| Core UI components on V2 tokens | Partial | **100%** |
| Admin pages with `PageHeader` | 1 | **15** |
| Competition routes with `AppShell` | 0 | **1 layout (all competition routes)** |
| Orphaned legacy sidebars | 4 | **0 (removed)** |

**Build:** `npm run build` — pass  
**Lint:** `npm run lint` — pass (pre-existing warnings only)

---

## Design Reference (Source of Truth)

| Reference | Path |
|-----------|------|
| App Shell | `src/components/shell/AppShell.tsx` |
| Student Dashboard V2 | `src/pages/student/StudentDashboardPage.tsx` |
| Teacher Dashboard V2 | `src/pages/TeacherDashboardPage.tsx` |
| Organizer Dashboard | `src/pages/competition/OrganizerDashboardPage.tsx` |
| Judge Dashboard | `src/pages/judge/JudgeDashboardPage.tsx` |

**Design tokens:** `src/index.css` — forest green primary, cream background, gold accent, semantic `background` / `foreground` / `elevated` / `muted` / `border`.

---

## Foundation Changes

### Core UI components migrated to V2

| Component | Path | Changes |
|-----------|------|---------|
| Button | `src/components/ui/Button.tsx` | Primary/secondary/ghost/danger/accent on semantic tokens; `rounded-[12px]`; focus rings |
| Input | `src/components/ui/Input.tsx` | Consistent `h-11`, elevated surface, error state |
| Select | `src/components/ui/Select.tsx` | Same as Input |
| Textarea | `src/components/ui/Textarea.tsx` | Same pattern |
| PasswordInput | `src/components/ui/PasswordInput.tsx` | Same pattern |
| Card | `src/components/ui/Card.tsx` | Matches `DashboardCard` (`rounded-[16px]`, `bg-elevated`, shadow) |
| Modal | `src/components/ui/Modal.tsx` | Elevated surface, backdrop blur, ARIA dialog |
| ConfirmModal | `src/components/ui/ConfirmModal.tsx` | V2 buttons and surfaces |
| Badge | `src/components/ui/Badge.tsx` | Removed `teal`/`v2` variants → `primary`/`accent`/`muted` |
| **DataTable** (new) | `src/components/ui/DataTable.tsx` | Unified responsive table + search + pagination + empty state |
| AdminTable | `src/components/admin/AdminTable.tsx` | Re-exports `DataTable` for backward compatibility |

### Layout & shell

| Change | Path |
|--------|------|
| Admin layout wraps `PageContainer` | `src/components/admin/AdminLayout.tsx` |
| Competition routes get full `AppShell` + nav | `src/components/competition/CompetitionRouteLayout.tsx` |
| Competition nav config (new) | `src/components/shell/nav/competitionNav.ts` |
| Feed/settings layouts → V2 tokens | `src/components/layout/FeedPageLayout.tsx` |
| Legal pages → `PageContainer` + `PageHeader` | `src/components/layout/LegalDocumentLayout.tsx` |
| Explore filter bar → V2 styling | `src/components/filters/SearchBar.tsx` |

---

## Pages Migrated

### Auth (5)

- `RoleSelectionPage.tsx`
- `StudentAuthPage.tsx`
- `TeacherLoginPage.tsx`
- `TeacherRegistrationPage.tsx`
- `TeacherPendingPage.tsx`

### Public (8)

- `ExplorePage.tsx`
- `FindTeachersPage.tsx`
- `CommunityPage.tsx` (via `CommunityFeedView.tsx`)
- `ShopPage.tsx`
- `CompetitionsPage.tsx`
- `TeacherProfilePage.tsx`
- `StudentProfilePage.tsx`
- Legal: `PrivacyPolicyPage.tsx`, `TermsOfServicePage.tsx`, `RefundPolicyPage.tsx`

### Student (3 + dashboard already V2)

- `StudentSettingsPage.tsx`
- `StudentClassesPage.tsx`
- `StudentMessagesPage.tsx` — unchanged layout (full-bleed `MessagesHub`; intentional)

### Teacher (8 + dashboard already V2)

- `TeacherStudentsPage.tsx`
- `TeacherSchedulePage.tsx`
- `TeacherNotificationsPage.tsx`
- `TeacherEarningsPage.tsx`
- `TeacherCouponsPage.tsx`
- `TeacherClassesPage.tsx`
- `TeacherSettingsPage.tsx`
- `TeacherCommunityPage.tsx` (via shared feed view)
- `TeacherMessagesPage.tsx` — unchanged layout (full-bleed `MessagesHub`; intentional)

### Admin (15)

All admin pages now use `PageHeader` inside layout-level `PageContainer`:

- `AdminDashboardPage.tsx`
- `AdminTeachersPage.tsx`
- `AdminStudentsPage.tsx`
- `AdminCommunityPage.tsx`
- `AdminBookingsPage.tsx`
- `AdminSchedulesPage.tsx`
- `AdminChatsPage.tsx`
- `AdminPayoutsPage.tsx`
- `AdminCategoriesPage.tsx`
- `AdminCompetitionsPage.tsx`
- `AdminAcademiesPage.tsx`
- `AdminReportsPage.tsx`
- `AdminUsersPage.tsx`
- `AdminAuditPage.tsx`
- `AdminSettingsPage.tsx`

### Academy (already V2 — token refresh)

All 10 academy pages received badge/token updates (`teal` → `primary`).

### Competition / Judge / Organizer

- `CompetitionRouteLayout` now provides App Shell chrome for all foundation competition routes
- Existing V2 pages retained: Organizer dashboard, Judge dashboard, competition home/detail/results/rankings/certificates
- Student competition sub-routes retain `PageHeader` / `DashboardCard` patterns from Sprint 4–5

### Verify

- `VerifyCertificatePage.tsx` — already V2; token-aligned

---

## Shared Components Updated (97 files)

Bulk token migration applied across:

- Chat (`MessagesHub`, modals, conversation list)
- Classes (`LiveClassRoom`, overlays, schedule change modal)
- Community (`CommunityFeed`, `CreatePostModal`, sidebar)
- Coupons, categories, teachers, schedule calendar
- Profile settings, PWA prompts, admin modals
- Skeleton loaders

**Legacy colors removed:** zero remaining `text-charcoal`, `bg-cream`, `text-teal`, `bg-teal`, `bg-surface` in `src/`.

---

## Legacy Components Removed

| File | Reason |
|------|--------|
| `src/components/layout/AppSidebar.tsx` | Replaced by `shell/Sidebar.tsx` |
| `src/components/layout/StudentSidebar.tsx` | Replaced by App Shell student nav |
| `src/components/layout/TeacherSidebar.tsx` | Replaced by App Shell teacher nav |
| `src/components/admin/AdminSidebar.tsx` | Replaced by App Shell admin nav |

**Kept (updated, still in use):**

- `ui/Card.tsx` — restyled to match `DashboardCard`
- `layout/FeedPageLayout.tsx` — V2 tokens for community/settings layouts
- `filters/SearchBar.tsx` — V2 styling (distinct from shell `SearchBar` used in TopBar)

---

## Remaining Inconsistencies / Manual Review

| Area | Notes | Priority |
|------|-------|----------|
| **Messages hub** | `StudentMessagesPage` / `TeacherMessagesPage` remain full-bleed WhatsApp-style layout by design | Low — functional UX choice |
| **Live class room** | Video room UI uses dense overlay patterns; tokens updated but not restructured into `DashboardCard` | Medium — visual QA in session |
| **Chat components** | Token migration complete; some inline message bubble styles remain custom | Low |
| **Admin chat review** | Admin moderation UI is functional but dense; consider future `DashboardCard` sections | Low |
| **Competition nav variant** | Competition shell uses `teacher` variant styling; dedicated competition sidebar theme possible later | Low |
| **Legacy CSS variables** | `index.css` still defines legacy `--color-cream` etc. for safety; unused in components | Cleanup in future sprint |
| **Spinner vs skeleton** | Small action buttons still use text loading states; acceptable per spec | OK |

---

## Screens Requiring Manual Visual QA

1. **Auth flows** — student signup, teacher registration wizard, pending state
2. **Teacher earnings & coupons** — tables and stat cards
3. **Student classes** — live session badges and room entry
4. **Admin chats** — moderation layout on tablet
5. **Competition organizer/judge** — new App Shell on competition routes (sidebar overlap with nested `PageHeader`)
6. **Explore / community feed** — mobile bottom nav + feed width
7. **Shop marketplace** — product cards on small screens
8. **Dark mode** — spot-check elevated surfaces and borders

---

## Accessibility

- Modal components: `role="dialog"`, `aria-modal`, close button labels
- Input/Select/Textarea: `aria-invalid`, error `role="alert"`
- Search inputs: `aria-label` / `type="search"`
- App Shell skip link retained
- Button focus-visible rings on V2 components

---

## Performance

- No new global state introduced
- Existing lazy routes unchanged
- `DataTable` uses local state only (same as prior `AdminTable`)
- Bulk class renames only; no additional re-render patterns

---

## Verification Commands

```bash
npm run build   # TypeScript + Vite production build
npm run lint    # oxlint
```

---

## Conclusion

All user-facing routes now share the V2 forest/cream/gold design language through updated primitives, shell layouts, and page-level `PageHeader` / `PageContainer` / `DashboardCard` patterns. Legacy sidebars and legacy Tailwind color classes have been removed from application code. The application should present as a single cohesive product across student, teacher, academy, admin, organizer, judge, and public surfaces.

**Recommended next step:** Manual visual QA on the eight screens listed above, especially competition routes with the new App Shell wrapper.

---

## Sprint 6.1 — UI Polish & Consistency (June 30, 2026)

### Mobile navigation

| Fix | Detail |
|-----|--------|
| **Hamburger drawer** | `MobileSidebarDrawer` — full sidebar nav on mobile via ☰ in top bar |
| **Bottom tab bar** | Raised to `z-[70]`, gold active state, safe-area padding |
| **Messages chat overlay** | Chat no longer covers bottom nav (`bottom-[calc(4rem+safe-area)]`) |
| **Public student Messages** | Added to mobile tab bar for logged-in students |

### Admin dashboard switching

| Fix | Detail |
|-----|--------|
| **RoleSwitcher** | Admin can switch to Student, Teacher, Academy, Organizer, Judge, Admin views |
| **Route access** | Admin allowed on `/dashboard/student/*` and `/dashboard/teacher/*` (preview mode) |
| **Academy / competition** | Already permitted for admin via foundation guards |

### Design token alignment (Sprint 6.1 palette)

- Sidebar: `#0F1F17` with gold active highlight
- Surface/background: `#F6F1E6`
- Accent/gold: `#D4AF37`
- Teacher cards rebuilt with V2 elevated surfaces (no cream overlay)

### Footer

- App shell uses `min-h-screen` + flex column so `PublicFooter` sticks to bottom on short pages

**Commit:** `fix(ui): ensure full UI consistency and footer fix`
