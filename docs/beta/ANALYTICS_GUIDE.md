# Analytics Guide — Yogstra Beta

---

## Data collection

Events stored in `platform_analytics_events` via `trackAnalyticsEvent()`:

| Event | Trigger |
|-------|---------|
| `registration` | Student signup complete |
| `login` / `dashboard_view` | Sign in |
| `enrollment` | (server) payment fulfillment |
| `teacher_view` | Pass `metadata.teacherName` when implemented |
| `search` | Pass `metadata.term` when implemented |
| `page_view` | Optional route tracking |

---

## Admin reporting

**Location:** `/admin/system` → Analytics (30d)

- DAU / WAU / MAU (unique user_ids)
- Enrollment and registration counts
- Event breakdown
- Top teacher views and search terms

**Export:** CSV download button

---

## Privacy

- No PII in `metadata` JSON by default
- `user_id` nullable for anonymous events
- Admin-only read via RLS

---

## Extending tracking

```typescript
import { trackAnalyticsEvent } from '../services/platformAnalytics'

void trackAnalyticsEvent('teacher_view', { teacherName: teacher.name })
```

Fire-and-forget — never await in critical UI paths.
