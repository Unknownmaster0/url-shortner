import { db } from '@/db/drizzle'
import { urls } from '@/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export type UrlRow = typeof urls.$inferSelect
export type NewUrlRow = typeof urls.$inferInsert

// ──────────────────────────────────────────────────────────────────────────────
// REPOSITORY LAYER
//
// Authorization rule: every user-scoped query MUST receive `userId` from the
// caller and enforce it in the WHERE clause. Repository functions never call
// `auth()` themselves — authentication happens in middleware / `withAuth` /
// the Server Component page, and the resolved userId is passed down.
// This guarantees a user can never read or mutate another user's data.
// ──────────────────────────────────────────────────────────────────────────────

/**
 * Returns all URLs owned by `userId`, newest first.
 * Authorization is enforced by the `WHERE userId = ?` filter.
 */
export async function getUrlsByUser(userId: string): Promise<UrlRow[]> {
  return await db
    .select()
    .from(urls)
    .where(eq(urls.userId, userId))
    .orderBy(desc(urls.createdAt))
}

/**
 * Look up a URL record by its short code. **Public** lookup used by the redirect
 * route — no authorization check because short codes are themselves the access token.
 * Returns undefined when not found (caller decides the error semantics).
 */
export async function findUrlByShortCode(shortCode: string): Promise<UrlRow | undefined> {
  const [row] = await db
    .select()
    .from(urls)
    .where(eq(urls.shortCode, shortCode))
    .limit(1)
  return row
}

/**
 * Insert a new URL row. The caller (service layer) supplies a userId that has
 * already been authenticated upstream; ownership is recorded via the userId column.
 */
export async function insertUrl(data: NewUrlRow): Promise<UrlRow> {
  const [row] = await db.insert(urls).values(data).returning()
  return row
}

/**
 * Delete a URL owned by `userId`. The WHERE clause is scoped to BOTH shortCode
 * AND userId, so a user can never delete another user's record even if they
 * guess the shortCode. Returns true if a row was deleted, false otherwise
 * (same response for "not found" and "not owned" prevents enumeration).
 */
export async function deleteUrlByShortCode(
  shortCode: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(urls)
    .where(and(eq(urls.shortCode, shortCode), eq(urls.userId, userId)))
    .returning({ id: urls.id })
  return result.length > 0
}


