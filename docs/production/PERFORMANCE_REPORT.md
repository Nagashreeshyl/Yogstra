# Performance Report

**Date:** 2026-06-29  
**Build command:** `npm run build`

---

## Before (baseline)

| Chunk | Size (min) | Gzip |
|---|---|---|
| `livekit-*.js` | 592 KB | 163 KB |
| `vendor-*.js` | 220 KB | 72 KB |
| `index-*.js` | 112 KB | 29 KB |
| `supabase-*.js` | 100 KB | 24 KB |
| `studentCompetitionPages-*.js` | **68 KB** | **16 KB** |
| `competitionPages-*.js` | 44 KB | 12 KB |
| **Total `dist/assets`** | **~2.0 MB** | — |

### Observations (before)

- Student competition routes shared one 68 KB barrel chunk.
- Supabase client bundled inside main graph without dedicated chunk boundary.
- QR code library inlined in feature chunks.

---

## After (optimizations)

| Chunk | Size (min) | Gzip | Change |
|---|---|---|---|
| `livekit-*.js` | 592 KB | 163 KB | unchanged (lazy on class/video routes) |
| `vendor-*.js` | 223 KB | 71 KB | ~same |
| `supabase-*.js` | **202 KB** | **52 KB** | dedicated chunk |
| `index-*.js` | 113 KB | 30 KB | ~same |
| `studentCompetitionPages-*.js` | **removed** | — | split per route |
| `StudentCompetitionHomePage-*.js` | 13 KB | 3 KB | new |
| `StudentRegistrationWizardPage-*.js` | 12 KB | 4 KB | new |
| `competitionPages-*.js` | 53 KB | 13 KB | +9 KB (supabase moved out) |
| `qrcode-*.js` | 23 KB | 9 KB | new isolated chunk |
| **Total `dist/assets`** | **~2.0 MB** | — | similar total; better caching |

### Optimizations applied

1. **Per-route lazy imports** — Student competition pages import directly from page files instead of a shared barrel (`App.tsx`).
2. **Manual chunk splitting** — `@supabase/supabase-js` and `qrcode` get dedicated Vite chunks (`vite.config.ts`).
3. **`React.memo`** — `StudentCompetitionListCard` memoized for list re-render stability.
4. **Existing** — LiveKit already isolated; most routes already `lazy()` loaded.

---

## Largest components (by route chunk)

| Route area | Chunk | Notes |
|---|---|---|
| Live classes / video | livekit (592 KB) | Loaded only on `/classes/room/*` and video call routes |
| Core app shell | index + vendor (~335 KB) | React, router, app bootstrap |
| Messaging | MessagesHub (~36 KB) | Lazy on messages routes |
| Organizer + foundation competition | competitionPages (~53 KB) | Lazy |

---

## Query / network patterns

| Pattern | Status |
|---|---|
| `useAsyncData` for page fetches | Standard across dashboards |
| `useLiveSync` / `useLiveDataRefresh` | Realtime refetch on bookings, teachers, posts |
| Duplicate request risk | Low — hooks dedupe via dependency arrays; no parallel duplicate fetchers on same page |
| Student competition home | Single `fetchStudentCompetitionHome` per filter change |

### Recommendations (future)

- Add request deduplication cache for shared competition list fetches if multiple widgets mount simultaneously.
- Consider dynamic import for `react-image-crop` (15 KB) only on settings/avatar routes.
- Monitor LiveKit chunk — already route-scoped; no change needed unless bundle budget tightens.

---

## Build time

| | Before | After |
|---|---|---|
| Vite build | ~987 ms | ~344 ms |

(Typecheck adds ~7 s either way.)
