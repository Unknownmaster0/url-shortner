---
description: Production MVC architecture — layer responsibilities, directory layout, uniform response/error format, global error handler, and serialization conventions.
applyTo: "**/*.ts, **/*.tsx"
---

# Application Architecture

This project follows a strict layered MVC architecture mapped onto Next.js 16 App Router. Each layer has a single responsibility and must not cross layer boundaries directly. See `AGENTS.md` for stack details.

## Layer Map

| Layer          | Directory            | Responsibility                                                                 |
| -------------- | -------------------- | ------------------------------------------------------------------------------ |
| **MODEL**      | `db/schema.ts`       | Drizzle table definitions; inferred TypeScript types only                      |
| **REPOSITORY** | `data/*.ts`          | Raw DB queries via Drizzle; no business logic; always auth-scoped              |
| **SERVICE**    | `lib/services/*.ts`  | Business logic, orchestration; calls repositories; throws `AppError`           |
| **CONTROLLER** | `app/api/*/route.ts` | Parse + validate request, call service, format `ApiResponse`; never touches DB |
| **ROUTE**      | `app/api/*/route.ts` | Next.js file-system routing — one file per resource under `app/api/`           |

## Target Directory Structure

```
app/api/
  urls/
    route.ts          # GET (list), POST (create)
  urls/[shortCode]/
    route.ts          # DELETE
app/[shortCode]/
  route.ts            # Public 302 redirect handler (lives at root, not under /api/)
                      # Uses no-cache headers so every request hits the server for accurate click tracking
app/analytics/
  page.tsx            # Protected — overview of all shortcodes with total click counts
  [shortCode]/
    page.tsx          # Protected — detailed analytics: stat cards + time-of-day pie chart
lib/
  api/
    with-auth.ts      # withAuth() — route-handler wrapper that enforces authentication
  services/
    url.service.ts    # URL business logic (create, delete, redirect)
  errors/
    AppError.ts       # Custom error class with code + HTTP status
    handler.ts        # handleRouteError() — maps errors to ApiResponse
  response.ts         # ok() / fail() — response factory functions
  schemas/
    url.schema.ts     # Zod schemas for request bodies/params
data/
  urls.ts             # Repository: URL DB queries (authorization via userId)
  clicks.ts           # Repository: click tracking — recordClick(), getClickCountsByUrlIds(),
                      #   getClickCountsForUser(), getClickAnalyticsForShortCode()
db/
  schema.ts           # Model: Drizzle table + index definitions
  drizzle.ts          # Single db client instance
proxy.ts              # Clerk middleware — primary authentication gate
```

## Uniform Response Format

Every API route MUST return this shape — no exceptions.

```typescript
// lib/response.ts
export type ApiSuccess<T> = { success: true; data: T };
export type ApiError = {
  success: false;
  error: { code: string; message: string };
};
export type ApiResponse<T> = ApiSuccess<T> | ApiError;

export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, {
    status,
  });
}

export function fail(code: string, message: string, status: number): Response {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiError,
    { status },
  );
}
```

## Global Error Handler

All route handlers must wrap service calls in `handleRouteError`. Internal details must never reach the client.

```typescript
// lib/errors/AppError.ts
export class AppError extends Error {
  constructor(
    public readonly code: string,
    public readonly message: string,
    public readonly status: number,
    public readonly cause?: unknown,
  ) {
    super(message);
  }
}

// lib/errors/handler.ts
import { AppError } from "./AppError";
import { fail } from "@/lib/response";

export function handleRouteError(err: unknown): Response {
  if (err instanceof AppError) {
    // Known, safe to surface the message
    return fail(err.code, err.message, err.status);
  }
  // Unknown error — log full context server-side, return generic message
  console.error("[unhandled]", err);
  return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
```

## Controller Pattern (Route Handler)

Protected route handlers are wrapped in `withAuth()`. See the **Authentication vs Authorization** section above for full details and the canonical example. Do not call `auth()` directly inside a controller and do not write a manual `try / catch + handleRouteError` — `withAuth()` provides both.

## Authentication vs Authorization

These are two distinct concerns and live in different layers.

| Concern            | What it answers                       | Where it lives                                                                 |
| ------------------ | ------------------------------------- | ------------------------------------------------------------------------------ |
| **Authentication** | "Who is the caller?"                  | `proxy.ts` middleware (primary gate) + `withAuth()` wrapper (defense-in-depth) |
| **Authorization**  | "Can this user access this resource?" | Repository layer (`data/*.ts`) — enforced via `WHERE userId = ?`               |

### Authentication — middleware first, `withAuth` second

