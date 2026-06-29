# Accessibility Report

**Date:** 2026-06-29  
**Standard target:** WCAG 2.1 AA (pragmatic audit)

---

## Summary

| Severity | Found | Fixed this sprint |
|---|---|---|
| Critical | 1 | 1 |
| High | 2 | 1 |
| Medium | 4 | 0 (documented) |
| Low | 6 | — |

---

## Critical (fixed)

### Skip navigation missing

**Issue:** Keyboard users could not bypass repeated sidebar/topbar chrome.  
**Fix:** Added skip link + `id="main-content"` on `<main>` in `AppShell.tsx`.

---

## High

### Form feedback not announced (fixed)

**Issue:** Auth success/error messages were visual-only.  
**Fix:** `StudentAuthPage` — `role="status"` / `role="alert"` + `aria-live` on feedback paragraphs.

### Modal focus traps (open)

**Issue:** Some modals (BuyClass, CreatePost, AvatarCrop) rely on default browser focus — not verified trapped.  
**Status:** Documented; no behavior change this sprint. Recommend `@radix-ui/react-dialog` or focus-trap library in future pass.

---

## Medium (documented)

| Issue | Location | Recommendation |
|---|---|---|
| Disabled global search lacks clear “coming soon” for sighted users | `shell/SearchBar.tsx` | Already has `sr-only` text; consider visible badge |
| Tab panels in competition detail | `StudentCompetitionDetailPage` | Verify `aria-selected` on tab buttons |
| Color contrast on muted text | Various dashboard cards | Spot-check `--muted-foreground` against cream backgrounds |
| Live region for toast notifications | `Toast.tsx` | Add `role="status"` if not present |

---

## Passing patterns (verified)

| Pattern | Examples |
|---|---|
| `role="status"` / `role="alert"` | `EmptyState`, `ErrorState` |
| Progress bars | `RegistrationProgress` — `role="progressbar"`, `aria-valuenow` |
| Icon buttons with labels | Filter toggle `aria-label="Filters"`, shell search `aria-label` |
| Semantic headings | Page headers use `h1`/`h2` hierarchy in competition pages |
| Form labels | `Input` component with `label` prop used on auth/settings |
| Keyboard-accessible links | Card components use `<Link>` not click-only divs |

---

## Screen reader notes

- Competition registration wizard announces step progress via `RegistrationProgress`.
- Judge offline indicator should expose sync state — verify `OfflineIndicator` has accessible text (present in component).
- Empty/error states use heading + description pattern suitable for SR.

---

## Follow-up checklist

- [ ] Audit all modals for focus trap and `aria-modal`
- [ ] Run axe-core or Lighthouse a11y on top 10 routes
- [ ] Verify contrast ratios for teal-on-cream and primary buttons
- [ ] Add visible focus rings audit across custom button styles
