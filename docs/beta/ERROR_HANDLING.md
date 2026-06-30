# Error Handling — Yogstra Beta

---

## Principles

1. Never expose raw SQL, stack traces, or HTTP codes to users
2. Every async action should have a user-visible outcome (toast, alert, or inline message)
3. Errors are logged to `platform_activity_log` when possible
4. White screens prevented by `AppErrorBoundary`

---

## Utilities

| Function | File | Use |
|----------|------|-----|
| `formatUserFacingError()` | `src/utils/format.ts` | Generic API/Supabase errors |
| `formatAuthError()` | `src/utils/format.ts` | Login/signup |
| `USER_ERROR.*` | `src/utils/format.ts` | Static fallbacks |

---

## Mapped error categories

- Payment cancelled / failed
- Enrollment incomplete
- Upload failures
- Network timeout / offline
- Permission denied
- Competition / academy actions

---

## Error Boundary

`AppErrorBoundary` wraps the app in `main.tsx`:

- Catches React render errors
- Shows retry + home links
- Logs to activity log with component stack

---

## Payment-specific flow

Razorpay success → fulfill API → on failure:

- User sees friendly payment message
- `payment_failed` logged with teacher/order context
- Webhook backup should retry fulfillment

---

## Developer checklist

- [ ] Use `formatUserFacingError` in catch blocks
- [ ] Use `role="alert"` for form errors
- [ ] Call `logActivity({ action: 'error', status: 'error', ... })` for critical failures
- [ ] Never `console.error` alone without user feedback
