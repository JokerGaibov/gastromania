# Gastromania

Restaurant website with online reservations and delivery ordering, built for a real, operating restaurant. Not a template or a portfolio piece — staff rely on it for incoming orders and bookings.

**Status:** active development. Core layout and design system are in place; the operational backend (Supabase) is being built out section by section — see [`gastromania-spec.md`](./gastromania-spec.md) for the current scope and rollout stages, and [`main.md`](./main.md) for the full audit, changelog, and architectural decisions.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS 4 |
| Animation | Framer Motion |
| Backend | Supabase (Postgres, Auth, RLS, Edge Functions) |
| Deployment | Vercel |

No UI component library — components are custom-built.

## Features

**Shipped**
- Marketing site: hero, story, chef profile, signature dishes, gallery, contact
- Reservation form (front-end)

**In progress / planned**
- Supabase-backed data model: menu, promotions, reservations, orders, favorites, delivery settings (with row-level security)
- Customer accounts (`/account`) and admin panel (`/admin`)
- Delivery ordering with cart, pay-on-delivery at launch
- Kitchen notifications via Telegram bot (Supabase DB webhooks + Edge Functions)
- Stop-list (86'd items) toggle for the kitchen
- 152-FZ privacy policy and consent flow
- Yandex Metrica + Yandex Maps integration

## Getting Started

```bash
npm install
cp .env.example .env.local   # fill in Supabase project keys
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

> This project pins a Next.js version with breaking changes vs. older training data — see [`AGENTS.md`](./AGENTS.md) before making Next.js-specific changes.

## License

Proprietary — all rights reserved. This is a commercial project built for a client; the code is not licensed for reuse.
