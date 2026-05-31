import { ShortCodeParamSchema } from '@/lib/schemas/url.schema'
import { resolveShortCode } from '@/lib/services/url.service'
import { handleRouteError } from '@/lib/errors/handler'
import { Errors } from '@/lib/errors/AppError'

// GET /[shortCode] — public redirect handler.
//
// Lives at the root path (not under /api/) so generated short URLs stay short
// (e.g. example.com/abc1234 instead of example.com/api/r/abc1234).
//
// Uses HTTP 302 (Temporary Redirect) so that the browser always hits the server
// on every click, enabling accurate real-time click tracking.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ shortCode: string }> },
): Promise<Response> {
  try {
    // Params are a Promise in Next.js 16 — always await.
    const rawParams = await params
    const parsed = ShortCodeParamSchema.safeParse(rawParams)
    // Malformed code → indistinguishable from "no such link" to prevent enumeration.
    if (!parsed.success) throw Errors.notFound('Short URL')

    // Extract client IP for distinct-click tracking
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      req.headers.get('x-real-ip') ||
      'unknown'

    const originalUrl = await resolveShortCode(parsed.data.shortCode, ip)

    return new Response(null, {
      status: 302,
      headers: { Location: originalUrl, 'Cache-Control': 'no-store, no-cache, must-revalidate' },
    })
  } catch (err) {
    return handleRouteError(err)
  }
}
