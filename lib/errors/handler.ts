import { AppError } from "./AppError";
import { fail } from "@/lib/response";

/**
 * Global route error handler.
 *
 * - AppError  → forward its safe message and HTTP status to the client.
 * - Everything else → log full context server-side; return a generic 500 to the client.
 *
 * Usage — wrap every route handler body:
 *
 *   export async function POST(req: Request) {
 *     try {
 *       // ... controller logic
 *     } catch (err) {
 *       return handleRouteError(err)
 *     }
 *   }
 */
export function handleRouteError(err: unknown): Response {
  if (err instanceof AppError) {
    // Known, intentional error — safe to surface the message.
    return fail(err.code, err.message, err.status);
  }

  // Unknown error — log full details server-side; hide internals from the client.
  console.error("[route-error] Unhandled exception:", err);
  return fail("INTERNAL_ERROR", "An unexpected error occurred.", 500);
}
