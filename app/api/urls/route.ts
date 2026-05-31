import { CreateUrlSchema } from '@/lib/schemas/url.schema'
import { createShortUrl } from '@/lib/services/url.service'
import { getUrlsByUser } from '@/data/urls'
import { ok } from '@/lib/response'
import { Errors } from '@/lib/errors/AppError'
import { withAuth } from '@/lib/api/with-auth'

// GET /api/urls — list all short URLs for the authenticated user.
// Authentication is enforced by middleware AND by withAuth (defense in depth).
// Authorization is enforced inside the repository by the `WHERE userId = ?` filter.
export const GET = withAuth(async (_req, _ctx, userId) => {
  const rows = await getUrlsByUser(userId)

  // Serialize — return safe DTO fields only (no internal ids or userId).
  const data = rows.map((r) => ({
    shortCode: r.shortCode,
    originalUrl: r.originalUrl,
    createdAt: r.createdAt,
  }))

  return ok(data)
})

// POST /api/urls — create a new short URL for the authenticated user.
export const POST = withAuth(async (req, _ctx, userId) => {
  // Deserialize + validate at the controller boundary — never trust raw input.
  const body = await req.json().catch(() => null)
  const parsed = CreateUrlSchema.safeParse(body)
  if (!parsed.success) throw Errors.validation()

  const url = await createShortUrl(userId, parsed.data.originalUrl)

  // Serialize — return only the fields the client needs.
  return ok(
    {
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      createdAt: url.createdAt,
    },
    201,
  )
})

