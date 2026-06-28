# Yogstra — Full Project Description

**Production URL:** https://yogstra.vercel.app  
**Repository:** https://github.com/Nagashreeshyl/Yogstra  
**Version:** 0.0.0 (active development)

---

## 1. Overview

**Yogstra** is an online yoga coaching marketplace. It connects **students** who want to learn yoga with **verified teachers** who offer live online classes, messaging, scheduling, and community engagement. An **admin** role manages the platform: approving teachers, moderating content, handling payouts, and configuring marketplace settings.

The product is built as a **Progressive Web App (PWA)** — installable on mobile and desktop — with a warm cream/teal design system, Instagram-style community feed, and WhatsApp-inspired messaging.

---

## 2. User Roles

| Role | Description |
|------|-------------|
| **Guest (logged out)** | Browse explore feed, find teachers, view public profiles, read legal pages. Prompted to sign up for actions that require auth. |
| **Student** | Book teachers, pay for classes, join live sessions, message teachers, post in community, manage profile and settings. |
| **Teacher** | Manage students, schedule, live classes, earnings, UPI payout details, coupons, notifications, community feedback on student posts. Requires admin verification before full dashboard access. |
| **Admin** | Full platform control: users, bookings, schedules, chats, payouts, categories, community moderation, platform commission settings. |

---

## 3. Tech Stack

### Frontend
- **React 19** + **TypeScript**
- **Vite 8** (build tool)
- **React Router 7** (routing)
- **Tailwind CSS 4** (styling)
- **Lucide React** (icons)
- **react-image-crop** (post/profile image cropping)

### Backend & Data
- **Supabase** — PostgreSQL database, Auth, Row Level Security (RLS), Realtime subscriptions, Storage (avatars, post media)
- **Vercel Serverless Functions** — API routes in `/api` (Node.js)

### Third-Party Services
- **Razorpay** — student payments, order creation, webhook fulfillment, optional Route transfers to teachers
- **LiveKit** — live video classes and direct message video calls
- **Vercel** — hosting, CI/CD, production deployment

### PWA
- Web manifest, service worker, install prompts (banner, header, sidebar)
- Safe-area support for notched mobile devices

---

