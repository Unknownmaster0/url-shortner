import {
  findUrlByShortCode,
  insertUrl,
  deleteUrlByShortCode,
  type UrlRow,
} from "@/data/urls";
import { recordClick } from "@/data/clicks";
import { AppError, Errors } from "@/lib/errors/AppError";

// ── Short-code generation ─────────────────────────────────────────────────────

const SHORT_CODE_LENGTH = 7;
const CHARSET = "abcdefghijklmnopqrstuvwxyz0123456789";

function generateShortCode(): string {
  const bytes = new Uint8Array(SHORT_CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map((b) => CHARSET[b % CHARSET.length])
    .join("");
}

// ── URL creation ──────────────────────────────────────────────────────────────

/**
 * Generate a unique short code and persist the URL record.
 * Retries up to MAX_ATTEMPTS times on short-code collision.
 */
const MAX_ATTEMPTS = 5;

export async function createShortUrl(
  userId: string,
  originalUrl: string,
): Promise<UrlRow> {
  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    const shortCode = generateShortCode();
    const existing = await findUrlByShortCode(shortCode);
    if (existing) continue; // collision — try again

    return await insertUrl({ shortCode, originalUrl, userId });
  }

  // Extremely unlikely; surface as a server error without leaking internals.
  throw new AppError(
    "SHORT_CODE_EXHAUSTED",
    "Could not generate a unique short code. Please try again.",
    503,
  );
}

// ── URL deletion ──────────────────────────────────────────────────────────────

/**
 * Delete a short URL owned by the authenticated user.
 * Throws NOT_FOUND if the short code does not exist or belongs to another user —
 * both cases return the same error to prevent enumeration of other users' links.
 */
export async function deleteShortUrl(
  userId: string,
  shortCode: string,
): Promise<void> {
  const deleted = await deleteUrlByShortCode(shortCode, userId);
  if (!deleted) throw Errors.notFound("Short URL");
}

// ── Redirect resolution ───────────────────────────────────────────────────────

/**
 * Resolve a short code to its original URL and asynchronously record the click.
 * Click recording is fire-and-forget — a failure must NOT block the redirect.
 */
export async function resolveShortCode(
  shortCode: string,
  ipAddress?: string,
): Promise<string> {
  const url = await findUrlByShortCode(shortCode);
  if (!url) throw Errors.notFound("Short URL");

  // Fire-and-forget: do not await, do not surface recording errors to the user.
  recordClick(url.id, ipAddress).catch((err: unknown) => {
    console.error("[url.service] Failed to record click for", shortCode, err);
  });

  return url.originalUrl;
}
