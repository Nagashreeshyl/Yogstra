# Final Performance Report — Yogstra MVP

**Date:** 2026-06-30  
**Sprint:** 16

---

## Build metrics

| Metric | Value |
|---|---|
| Production build time | ~500ms |
| Main bundle (`index`) | 167 KB (44 KB gzip) |
| Vendor (React/Router) | 224 KB (72 KB gzip) |
| Supabase client | 202 KB (52 KB gzip) |
| LiveKit (lazy) | 603 KB (163 KB gzip) |

**Build:** ✅ Passes with chunk size warning on LiveKit (expected — video feature).

---

## Page load (Playwright, networkidle)

| Route | Load time | Status |
|---|---|---|
| Landing | ~3.2s | ✅ Under 8s threshold |
| Discover | ~2.7s | ✅ |
| Teachers | ~2.6s | ✅ |
| Academies | ~2.5s | ✅ |
| Community | ~2.5s | ✅ |
| Competitions | ~2.5s | ✅ |

All public routes load under 20s hard limit; all under 8s soft threshold except landing (acceptable with live data).

---

## Duplicate queries (landing page)

| Endpoint | Calls per page load |
|---|---|
| `profiles` | 4 |
| `academies` | 4 |
| `competitions` | 4 |

**Priority:** Low  
**Impact:** Extra Supabase round-trips on homepage  
**Suggested fix:** Consolidate landing section data fetches into single hook with shared cache

---

## Optimizations in place

- Route-level code splitting (lazy pages)
- LiveKit loaded only on class/video routes
- Realtime debounced at 50ms (`liveSync.ts`)
- Enrollment event bus avoids polling after payment

---

## Sprint 16 performance-related changes

- `batch_students` added to realtime channel (reduces need for manual refresh, not query reduction)
- Idempotent fulfillment prevents duplicate side-effect writes on webhook retry

---

## Recommendations (post-beta)

1. Deduplicate landing page Supabase fetches
2. Consider `@tanstack/react-query` with staleTime for list pages
3. Preconnect to Supabase origin in `index.html`
4. Monitor Vercel Analytics Core Web Vitals after deploy

**No performance blockers for MVP launch.**
