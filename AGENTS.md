# URL Shortener — Agent Guidelines

## Stack

| Layer         | Technology                                                         |
| ------------- | ------------------------------------------------------------------ |
| Framework     | Next.js 16 (App Router) — **breaking changes from older versions** |
| Language      | TypeScript 5                                                       |
| Styling       | Tailwind CSS v4 (PostCSS plugin, no `tailwind.config.*`)           |
| UI Components | shadcn/ui via `components/ui/`, base-ui (`@base-ui/react`)         |
| Icons         | lucide-react                                                       |
| Auth          | Clerk (`@clerk/nextjs` v7)                                         |
| ORM           | Drizzle ORM + drizzle-kit                                          |
| Database      | Neon serverless PostgreSQL (`@neondatabase/serverless`)            |

## Project Structure

```
app/                          # Next.js App Router pages and layouts
app/dashboard/                # Protected route — requires authentication
app/analytics/                # Protected route — per-shortcode click analytics overview
app/analytics/[shortCode]/    # Protected route — detailed analytics for a single shortcode
app/sign-in/[[...sign-in]]/   # Clerk sign-in UI (catch-all, required for multi-step flow)
app/sign-up/[[...sign-up]]/   # Clerk sign-up UI (catch-all, required for multi-step flow)
components/ui/                # shadcn/ui components — add via `npx shadcn add <component>`
components/time-of-day-chart.tsx  # Client component — recharts pie chart for click time distribution
data/                         # Server-side data fetching functions (Drizzle queries)
db/                           # Database client (drizzle.ts) and schema files
lib/                          # Shared utilities (utils.ts, etc.)
migrations/                   # Drizzle migration output (auto-generated, do not edit)
.github/instructions/         # GitHub Copilot instruction files (LLM context — see below)
proxy.ts                      # Clerk middleware (matched routes defined in config export)
drizzle.config.ts             # Drizzle Kit config — schema at db/schema.ts, output at migrations/
```

## Build & Dev Commands

```bash
npm run dev       # Start dev server
npm run build     # Production build
npm run lint      # ESLint
npx drizzle-kit generate   # Generate migrations from schema
npx drizzle-kit migrate    # Apply migrations to database
npx drizzle-kit studio     # Open Drizzle Studio (DB GUI)
```

Environment: copy `.env.example` to `.env` and fill in the following variables:

```
DATABASE_URL=              # Neon connection string
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

Note: `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` are deprecated in Clerk v7 — use the `FORCE_REDIRECT_URL` variants above.

## Conventions

- **App Router only** — no `pages/` directory. Use Server Components by default; add `"use client"` only when necessary.
- **Next.js 16** — APIs differ from older versions. Key patterns to follow:
  - Route handlers: `app/api/*/route.ts` exporting named `GET`/`POST`/etc. functions.
  - Data fetching: use `async` Server Components; call `fetch` or ORM queries directly — no `getServerSideProps`.
  - Redirects: use `redirect()` from `next/navigation` in Server Components, or return a `Response` with `Location` header in route handlers.
  - Middleware: export a `middleware` function and a `config.matcher` from `proxy.ts`.
  - Params in dynamic routes: `params` is now a Promise — `const { slug } = await params`.
- **Tailwind v4** — no `tailwind.config.ts`. Customize via CSS variables in `app/globals.css`. Use the `tw-animate-css` package for animations.
- **Clerk v7** — uses `@clerk/nextjs` v7 server APIs. `auth()` is now async. Use `<Show when="signed-in">` / `<Show when="signed-out">` for conditional UI (see `app/layout.tsx`). Always pass `forceRedirectUrl="/dashboard"` to `<SignInButton>` / `<SignUpButton>` — without it Clerk redirects back to the page the button was clicked on. See [.github/instructions/auth.instructions.md](.github/instructions/auth.instructions.md) for full conventions.
- **Drizzle schema** — define tables in `db/schema.ts`. Run `npx drizzle-kit generate` after any schema change; never edit `migrations/` by hand.
- **shadcn components** — install via CLI (`npx shadcn add`), not manually. Components live in `components/ui/`.
- **Database client** — import `db` from `db/drizzle.ts`. Do not create additional Drizzle instances.
- **Data fetching** — all database query functions live in `/data`. See [.github/instructions/data-fetching.instructions.md](.github/instructions/data-fetching.instructions.md) for full rules: server-side only, auth validation before queries, Drizzle ORM exclusively.

## Domain Rules

- Short codes are 7-character alphanumeric strings (e.g. `abc1234`).
- Redirects use HTTP **302** (Temporary Redirect) with `Cache-Control: no-store, no-cache, must-revalidate` so browsers always hit the server on every click — this is required for accurate real-time click tracking.
- Each redirect is recorded as a click event in the `clicks` table (fire-and-forget; does not block the redirect response).
- Short codes must be unique; regenerate on collision (max 5 attempts).
- The `urls` table stores `id`, `shortCode`, `originalUrl`, `userId`, and `createdAt`.
- The `clicks` table stores `id`, `urlId` (FK → `urls.id`, cascade delete), and `createdAt` (indexed for time-series queries).
- Analytics are available at `/analytics` (overview, all shortcodes) and `/analytics/[shortCode]` (detail: total clicks, today, this week, first/last click, avg daily, time-of-day distribution pie chart).

## Mandatory Pre-Response Loading

Before responding to ANY request — planning, coding, answering questions, or reviewing code — you MUST load and read:

1. This file (`AGENTS.md`) in full.
2. **Every file inside `.github/instructions/`.** Read all of them and apply whichever content is relevant to the current request.

Do not skip this step. These files are the single source of truth for this project.

## Instructions Folder

All LLM instruction files live in `.github/instructions/` following the GitHub Copilot standard (YAML frontmatter with `description` and `applyTo`). Read all files in `.github/instructions/` before responding — do not cherry-pick; load the whole folder and filter by relevance.

- [.github/instructions/auth.instructions.md](.github/instructions/auth.instructions.md) — Clerk v7 auth conventions: middleware route protection, sign-in/sign-up pages, conditional UI, and anti-patterns
- [.github/instructions/ui-conventions.instructions.md](.github/instructions/ui-conventions.instructions.md) — UI rules: shadcn/ui + Tailwind CSS only, full color-token reference (light & dark), button variants, responsive patterns, and prohibited dependencies
- [.github/instructions/data-fetching.instructions.md](.github/instructions/data-fetching.instructions.md) — data fetching strategy: `/data` directory convention, server-side only, Drizzle ORM, auth validation before queries, best practices
- [.github/instructions/architecture.instructions.md](.github/instructions/architecture.instructions.md) — production MVC architecture: layer responsibilities (MODEL/REPOSITORY/SERVICE/CONTROLLER/ROUTE), uniform ApiResponse format, global error handler, serialization/deserialization conventions, and anti-patterns
