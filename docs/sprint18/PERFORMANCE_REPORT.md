# PERFORMANCE_REPORT — Sprint 18

**Scope:** Backend query patterns, indexes, payload size (security audit pass)  
**Not a full load test** — static analysis + known hotspots

---

## Database indexes (verified in migrations)

| Table | Index | Purpose |
|-------|-------|---------|
| class_orders | student_id, teacher_id, razorpay ids | Order lookup, idempotency |
| bookings | student_id, teacher_id (via FK) | Dashboard queries |
| chat_threads | participants | Message hub |
| competitions | organizer_id, status | Organizer dashboard |
| competition_registrations | competition_id, registrant_id | Dedupe registration |
| batch_students | batch_id, student_id | Academy roster |

**Sprint 18 impact:** New BEFORE INSERT triggers add negligible overhead (single row checks).

---

## N+1 / overfetching observations

| Area | Pattern | Severity | Recommendation |
|------|---------|----------|----------------|
| Teacher dashboard | Multiple separate Supabase calls | Low | Batch with RPC or single view |
| Messages hub | Thread list + profile fetches | Medium | Join or select minimal columns |
| Competition organizer | Registration table + participants | Low | Existing repository pattern OK |
| Public teacher list | Full profile rows including phone | Medium | Select explicit columns / view |
| Admin dashboard | Parallel count queries | Low | Acceptable for admin scale |

---

## Payload size

| Endpoint | Risk |
|----------|------|
| Community feed | Post media URLs (not blobs) — OK |
| Competition metadata | JSON participant metadata — bounded in forms |
| API bodies | Sanitized max lengths in `validateInput.ts` |

---

## Bundle size (build output)

| Chunk | Size (gzip) |
|-------|-------------|
| livekit | 163 KB |
| vendor | 72 KB |
| supabase | 52 KB |
| index | 47 KB |

LiveKit is largest; already code-split. No Sprint 18 regression.

---

## Supabase Realtime

Subscriptions on chat and live sessions — RLS-filtered. Monitor connection count at beta scale.

---

## API cold starts

Vercel functions include `server/**` — ~6 routes. Rate limit Map reinitializes per instance (also a security note).

---

## Duplicate queries

- `fetchActiveClassPurchase` — single query with filter ✅
- Enrollment duplicate check in `orderValidation.ts` — explicit query before order ✅
- Registration dedupe via `findByCompetitionAndRegistrant` ✅

---

## Performance improvements (Sprint 18)

None targeted — security hardening only. Triggers are O(1) per row.

---

## Recommended follow-ups

1. Create `public_profiles` view — smaller SELECT payload + PII fix
2. Add composite index `(competition_id, registrant_id)` on registrations if not present
3. Redis rate limiting (also improves fairness under load)
4. Lazy-load competition pages chunk (70 KB gzip) on student path only

---

## Regression tests

| Command | Result |
|---------|--------|
| `npm run build` | ✅ 403ms |
| `npm run test:e2e` | ✅ 112 passed |

No performance regressions detected from security changes.
