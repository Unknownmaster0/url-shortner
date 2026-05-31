# Future Changes Backlog

<!-- =========================================================
  SCHEMA (every item MUST include all fields below)
  ─────────────────────────────────────────────────────────────
  id:             CHG-YYYY-MM-NNN  (unique, sequential per month)
  title:          Short, action-oriented label (≤ 10 words)
  severity:       CRITICAL | MEDIUM | LOW
  status:         open | in-progress | resolved
  added:          YYYY-MM-DD (date first identified)
  affected-files: comma-separated workspace-relative paths
  description:    What is wrong and why it matters
  recommended-fix: Concrete steps to resolve the issue
  ========================================================= -->

---

## CRITICAL

### CHG-2026-05-002

```
id:             CHG-2026-05-002
title:          PII and user IDs hardcoded in seed.ts
severity:       CRITICAL
status:         open
added:          2026-05-31
affected-files: db/seed.ts
description:    db/seed.ts contains hardcoded Clerk user IDs (e.g.
                "user_3EFlRXJEEEI3vGHDLiauoP0dZEo") and real email addresses in
                comments (e.g. "trysingh716@gmail.com"). If this repository is
                pushed to a public remote, those identifiers become publicly
                visible — violating OWASP A02:2021 (Sensitive Data Exposure).
                Clerk user IDs, combined with the matching email comments, enable
                account enumeration and reveal which shortcodes belong to which user.
recommended-fix:
  1. Remove all email address comments from seed.ts immediately.
  2. Replace the hardcoded Clerk user IDs with placeholder strings (e.g.
     "user_PLACEHOLDER_1") or, better, read them from environment variables
     (SEED_USER_ID_1, SEED_USER_ID_2, SEED_USER_ID_3).
  3. Add db/seed.ts to .gitignore (or a separate secrets file) if real IDs
     must be kept locally, and never commit them to version control.
```

---

## MEDIUM

### CHG-2026-05-001

```
id:             CHG-2026-05-001
title:          Click count not updated in real-time after redirect
severity:       MEDIUM
status:         open
added:          2026-05-31
affected-files: app/dashboard/page.tsx, app/[shortCode]/route.ts, data/clicks.ts
description:    After a short URL is clicked and the redirect fires, the click count
                displayed on the dashboard does not update until the user manually
                refreshes the page. The redirect route records the click event
                fire-and-forget, but the dashboard renders a static Server Component
                with no revalidation or polling mechanism, so the stale count persists.
recommended-fix:
  1. Add router.refresh() on the client dashboard after any mutation, or
  2. Convert the click-count display to a Client Component that polls /api/urls
     on a short interval (e.g. every 10 s with SWR/React Query), or
  3. Use Next.js revalidatePath('/dashboard') inside the redirect route handler
     after recording the click so ISR clears the cache on next request.
```

### CHG-2026-05-003

```
id:             CHG-2026-05-003
title:          Icon-only buttons missing aria-label in link-row-actions
severity:       MEDIUM
status:         open
added:          2026-05-31
affected-files: components/link-row-actions.tsx
description:    The Copy and Delete buttons in LinkRowActions render only an icon
                with no visible text. They use the HTML `title` attribute but do NOT
                set `aria-label`. Screen readers announce the button role without any
                name, making the action unidentifiable for assistive technology users.
                The UI conventions instruction requires interactive elements to be
                accessible; WCAG 2.1 SC 4.1.2 mandates all interactive UI components
                have an accessible name.
recommended-fix:
  1. Add aria-label="Copy short link" to the Copy button.
  2. Add aria-label="Delete short link" to the Delete button.
  3. The existing title attributes can remain (tooltip on hover) — they are
     supplementary but not a substitute for aria-label.
```

### CHG-2026-05-004