## 4. Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Browser (PWA)                           │
│  React SPA ── Supabase Client (auth, DB, storage, realtime) │
└──────────────────────────┬──────────────────────────────────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
   ┌──────────┐    ┌─────────────┐   ┌─────────────┐
   │ Supabase │    │ Vercel API  │   │  LiveKit    │
   │ Postgres │    │  /api/*     │   │  Cloud      │
   │ Auth RLS │    │             │   │             │
   │ Storage  │    │ Razorpay    │   │ Video rooms │
   │ Realtime │    │ LiveKit tok │   │             │
   └──────────┘    └─────────────┘   └─────────────┘
```

### Client (`/src`)
- **Pages** — route-level views per role (public, student, teacher, admin)
- **Components** — UI, layout, chat, classes, community, admin
- **Services** — Supabase data access (teachers, bookings, posts, chat, payouts, etc.)
- **Context** — global app state (auth, user, categories, filters)
- **Hooks** — async data, live sync, PWA install, message notifications

### Server (`/api` + `/server`)
- **`api/razorpay-order.ts`** — create payment order with server-side price validation
- **`api/razorpay-fulfill.ts`** — verify payment signature and record class order
- **`api/razorpay-webhook.ts`** — HMAC-verified webhook for payment events
- **`api/livekit-token.ts`** — issue LiveKit room tokens for class/video calls
- **`api/teacher-payout-setup.ts`** — optional Razorpay Route linked account (when enabled)
- **`server/`** — shared helpers: Supabase admin client, Razorpay client, API security (CORS, rate limits, auth), input validation

### Database (`/supabase`)
- SQL migration files run manually in Supabase SQL Editor
- Core schema in `schema.sql`; feature migrations added incrementally

---

## 5. Features by Area

### 5.1 Public / Explore
- **Explore page** — search teachers, browse yoga styles (categories), community feed preview, featured teachers
- **Find Teachers** — filterable teacher directory (category, price, experience, location, rating)
- **Teacher profiles** — bio, pricing, specializations, book/pay flow entry
- **Student profiles** — public view of student info and posts
- **Community feed** — Instagram-style posts (image/video + caption)
- **Competitions & Shop** — placeholder/teaser pages (marked v2)
- **Legal pages** — Privacy Policy, Terms of Service, Refund Policy
- **Mobile-responsive** — slide-out navigation drawer, centered feed layout

### 5.2 Authentication
- Email/password via Supabase Auth
- Student signup and login
- Teacher registration (multi-step), login, pending approval state
- Admin account created in Supabase Dashboard + `setup-admin.sql`
- Role-based routing and protected routes
- Password visibility toggle on auth forms

### 5.3 Student Dashboard
- Explore, teachers, community, messages, live classes, settings
- **Book a teacher** — monthly subscription-style booking
- **Pay via Razorpay** — checkout for class packages (1:1 / group, week / month)
- **Live classes** — join scheduled sessions via LiveKit
- **Direct messages** — WhatsApp-style chat with teachers
- **Direct video calls** — in-chat video calling (LiveKit)
- **Community** — create posts with image crop (4:5) or video
- **Profile settings** — avatar, personal details

### 5.4 Teacher Dashboard
- Dashboard overview, my students, schedule calendar, classes (live rooms)
- **Schedule management** — 1:1 and group sessions; schedule change requests
- **Community** — comment on student posts (teacher feedback)
- **Messages & video calls** with students
- **Coupons** — create and deliver discount coupons to students
- **Notifications** — booking and platform events
- **Earnings** — payment history (gross, commission, net)
- **Payouts (Settings)** — UPI ID for manual admin payouts (bank/Razorpay Route UI hidden; manual UPI flow active)
- **Profile settings** — avatar, cover photo, bio, pricing (Indian locale fee formatting), certifications, specializations

### 5.5 Admin Dashboard
- **Dashboard** — platform overview
- **Teachers** — approve, reject, verify, remove teachers
- **Students** — list and manage students
- **Community** — create posts, pin to top / normal visibility, remove posts
- **Bookings** — view all bookings
- **Schedules** — view all scheduled classes
- **Chats** — monitor chat threads and reports
- **Payouts** — view teacher earnings, UPI ID, generate UPI QR, mark as paid
- **Categories** — manage yoga style categories
- **Settings** — platform commission percentage
- Return to public site + logout from admin sidebar

### 5.6 Payments & Payouts
- Students pay through **Razorpay Checkout**
- Server validates prices against database (anti-tampering)
- **Commission split** — configurable platform fee (default 10%) stored in `platform_settings`
- **Payout records** created on successful payment
- **Teacher payout flow (current):**
  1. Teacher saves **UPI ID** in Settings → Payouts
  2. Admin sees pending payout on Admin → Payouts
  3. Admin pays manually via **UPI QR code** (GPay, PhonePe, etc.)
  4. Admin marks payout as **Paid**
- Razorpay Route (automatic bank transfer) is optional/future — not required for current manual UPI flow

### 5.7 Live Video
- **Class sessions** — teacher starts class; students with active booking join
- **Direct video calls** — from DM chat, WhatsApp-style UI with controls
- LiveKit tokens issued server-side; rooms scoped per session/call

### 5.8 Messaging
- **Chat threads** between student and teacher (per booking relationship)
- Real-time messages via Supabase Realtime
- Read receipts, thread settings, chat reports
- Message sound notifications
- Admin can view threads and moderation reports

### 5.9 Security (Production Hardening)
- API routes require Bearer token auth where applicable
- Razorpay webhook HMAC verification
- Rate limiting and security headers on API routes (`server/apiSecurity.ts`)
- Row Level Security on all Supabase tables
- Sensitive teacher bank/UPI data in `teacher_payout_private` table
- Input sanitization and upload validation
- Service role key used only on server (Vercel env), never exposed to client

---

## 6. Database (Key Tables)

| Table | Purpose |
|-------|---------|
| `profiles` | All users — role, name, phone, location, avatar |
| `teacher_profiles` | Teacher bio, fees, status, specializations, cover |
| `teacher_payout_private` | Bank/UPI payout details (RLS restricted) |
| `categories` | Yoga styles for browse/filter |
| `bookings` | Student–teacher subscriptions |
| `schedules` | Class schedule entries |
| `class_sessions` | Live class room sessions |
| `class_orders` | Paid class purchases (Razorpay) |
| `posts` | Community posts (`pinned` for admin pin-to-top) |
| `comments` | Comments on posts |
| `chat_threads` | DM conversation threads |
| `direct_messages` | Chat messages |
| `direct_video_calls` | Video call session records |
| `payouts` | Teacher payout ledger |
| `platform_settings` | Commission % and platform config |
| `teacher_coupons` / `coupon_deliveries` | Discount coupons |
| `teacher_notifications` | Teacher alerts |
| `schedule_change_requests` | Schedule change workflow |
| `chat_reports` | Reported chat content |

**Storage buckets:** `avatars`, `post-media`

---

## 7. API Routes (Vercel)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/razorpay-order` | POST | Create Razorpay order |
| `/api/razorpay-fulfill` | POST | Fulfill payment after checkout |
| `/api/razorpay-webhook` | POST | Razorpay webhook handler |
| `/api/livekit-token` | POST | LiveKit access token |
| `/api/teacher-payout-setup` | POST | Razorpay linked account (optional) |

Configured in `vercel.json` with `server/**` bundled into functions.

---

## 8. Environment Variables

See `.env.example` for the full list.

| Variable | Where | Purpose |
|----------|-------|---------|
| `VITE_SUPABASE_URL` | Client | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Server (Vercel) | Admin DB access for webhooks/API |
| `VITE_RAZORPAY_KEY_ID` | Client | Razorpay checkout |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Server | Razorpay API |
| `RAZORPAY_WEBHOOK_SECRET` | Server | Webhook verification |
| `LIVEKIT_URL` / `VITE_LIVEKIT_URL` | Both | LiveKit WebSocket URL |
| `LIVEKIT_API_KEY` / `LIVEKIT_API_SECRET` | Server | LiveKit token generation |

**Local:** copy `.env.example` → `.env.local`  
**Production:** set in Vercel project → Settings → Environment Variables

---

## 9. Project Structure

```
Yogstra/
├── api/                    # Vercel serverless API routes
├── server/                 # Shared server utilities
├── src/
│   ├── components/         # UI, layout, chat, admin, community, etc.
│   ├── context/            # React context (AppContext)
│   ├── hooks/              # Custom hooks
│   ├── lib/                # Supabase client, constants
│   ├── pages/              # Route pages (public, student, teacher, admin, legal)
│   ├── services/           # Data layer (Supabase queries)
│   ├── types/              # TypeScript types
│   └── utils/              # Mappers, formatters, sanitize, UPI QR, etc.
├── supabase/               # SQL migrations and utilities
├── public/                 # Static assets, PWA manifest, service worker
├── vercel.json             # Vercel config, headers, API functions
├── vite.config.ts
├── package.json
└── PROJECT_DESCRIPTION.md  # This file
```

---

## 10. SQL Setup (Supabase)

Run migrations in **Supabase Dashboard → SQL Editor** in roughly this order:

1. `schema.sql` — core tables, RLS, storage buckets
2. `auth-fix.sql` — auth/profile triggers if needed
3. `setup-admin.sql` — grant admin role (after creating admin user in Auth)
4. Feature migrations as needed:
   - `setup-messaging.sql`, `chat-*.sql`
   - `class-sessions.sql`, `direct-video-calls.sql`
   - `marketplace-payouts.sql`, `security-hardening.sql`, `teacher-upi-payouts.sql`
   - `teacher-coupons.sql`, `teacher-notifications.sql`, `schedule-change-requests.sql`
   - `admin-community-posts.sql` — pin-to-top for posts
   - `live-sync.sql` — Realtime publication
5. **`reset-all-data.sql`** — wipe all data except one admin (for testing)

---

## 11. Development

```bash
# Install dependencies
npm install

# Local dev server
npm run dev

# Clean Vite cache + dev
npm run dev:clean

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

---

## 12. Deployment

- **Hosting:** Vercel (connected to GitHub `main` branch)
- **Deploy manually:** `vercel --prod`
- **Production URL:** https://yogstra.vercel.app
- SPA routing: all non-`/api/*` routes rewrite to `index.html` (`vercel.json`)

---

## 13. Design System

| Token | Value | Usage |
|-------|-------|-------|
| Cream | `#f5ecd7` | Backgrounds |
| Charcoal | `#1c1c1c` | Text, sidebar |
| Teal | `#5bb8c4` | Primary accent, CTAs |
| Playfair Display | Serif | Headings |
| Inter | Sans | Body text |

Surfaces use layered cream tones (`surface`, `surface-elevated`, `surface-inset`) for depth on main content areas.

---

## 14. Testing Checklist (Full Flow)

Use `reset-all-data.sql` for a clean slate (keeps admin only), then:

- [ ] Student signup and login
- [ ] Teacher registration → admin approval → teacher login
- [ ] Student finds teacher, books, pays via Razorpay (test mode)
- [ ] Teacher schedules class; student joins live class (LiveKit)
- [ ] Student ↔ teacher messaging and video call
- [ ] Student community post; teacher comment
- [ ] Admin creates pinned community post
- [ ] Teacher saves UPI ID; admin pays via QR and marks payout paid
- [ ] Teacher coupons delivery and redemption
- [ ] Mobile explore page (logged out)
- [ ] PWA install prompt

---

## 15. Roadmap / Placeholder Features

- **Competitions** — UI teaser only (v2)
- **Shop** — UI teaser only (v2)
- **Razorpay Route** — automatic bank transfers (optional; manual UPI payouts active)
- **Teaching mode selector** — removed from registration (online-only platform)

---

## 16. Contact & Ownership

- **Project:** Yogstra  
- **Organization:** Nagashreeshyl's Org (Supabase)  
- **GitHub:** Nagashreeshyl/Yogstra  
- **Admin email (default):** nagashreeshyl@gmail.com  

---

*Last updated: June 2026*
