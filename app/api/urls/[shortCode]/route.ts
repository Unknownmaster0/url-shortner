import { ShortCodeParamSchema } from '@/lib/schemas/url.schema'
import { deleteShortUrl } from '@/lib/services/url.service'
import { ok } from '@/lib/response'
import { Errors } from '@/lib/errors/AppError'
import { withAuth } from '@/lib/api/with-auth'

type RouteContext = { params: Promise<{ shortCode: string }> }

// DELETE /api/urls/[shortCode] — delete a short URL owned by the authenticated user.
// Authentication: enforced by middleware AND by withAuth (defense in depth).
// Authorization: enforced inside the repository by the `WHERE userId = ?` filter.
export const DELETE = withAuth<RouteContext>(async (_req, { params }, userId) => {
  // Params are a Promise in Next.js 16 — always await.
  const rawParams = await params
  const parsed = ShortCodeParamSchema.safeParse(rawParams)
  if (!parsed.success) throw Errors.validation('Invalid short code.')

  await deleteShortUrl(userId, parsed.data.shortCode)

  return ok({ deleted: true })
})

