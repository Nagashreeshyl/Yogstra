# Beta Test Plan — Yogstra

---

## Phase 1 — Internal (Week 1)

| Test | Owner | Pass criteria |
|------|-------|---------------|
| Student signup → login | QA | Dashboard loads |
| Payment → enrollment | QA | Bookings + enrolled UI |
| Teacher approval | Admin | Audit log entry |
| Error boundary | Dev | Force error → recovery page |
| Feedback widget | Beta user | Appears in admin feedback |
| System health | Admin | All checks green |

---

## Phase 2 — Closed beta (Week 2–4)

**Cohort:** 10 students, 5 teachers, 1 academy owner

### Student scenarios

1. Browse teachers → enroll → pay → verify dashboard
2. Register for competition
3. Submit feedback via widget
4. Logout → login → data persists

### Teacher scenarios

1. Complete profile → create program
2. See new student after payment
3. Schedule class → join video room

### Admin scenarios

1. Approve/reject teacher — verify audit log
2. Review `/admin/system` errors daily
3. Triage `/admin/feedback`
4. Export analytics CSV

---

## Phase 3 — Exit criteria

- [ ] Zero critical bugs open > 48h
- [ ] Payment fulfillment 100% in test cohort
- [ ] `npm run test:e2e` passes
- [ ] Migration 014 applied in production
- [ ] All feedback items reviewed

---

## Regression

Run before each beta release:

```bash
npm run lint && npm run build && npm run test:e2e
```

---

## Bug severity

| Level | Response |
|-------|----------|
| Critical | Same-day fix (payment, auth, data loss) |
| High | 48h (enrollment UI, admin actions) |
| Medium | Next sprint (a11y, performance) |
| Low | Backlog |
