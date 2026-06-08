/**
 * Application-level error class.
 *
 * Throw this from service or repository layers to signal a known, safe-to-surface error.
 * The global error handler (handleRouteError) forwards the message to the client only
 * for AppError instances — all other errors produce a generic "unexpected error" response.
 */
export class AppError extends Error {
  constructor(
    /** Machine-readable error code (e.g. "NOT_FOUND", "UNAUTHORIZED"). */
    public readonly code: string,
    /** Human-readable message — safe to send to the client. */
    message: string,
    /** HTTP status code to return. */
    public readonly status: number,
    /** Optional original cause for server-side logging — never exposed to the client. */
    public readonly cause?: unknown,
  ) {
    super(message);
    this.name = "AppError";
  }
}

// ── Common error factories ────────────────────────────────────────────────────

export const Errors = {
  unauthorized: () =>
    new AppError("UNAUTHORIZED", "Authentication required.", 401),

  forbidden: () =>
    new AppError(
      "FORBIDDEN",
      "You do not have permission to perform this action.",
      403,
    ),

  notFound: (resource = "Resource") =>
    new AppError("NOT_FOUND", `${resource} not found.`, 404),

  validation: (message = "Invalid request body.") =>
    new AppError("VALIDATION_ERROR", message, 400),

  conflict: (message = "Resource already exists.") =>
    new AppError("CONFLICT", message, 409),
} as const;
