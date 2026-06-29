# Performance Review — Sprint 14

**Date:** 2026-06-30  
**Build:** `npm run build` (Vite 6 + Rolldown)  
**Environment:** Production minified bundle analysis

---

## Executive summary

Yogstra V2 delivers **good initial load performance** for an SPA with video, payments, and multi-workspace dashboards. Code splitting is extensive; LiveKit is isolated and lazy-loaded. Supabase client is in a dedicated chunk for cache efficiency.

| Metric | Value | Assessment |
|---|---|---|
| Initial JS (index + vendor + supabase) | ~592 KB min / ~167 KB gzip | ✅ Good |
| Largest chunk | livekit ~603 KB / ~163 KB gzip | ⚠️ Expected; lazy |
| CSS | ~96 KB / ~16 KB gzip | ✅ Good |
| Build time | ~400 ms | ✅ Excellent |
| Route-level splitting | 40+ lazy chunks | ✅ Strong |

---

## Bundle analysis (2026-06-30 build)

### Core chunks (loaded on first paint)

| Chunk | Minified | Gzip | Loaded when |
|---|---|---|---|
| `index-*.js` | 166 KB | 44 KB | Always (app shell, router, context) |
| `vendor-*.js` | 224 KB | 72 KB | Always (react-dom, react-router) |
| `supabase-*.js` | 202 KB | 52 KB | Always (auth + data layer) |
| CSS | ~96 KB | ~16 KB | Always |

**First-load JS (critical path):** ~592 KB minified / ~168 KB gzipped (excluding LiveKit)

### Lazy chunks (route-triggered)

| Chunk | Minified | Gzip | Route |
|---|---|---|---|
| `livekit-*.js` | 603 KB | 163 KB | Video classes, direct calls |
| `competitionPages-*.js` | 67 KB | 16 KB | Organizer competition dashboard |
| `academyPages-*.js` | 38 KB | 9 KB | Academy workspace |
| `MessagesHub-*.js` | 37 KB | 10 KB | Chat/messages |
| `StudentDashboardPage-*.js` | 20 KB | 6 KB | Student home |
| `TeacherDashboardPage-*.js` | 21 KB | 6 KB | Teacher home |
| `StudentCompetitionHomePage-*.js` | 13 KB | 4 KB | Student competitions |
| `qrcode-*.js` | 23 KB | 9 KB | Certificate verification |

### Warnings

Vite reports LiveKit chunk > 500 KB. This is **expected** and mitigated by lazy loading — LiveKit only loads when user enters a video class or direct call.

---

## Code splitting strategy

### Vite manual chunks (`vite.config.ts`)

```typescript
manualChunks(id) {
  if (id.includes('@livekit') || id.includes('livekit-client')) return 'livekit'
  if (id.includes('@supabase')) return 'supabase'
  if (id.includes('qrcode')) return 'qrcode'
  if (id.includes('react-dom') || id.includes('react-router')) return 'vendor'
}
```

### React.lazy routes (`App.tsx`)

- All dashboard pages lazy-loaded
- Student competition pages split per-route (not barrel import)
- Public marketing pages lazy-loaded
- Admin console lazy-loaded

### Suspense boundaries

- Route-level `<Suspense fallback={<LoadingSkeleton />}>` on dashboard routes
- Prevents white flash during chunk fetch

---

## Initial load path

```
index.html
  → index.js (router, AppContext, theme)
  → vendor.js (React)
  → supabase.js (auth check on mount)
  → LandingPage chunk (if /)
```

Authenticated dashboard adds one route chunk (~13–67 KB) on navigation.

**Estimated first contentful paint:** Depends on CDN; gzipped critical JS ~168 KB is competitive for a feature-rich SPA.

---

## Largest routes (by chunk weight)

| Route | Chunks loaded | Approx gzip |
|---|---|---|
| Video class / LiveKit room | index + vendor + supabase + livekit | ~275 KB |
| Competition organizer dashboard | + competitionPages | ~291 KB |
| Student dashboard | + StudentDashboardPage | ~178 KB |
| Messages | + MessagesHub + directChat | ~198 KB |

LiveKit route is the heaviest — only reached when user explicitly joins video.

---

## Query duplication

### Observed patterns

| Pattern | Location | Impact |
|---|---|---|
| Student competition home | Fetches competitions + registrations + certificates (post-fix) | Low — parallel Promise.all |
| Dashboard widgets | Each card may refetch overlapping profile data | Low — cached in context |
| Realtime subscriptions | Chat, notifications use channels | Efficient — push vs poll |

### Silent empty fallbacks

Services returning `[]` on missing tables avoid retry storms in dev but don't cause duplicate queries in production.

### Recommendations

1. Consider React Query or SWR for request deduplication if dashboard fetch count grows
2. Batch student dashboard into single RPC or view (post-MVP optimization)
3. Add recommended DB indexes (see DATABASE_VALIDATION.md) before high traffic

---

## Caching

| Layer | Strategy |
|---|---|
| Static assets | Vite content-hash filenames → long cache via Vercel CDN |
| Supabase data | No client-side persistent cache; refetch on navigation |
| Service worker | Not implemented |
| API responses | No CDN cache (dynamic, authenticated) |

**Recommendation:** Add `Cache-Control` headers for public static marketing assets if not already set by Vercel defaults.

---

## Lazy loading verification

| Library | Lazy? | Mechanism |
|---|---|---|
| LiveKit | ✅ | Route lazy + manual chunk |
| QRCode | ✅ | Manual chunk; certificate pages only |
| Competition pages | ✅ | React.lazy per page |
| Academy pages | ✅ | React.lazy barrel split |
| Admin pages | ✅ | React.lazy |

---

## Suspense & loading states

- `LoadingSkeleton` component used consistently across dashboards
- `useAsyncData` hook standardizes fetch + loading + error states
- `OfflineIndicator` component for network status

---

## Runtime performance considerations

| Area | Status |
|---|---|
| List virtualization | Not implemented — acceptable for MVP list sizes |
| `React.memo` | Used on competition list cards, some pages |
| Re-render hotspots | MessagesHub `users` dependency (lint warning) — minor |
| Image optimization | Native `<img>` with uploaded URLs — no next/image equivalent |

---

## Performance checklist

- [x] LiveKit code-split and lazy-loaded
- [x] Supabase in dedicated chunk
- [x] Per-route dashboard splitting
- [x] QR code isolated chunk
- [x] Build completes in < 1s
- [ ] Service worker / offline cache (future)
- [ ] List virtualization for large tables (future)
- [ ] Request deduplication library (future)
- [ ] Image CDN transforms (future)

---

## Measurement commands

```bash
# Production build with size report
npm run build

# Analyze bundle (optional — add rollup-plugin-visualizer)
npx vite-bundle-visualizer
```

---

## Comparison to prior audit (2026-06-29)

| Metric | Before | After (Sprint 14) | Change |
|---|---|---|---|
| index.js gzip | 29–30 KB | 44 KB | +14 KB (feature growth) |
| supabase.js | Dedicated 52 KB gzip | Same | Stable |
| studentCompetition barrel | 68 KB single chunk | Split per route ~3–4 KB each | ✅ Improved |
| Total dist/assets | ~2.0 MB | ~2.0 MB | Similar; better caching |

Feature growth increased index chunk size; route splitting improvements offset competition bundle bloat.
