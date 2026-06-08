# URL Shortener

A production-grade URL shortener built with Next.js 16 (App Router), Clerk authentication, Drizzle ORM, and Neon serverless PostgreSQL. Short links are 7-character alphanumeric codes with real-time click analytics.

## Features

- **Shorten URLs** — generate 7-character short codes with collision retries
- **Dashboard** — view, copy, and delete all your short links with live click counts
- **Click analytics** — `/analytics` overview of every shortcode; `/analytics/[shortCode]` detail page with stat cards (total, today, this week, first/last click, avg daily) and a time-of-day pie chart
- **Auth** — Clerk v7 sign-in / sign-up with protected routes via middleware
- **Dark mode** — system-aware theme via `next-themes`

## Stack

| Layer     | Technology                  |
| --------- | --------------------------- |
| Framework | Next.js 16 (App Router)     |
| Language  | TypeScript 5                |
| Styling   | Tailwind CSS v4 + shadcn/ui |
| Icons     | lucide-react                |
| Charts    | shadcn chart (recharts)     |
| Auth      | Clerk `@clerk/nextjs` v7    |
| ORM       | Drizzle ORM + drizzle-kit   |
| Database  | Neon serverless PostgreSQL  |

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env` and fill in the values:

```env
DATABASE_URL=                              # Neon connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

### 3. Run database migrations

```bash
npx drizzle-kit migrate
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available Commands

```bash
npm run dev       # Start development server
npm run build     # Production build
npm run lint      # ESLint
npx drizzle-kit generate   # Generate migrations from schema changes
npx drizzle-kit migrate    # Apply pending migrations
npx drizzle-kit studio     # Open Drizzle Studio (DB GUI)
```

## Project Structure

```
app/
  page.tsx                    # Landing page
  layout.tsx                  # Root layout — Clerk, theme, nav
  dashboard/                  # Protected — manage short links
  analytics/                  # Protected — click analytics overview
  analytics/[shortCode]/      # Protected — analytics detail for one shortcode
  sign-in/[[...sign-in]]/     # Clerk sign-in
  sign-up/[[...sign-up]]/     # Clerk sign-up
  [shortCode]/route.ts        # Public HTTP 302 redirect handler
  api/urls/route.ts           # GET list / POST create
  api/urls/[shortCode]/route.ts  # DELETE
components/
  time-of-day-chart.tsx       # Client component — recharts pie chart
  ui/                         # shadcn/ui components
data/
  urls.ts                     # Repository: URL queries
  clicks.ts                   # Repository: click tracking + analytics queries
db/
  schema.ts                   # Drizzle table definitions (urls + clicks)
  drizzle.ts                  # Single db client instance
lib/
  services/url.service.ts     # Business logic (create, delete, resolve)
  errors/                     # AppError class + handleRouteError()
  schemas/url.schema.ts       # Zod validation schemas
  response.ts                 # ok() / fail() API response factories
proxy.ts                      # Clerk middleware — route protection
```

## Domain Rules

- Short codes are exactly **7 alphanumeric characters** (a-z, 0-9).
- Redirects use **HTTP 302** with `Cache-Control: no-store` — ensures every click hits the server for accurate tracking.
- Each redirect fires a click event insert (fire-and-forget, does not block the redirect).
- Short code collisions trigger a regeneration up to **5 attempts** before failing.
- All user-scoped queries enforce a `WHERE userId = ?` filter in the repository layer.
