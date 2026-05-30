---
description: Data fetching strategy for the project — modular pattern, server-side only, Drizzle ORM, and best practices for efficient and maintainable data retrieval.
applyTo: "**/*.ts, **/*.tsx"
---
# Data Fetching Strategy

Data fetching in this project is designed to be efficient, maintainable, and scalable. We follow a modular approach where data fetching logic is separated from the UI components. This allows for better code organization and easier testing.

## Directory Convention

ALWAYS create a separate file for data fetching logic in the `/data` directory at the project root. For example, if you have a component that needs to fetch URL data, create a file named `data/urls.ts` and implement the data fetching logic there. This promotes separation of concerns and makes it easier to manage and reuse data fetching logic across different components.

## Core Rules

**Server-side only** — ALWAYS write data fetching logic in Server Components or server-side functions (e.g., `async` page components, Route Handlers). NEVER fetch from the database in Client Components (`"use client"`). This ensures sensitive data and credentials are never exposed to the browser.

**Use Drizzle ORM exclusively** — ALWAYS fetch data from the database using Drizzle ORM. Import `db` from `db/drizzle.ts`. Do NOT create additional Drizzle instances anywhere in the codebase.

```ts
// ✅ Correct
import { db } from '@/db/drizzle'

// ❌ Wrong — never instantiate a new client
import { drizzle } from 'drizzle-orm/neon-http'
const db = drizzle(process.env.DATABASE_URL!)
```

**Validate auth before querying** — For any data scoped to a user, ALWAYS call `auth()` from `@clerk/nextjs/server` and validate `userId` before executing a database query. Never query user-scoped data without confirming the caller's identity.

```ts
import { auth } from '@clerk/nextjs/server'
import { db } from '@/db/drizzle'
import { urls } from '@/db/schema'
import { eq } from 'drizzle-orm'

export async function getUrlsByUser() {
  const { userId } = await auth()
  if (!userId) return []

  return await db.select().from(urls).where(eq(urls.userId, userId))
}
```

## Best Practices

1. **Use Async/Await** — Always use `async/await` for asynchronous data fetching. This makes the code more readable and easier to reason about.
2. **Type safety** — Leverage Drizzle's inferred types (`typeof urls.$inferSelect`) instead of writing manual TypeScript interfaces for table rows.
3. **Scope queries to the authenticated user** — Always filter by `userId` when querying user-owned resources (`urls`, etc.) to prevent cross-user data leaks.
4. **Keep data files thin** — Each file in `/data` should export focused query functions. Do not mix unrelated queries in one file.
5. **No raw SQL** — Use Drizzle's query builder. Never use raw SQL strings or `db.execute()` unless there is no typed alternative.

## Example File Structure

```
data/
  urls.ts       # getUrlsByUser(), getUrlByShortCode(), createUrl(), deleteUrl()
  clicks.ts     # getClickCountByUrl(), recordClick()
```
