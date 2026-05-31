// Uniform API response types and factory functions.
// Every API route MUST use ok() or fail() — never return raw Response.json() directly.

export type ApiSuccess<T> = { success: true; data: T }
export type ApiError = { success: false; error: { code: string; message: string } }
export type ApiResponse<T> = ApiSuccess<T> | ApiError

/**
 * Return a successful JSON response.
 * @param data   - The serialized DTO to send to the client.
 * @param status - HTTP status code (default 200).
 */
export function ok<T>(data: T, status = 200): Response {
  return Response.json({ success: true, data } satisfies ApiSuccess<T>, { status })
}

/**
 * Return an error JSON response. Internal error details must NEVER be passed here —
 * use a generic message for unknown errors (see handleRouteError).
 */
export function fail(code: string, message: string, status: number): Response {
  return Response.json(
    { success: false, error: { code, message } } satisfies ApiError,
    { status },
  )
}
