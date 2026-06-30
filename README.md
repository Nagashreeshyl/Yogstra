# Yogstra

Premium yoga ecosystem platform — discover teachers, enroll in programs, run academies, and host competitions.

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, React Router 7
- **Backend:** Supabase (Postgres, Auth, Storage, Realtime)
- **Payments:** Razorpay (+ Route for teacher payouts)
- **Video:** LiveKit Cloud
- **Hosting:** Vercel

## Development

```bash
npm install
npm run dev          # http://localhost:5173
npm run lint
npm run build
npm run test:e2e     # Playwright (Chromium)
```

Copy `.env.example` to `.env.local` and fill in Supabase, Razorpay, and LiveKit credentials.

## Documentation

| Area | Path |
|------|------|
| Production deployment | `docs/final/FINAL_DEPLOYMENT_GUIDE.md` |
| Beta operations | `docs/beta/BETA_OPERATIONS.md` |
| Launch checklist | `docs/final/LAUNCH_CHECKLIST.md` |
| Database migrations | `supabase/migrations/` |

## License

Proprietary — All rights reserved.
