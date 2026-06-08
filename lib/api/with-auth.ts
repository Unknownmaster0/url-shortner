import { auth } from "@clerk/nextjs/server";
import { Errors } from "@/lib/errors/AppError";
import { handleRouteError } from "@/lib/errors/handler";

/**
 * Route handler that receives an authenticated userId as its final argument.
 *
 *   export const POST = withAuth(async (req, _ctx, userId) => { ... })
 *
 * The first two parameters mirror the standard Next.js App Router route signature
 * `(req, ctx)`; `ctx` is `{ params: Promise<...> }` for dynamic routes, otherwise unused.
 */
export type AuthedHandler<TCtx = unknown> = (
  req: Request,
  ctx: TCtx,
  userId: string,
) => Promise<Response>;

/**
 * Higher-order route wrapper that enforces authentication BEFORE the controller runs.
 *
 * Responsibilities:
 *   1. Resolve the Clerk session (`auth()`) and reject unauthenticated requests
 *      with a uniform `UNAUTHORIZED` (401) `ApiResponse`.
 *   2. Catch any error thrown by the wrapped handler and route it through the
 *      global `handleRouteError()` so every API failure has the same shape.
 *
 * Middleware (`proxy.ts`) is the primary auth gate; this wrapper is defense-in-depth
 * — it guarantees no controller body ever executes without a verified userId, even
 * if middleware is misconfigured.
 */
export function withAuth<TCtx = unknown>(handler: AuthedHandler<TCtx>) {
  return async (req: Request, ctx: TCtx): Promise<Response> => {
    try {
      const { userId } = await auth();
      if (!userId) throw Errors.unauthorized();
      return await handler(req, ctx, userId);
    } catch (err) {
      return handleRouteError(err);
    }
  };
}