```
id:             CHG-2026-05-004
title:          Unsafe type assertions on fetch responses in client components
severity:       MEDIUM
status:         open
added:          2026-05-31
affected-files: components/create-link-modal.tsx, components/link-row-actions.tsx
description:    Both client components cast the raw fetch response body using
                `as ApiResponse<T>` (e.g. `(await res.json()) as ApiResponse<CreatedUrl>`).
                This is an unchecked type assertion — if the server returns an
                unexpected shape (e.g. a Next.js error page HTML response, or a
                network proxy error), the assertion is silently wrong and downstream
                property access (json.success, json.error.message) can throw at
                runtime. Violates TypeScript / Type Safety audit dimension: "unsafe
                type assertions without validation".
recommended-fix:
  1. Parse the response body with a Zod schema that matches ApiResponse<T> before
     accessing its fields, e.g.:
       const ApiResponseSchema = z.discriminatedUnion('success', [
         z.object({ success: z.literal(true), data: CreatedUrlSchema }),
         z.object({ success: z.literal(false), error: z.object({ code: z.string(), message: z.string() }) }),
       ])
       const json = ApiResponseSchema.parse(await res.json())
  2. Alternatively wrap json() access in a try/catch with a fallback error message
     so an unexpected response shape never reaches the type-dependent property access.
```

---

## LOW

### CHG-2026-05-005

```
id:             CHG-2026-05-005
title:          Marketing copy states HTTP 308 but redirect uses 302
severity:       LOW
status:         open
added:          2026-05-31
affected-files: app/page.tsx
description:    The "Permanent Redirects" feature card in the landing page reads:
                "Uses HTTP 308 redirects to preserve the request method and stay
                SEO-friendly." The actual redirect implementation in
                app/[shortCode]/route.ts correctly uses HTTP 302 (Temporary Redirect)
                as required by AGENTS.md domain rules. The copy is factually incorrect
                and misleads users about the redirect semantics. It also contradicts
                the documented domain rule: "Redirects use HTTP 302 (Temporary
                Redirect) … so browsers always hit the server on every click —
                required for accurate real-time click tracking."
recommended-fix:
  1. Update the feature card description to accurately reflect HTTP 302 behaviour,
     e.g. "Uses HTTP 302 (Temporary Redirect) so every click hits the server for
     accurate real-time analytics."
  2. Update the feature title from "Permanent Redirects" to something like
     "Real-time Click Tracking" to better reflect the actual benefit.
```

### CHG-2026-05-006

```
id:             CHG-2026-05-006
title:          seed.ts creates a duplicate Drizzle client instance
severity:       LOW
status:         open
added:          2026-05-31
affected-files: db/seed.ts
description:    db/seed.ts instantiates its own Drizzle client:
                  const db = drizzle(process.env.DATABASE_URL!)
                This violates the data-fetching instruction: "Use Drizzle ORM
                exclusively — import db from db/drizzle.ts. Do NOT create additional
                Drizzle instances anywhere in the codebase." Although seed.ts is a
                development-only script and does not affect production, it sets a
                precedent that bypasses the single-instance convention and could
                cause connection issues if the pattern is copied elsewhere.
recommended-fix:
  1. Import the shared db client: import { db } from './drizzle'
  2. Remove the local drizzle() instantiation and the dotenv config() call
     (the shared client already handles env loading).
```

### CHG-2026-05-007

```
id:             CHG-2026-05-007
title:          Missing composite index on clicks (urlId, createdAt)
severity:       LOW
status:         open
added:          2026-05-31
affected-files: db/schema.ts, migrations/
description:    getClickAnalyticsForShortCode (data/clicks.ts) executes queries with
                compound WHERE clauses: eq(clicks.urlId, url.id) AND
                gte(clicks.createdAt, oneDayAgo/oneWeekAgo). The schema defines
                separate single-column indexes (clicks_url_id_idx, clicks_created_at_idx)
                but no composite index. The DB planner can only use one index per query;
                for a high-click URL the full url-scoped scan becomes expensive as
                click volume grows. Per the Performance audit dimension: "Missing DB
                indexes — columns used in WHERE / ORDER BY / FK lookups."
recommended-fix:
  1. Add a composite index to the clicks table in db/schema.ts:
       urlIdCreatedAtIdx: index("clicks_url_id_created_at_idx")
         .on(table.urlId, table.createdAt),
  2. Run: npx drizzle-kit generate && npx drizzle-kit migrate
```

