# Commons — Build Progress

## Session 1 (complete)

### Public booking flow
- `/[hostSlug]` — community page listing all upcoming active events
- `/[hostSlug]/[eventSlug]` — public booking page (no auth required)
  - Capacity fill bar, price badge (AED or FREE)
  - Booking form for available events; waitlist form when full
- `/[hostSlug]/[eventSlug]/confirmed` — confirmation page with event summary

### API routes
- `POST /api/book` — handles free event bookings + waitlist; upserts member record; sends confirmation email
- `POST /api/checkout` — creates Stripe Checkout session for paid events
- `POST /api/webhooks/stripe` — handles `checkout.session.completed`; creates booking + member records; sends email

### Foundation
- Supabase schema: `hosts`, `communities`, `events`, `bookings`, `members`
- RLS policies on all tables
- Seed data: `john-runclub` with two events (paid + free)
- `lib/supabase/client.ts`, `lib/supabase/server.ts`, `lib/stripe.ts`, `lib/resend.ts`
- `lib/utils.ts` — `formatPrice`, `formatDate`, `formatShortDate`, `formatTime`
- `types/database.ts` — full typed Database generic (Supabase v2.105 compatible)
- Shared UI: `Button`, `Card`, `Input`
- Tailwind config with brand tokens; DM Sans + Cormorant Garamond from Google Fonts

---

## Session 2 (complete)

### Auth
- `middleware.ts` — protects `/dashboard` and `/onboarding`; redirects unauthenticated users to `/login`
- `/login` — magic link login page (charcoal background, terracotta button)
- `/auth/callback` — exchanges code for session; creates `hosts` row on first login (id = auth UUID); routes to `/onboarding` or `/dashboard` based on `onboarding_complete`

### Onboarding
- `/onboarding` — 3-step client-side flow with progress indicator
  - Step 1: Community name, type, location, description, Instagram; slug auto-generated with editable preview
  - Step 2: First event (name, date, time, location, price in AED → stored as fils, capacity, recurrence)
  - Step 3: Review summary + "Launch my community" — inserts community + event, sets `onboarding_complete = true`, redirects to `/dashboard`

### Dashboard layout
- `app/dashboard/layout.tsx` — server component; fetches host + community; renders sidebar + content
- `components/dashboard/Sidebar.tsx` — client component; `usePathname` for active state; charcoal fixed sidebar

### Dashboard pages (all server components where possible)
- `/dashboard` — overview: 4 stat cards, quiet-member alert banner, next 3 events with fill bars, booking link panel with copy button, recent members table
- `/dashboard/events` — all events (upcoming first, then past); booked/capacity, revenue, status per event; link to public booking page
- `/dashboard/events/new` — client form; inserts event via browser Supabase client; redirects to events list
- `/dashboard/members` — 4 stat cards; full members table with status tags (At risk / VIP / Regular / New) computed from raw data
- `/dashboard/payments` — 3 stat cards (revenue this month, total revenue, avg per booking); transaction table with payment status badges
- `/dashboard/alerts` — 3 alert sections: quiet members (14+ days inactive), waitlist demand per event, new members this month

### Data layer
- `lib/queries.ts` — all dashboard Supabase queries as named functions; no N+1 queries; stats computed in memory from batched fetches
  - `getCommunityForHost`, `getDashboardOverview`, `getAllEventsWithStats`, `getAllMembers`, `computeMemberPageStats`, `getMemberStatusTag`, `getPaymentsData`, `getAlertsData`

---

## Known issues / limitations

1. **Single community per host** — the schema supports multiple communities but the dashboard assumes one. Queries use `.single()` on communities. Multi-community support would need routing changes.

2. **No Stripe Connect for hosts** — payments are collected but payout to hosts isn't wired up yet. `stripe_account_id` on `hosts` is always null. The "total revenue" figure on payments page is revenue Commons collected, not what the host has been paid out.

3. **Seed host can't log in** — the seed host row (`john@test.com`, id `a0000000-...`) has no corresponding Supabase Auth user. The public booking pages work, but `/dashboard` can't be accessed as this host. New hosts who sign up via magic link get their own row with id = auth UUID.

4. **No email confirmation on paid bookings in dev** — Resend calls fire from the webhook, which requires `stripe listen --forward-to localhost:3000/api/webhooks/stripe` to be running locally.

5. **No event editing** — events can be created but not edited or cancelled from the dashboard. The status field is in the DB but there's no UI to change it.

6. **Member status not persisted** — status tags (VIP, Regular, At risk, New) are computed in the UI from `total_bookings` and `last_attended`. The `status` column on the `members` table is never written by the dashboard.

7. **No pagination** — all queries fetch all rows. Will need pagination on members and transactions tables once volume grows.

---

## Session 3 — suggested scope

1. **Stripe Connect onboarding** — connect host Stripe Express accounts so payouts flow to them; add `/dashboard/connect-stripe` flow
2. **Event editing + cancellation** — edit event details, cancel with optional member notification email
3. **Reminder emails** — cron job or Supabase Edge Function to send day-before reminders; flip `reminder_sent = true`
4. **Host public profile page** (`/[hostSlug]`) — currently shows events but has no host branding; add cover photo, bio, social links
5. **Booking management** — host can view booking list per event, cancel individual bookings, manually add bookings
6. **Multi-community** — if a host has more than one community, add a switcher in the sidebar