1. **`proxy.ts`** is the primary gate. It runs before any route handler:
   - Protected pages (`/dashboard(.*)`) → redirect unauthenticated users to `/sign-in`.
   - Protected APIs (`/api/urls(.*)`) → return a 401 `ApiResponse` JSON to unauthenticated callers.
   - Public short-code redirects (`/[a-z0-9]{7}`) bypass `auth()` entirely (fast path).
2. **`withAuth()`** (`lib/api/with-auth.ts`) wraps every protected route handler. It re-checks the session and passes a guaranteed-non-null `userId` to the controller body. Controllers MUST NOT call `auth()` directly — always receive `userId` from `withAuth`.

```typescript
// app/api/urls/route.ts — the canonical controller pattern
import { withAuth } from "@/lib/api/with-auth";
import { ok } from "@/lib/response";
import { Errors } from "@/lib/errors/AppError";
import { CreateUrlSchema } from "@/lib/schemas/url.schema";
import { createShortUrl } from "@/lib/services/url.service";

export const POST = withAuth(async (req, _ctx, userId) => {
  const body = await req.json().catch(() => null);
  const parsed = CreateUrlSchema.safeParse(body);
  if (!parsed.success) throw Errors.validation();

  const url = await createShortUrl(userId, parsed.data.originalUrl);
  return ok(
    {
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
    },
    201,
  );
});
```

For dynamic routes pass the context type as a generic:

```typescript
type RouteContext = { params: Promise<{ shortCode: string }> }
export const DELETE = withAuth<RouteContext>(async (_req, { params }, userId) => { ... })
```

### Authorization — always in the repository

Repository functions MUST receive `userId` from the caller and enforce ownership in the `WHERE` clause. They never call `auth()` themselves. This guarantees a user can never read or mutate another user's data even if a controller forgets to filter.

```typescript
// data/urls.ts — authorization enforced inside the query
export async function getUrlsByUser(userId: string): Promise<UrlRow[]> {
  return await db
    .select()
    .from(urls)
    .where(eq(urls.userId, userId))
    .orderBy(desc(urls.createdAt));
}

export async function deleteUrlByShortCode(
  shortCode: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(urls)
    .where(and(eq(urls.shortCode, shortCode), eq(urls.userId, userId)))
    .returning({ id: urls.id });
  return result.length > 0;
}
```

Server Component pages call `auth()` once at the page boundary and pass `userId` down to the repository — same rule.

## Serialization & Deserialization

- **Inbound** (deserialization): parse every request body/param with a Zod schema in the controller. Reject with `VALIDATION_ERROR` (400) on failure. Never pass `req.json()` directly to a service.
- **Outbound** (serialization): return only explicitly mapped DTO fields. Strip `id`, `userId`, and any internal columns from API responses.
- Zod schemas live in `lib/schemas/*.schema.ts`. Import them only in controllers — not in services or repositories.

## Layer Rules

- **Repository** (`data/`): only Drizzle queries; receives `userId` from caller and enforces `WHERE userId = ?` for user-scoped tables; never calls `auth()` itself; no business logic; returns raw `$inferSelect` types. Public lookups (e.g. short-code resolution for redirects) are exempt from userId scoping.
- **Service** (`lib/services/`): calls one or more repository functions; owns business rules (short-code uniqueness, click counting); throws `AppError` for domain violations; imports nothing from `app/`.
- **Controller** (`app/api/`): wrapped in `withAuth()` for protected routes; calls one service function; owns request parsing and response shaping; never imports `db` directly; never calls `auth()` directly.
- **Model** (`db/schema.ts`): Drizzle table definitions only; no query logic; export inferred types (`$inferSelect`, `$inferInsert`).

## Anti-patterns / Pitfalls

- **Never** `return Response.json(error)` directly — always use `handleRouteError()` (or `withAuth()` which wires it up).
- **Never** call `auth()` inside a controller — use `withAuth()` and receive `userId` as a parameter.
- **Never** call `auth()` inside a repository — receive `userId` from the caller and enforce it in the WHERE clause.
- **Never** surface raw DB errors, stack traces, or column names in API responses.
- **Never** call `db` inside a service or controller — only repositories access `db`.
- **Never** call a service directly from a Server Component page — pages use repository functions from `data/` for read-only SSR; mutations go through API routes.
- **Never** skip Zod parsing — `req.json()` is untrusted user input.
- **Never** return `NOT_FOUND` for a malformed request body/param — use `VALIDATION_ERROR` (400). (Exception: public redirect routes may collapse both to 404 to prevent enumeration.)