### CHG-2026-05-008

```
id:             CHG-2026-05-008
title:          Hardcoded OKLCH values in time-of-day-chart instead of CSS tokens
severity:       LOW
status:         open
added:          2026-05-31
affected-files: components/time-of-day-chart.tsx
description:    The chartConfig object defines chart segment colors as literal OKLCH
                strings (e.g. 'oklch(0.65 0.15 85)'). globals.css already defines
                --chart-1 through --chart-5 CSS custom properties for exactly this
                purpose. Hardcoded values will not update when the theme is changed
                and bypass the token system. The UI conventions instruction states:
                "Hard-coded hex/RGB colours instead of CSS variable tokens" is a
                violation — this equally applies to literal OKLCH strings.
recommended-fix:
  1. Reference CSS variables in chartConfig, e.g.:
       morning:   { color: 'var(--chart-1)' }
       afternoon: { color: 'var(--chart-2)' }
       evening:   { color: 'var(--chart-3)' }
       night:     { color: 'var(--chart-4)' }
  2. Ensure --chart-1 through --chart-4 are defined with appropriate OKLCH values
     in both :root and .dark sections of globals.css.
```

### CHG-2026-05-009

```
id:             CHG-2026-05-009
title:          Raw shortCode URL param unvalidated in analytics detail page
severity:       LOW
status:         open
added:          2026-05-31
affected-files: app/analytics/[shortCode]/page.tsx
description:    The analytics detail page destructures shortCode from the awaited
                params and passes it directly to getClickAnalyticsForShortCode without
                first validating it against ShortCodeParamSchema (the Zod schema
                defined in lib/schemas/url.schema.ts). Any URL-safe string — including
                very long strings, Unicode, or characters outside [a-z0-9] — will reach
                the data layer. The Drizzle query is parameterized so SQL injection is
                not possible, but the absence of boundary validation is inconsistent
                with how the redirect route and API routes handle the same param.
                Per the Error Handling audit dimension: "Missing validation on
                user-supplied input (URL format, short code format)."
recommended-fix:
  1. Add Zod validation immediately after awaiting params, mirroring the pattern
     used in app/[shortCode]/route.ts:
       const parsed = ShortCodeParamSchema.safeParse({ shortCode })
       if (!parsed.success) notFound()
  2. Use parsed.data.shortCode in the getClickAnalyticsForShortCode call.
```

### CHG-2026-05-010

```
id:             CHG-2026-05-010
title:          Four sequential DB queries in analytics detail data function
severity:       LOW
status:         open
added:          2026-05-31
affected-files: data/clicks.ts
description:    getClickAnalyticsForShortCode executes 4 separate awaited DB queries
                sequentially: (1) url ownership check, (2) aggregate stats, (3) clicks
                today, (4) clicks this week, (5) time-of-day distribution. Queries 2–5
                are independent and could be parallelised with Promise.all after the
                ownership check completes. Under the Performance audit dimension:
                "N+1 query patterns — related rows fetched with per-row queries."
                Each analytics page load currently pays 5× the network round-trip
                latency to Neon.
recommended-fix:
  1. After confirming url ownership (query 1), run the remaining 4 queries in
     parallel:
       const [stats, todayStats, weekStats, timeOfDayRows] = await Promise.all([
         db.select(...).from(clicks).where(eq(clicks.urlId, url.id)),
         db.select(...).from(clicks).where(and(eq(...), gte(clicks.createdAt, oneDayAgo))),
         db.select(...).from(clicks).where(and(eq(...), gte(clicks.createdAt, oneWeekAgo))),
         db.select(...).from(clicks).where(eq(clicks.urlId, url.id)).groupBy(...),
       ])
  2. This reduces total query latency from ~5× round-trip to ~2× (ownership + parallel batch).
```
