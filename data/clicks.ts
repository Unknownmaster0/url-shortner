import { db } from '@/db/drizzle'
import { clicks, urls } from '@/db/schema'
import { count, countDistinct, inArray, eq, and, gte, min, max, sql } from 'drizzle-orm'

/**
 * Record a single click event for a URL.
 * Called by the redirect service after resolving a short code.
 * No auth needed — this is a system action triggered by a public redirect.
 */
export async function recordClick(urlId: number, ipAddress?: string): Promise<void> {
  await db.insert(clicks).values({ urlId, ipAddress: ipAddress ?? null })
}

/**
 * Returns a map of urlId → { total, distinct } click counts for the given URL IDs.
 * Used by the dashboard to display per-link click counts in a single query.
 */
export async function getClickCountsByUrlIds(
  urlIds: number[],
): Promise<Record<number, { total: number; distinct: number }>> {
  if (urlIds.length === 0) return {}
  const rows = await db
    .select({
      urlId: clicks.urlId,
      total: count(clicks.id),
      distinct: countDistinct(clicks.ipAddress),
    })
    .from(clicks)
    .where(inArray(clicks.urlId, urlIds))
    .groupBy(clicks.urlId)
  return Object.fromEntries(rows.map((r) => [r.urlId, { total: r.total, distinct: r.distinct }]))
}

/**
 * Returns all shortcodes with their total and distinct click counts for a given user.
 * Used by the analytics overview page.
 */
export async function getClickCountsForUser(userId: string) {
  const rows = await db
    .select({
      shortCode: urls.shortCode,
      originalUrl: urls.originalUrl,
      createdAt: urls.createdAt,
      totalClicks: count(clicks.id),
      distinctClicks: countDistinct(clicks.ipAddress),
    })
    .from(urls)
    .leftJoin(clicks, eq(clicks.urlId, urls.id))
    .where(eq(urls.userId, userId))
    .groupBy(urls.id, urls.shortCode, urls.originalUrl, urls.createdAt)
    .orderBy(urls.createdAt)

  return rows
}

export type TimeOfDayData = {
  morning: number
  afternoon: number
  evening: number
  night: number
}

export type ShortCodeAnalytics = {
  shortCode: string
  originalUrl: string
  createdAt: Date
  totalClicks: number
  distinctClicks: number
  clicksToday: number
  clicksThisWeek: number
  firstClickAt: Date | null
  lastClickAt: Date | null
  avgDailyClicks: number
  timeOfDay: TimeOfDayData
}

/**
 * Returns detailed click analytics for a specific shortcode owned by the given user.
 * Returns null if the shortcode doesn't exist or doesn't belong to the user.
 */
export async function getClickAnalyticsForShortCode(
  shortCode: string,
  userId: string,
): Promise<ShortCodeAnalytics | null> {
  // First verify the URL exists and belongs to this user
  const [url] = await db
    .select()
    .from(urls)
    .where(and(eq(urls.shortCode, shortCode), eq(urls.userId, userId)))
    .limit(1)

  if (!url) return null

  const now = new Date()
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)

  // Get aggregate stats
  const [stats] = await db
    .select({
      totalClicks: count(clicks.id),
      distinctClicks: countDistinct(clicks.ipAddress),
      firstClickAt: min(clicks.createdAt),
      lastClickAt: max(clicks.createdAt),
    })
    .from(clicks)
    .where(eq(clicks.urlId, url.id))

  // Get clicks today
  const [todayStats] = await db
    .select({ count: count(clicks.id) })
    .from(clicks)
    .where(and(eq(clicks.urlId, url.id), gte(clicks.createdAt, oneDayAgo)))

  // Get clicks this week
  const [weekStats] = await db
    .select({ count: count(clicks.id) })
    .from(clicks)
    .where(and(eq(clicks.urlId, url.id), gte(clicks.createdAt, oneWeekAgo)))

  // Get time-of-day distribution using EXTRACT(HOUR FROM created_at)
  const timeOfDayRows = await db
    .select({
      hour: sql<number>`extract(hour from ${clicks.createdAt})`.as('hour'),
      count: count(clicks.id),
    })
    .from(clicks)
    .where(eq(clicks.urlId, url.id))
    .groupBy(sql`extract(hour from ${clicks.createdAt})`)

  // Bucket hours into time-of-day segments
  const timeOfDay: TimeOfDayData = { morning: 0, afternoon: 0, evening: 0, night: 0 }
  for (const row of timeOfDayRows) {
    const h = Number(row.hour)
    if (h >= 6 && h < 12) timeOfDay.morning += row.count
    else if (h >= 12 && h < 17) timeOfDay.afternoon += row.count
    else if (h >= 17 && h < 21) timeOfDay.evening += row.count
    else timeOfDay.night += row.count
  }

  // Calculate average daily clicks
  const daysSinceCreation = Math.max(
    1,
    Math.ceil((now.getTime() - url.createdAt.getTime()) / (24 * 60 * 60 * 1000)),
  )
  const avgDailyClicks = Math.round((stats.totalClicks / daysSinceCreation) * 10) / 10

  return {
    shortCode: url.shortCode,
    originalUrl: url.originalUrl,
    createdAt: url.createdAt,
    totalClicks: stats.totalClicks,
    distinctClicks: stats.distinctClicks,
    clicksToday: todayStats.count,
    clicksThisWeek: weekStats.count,
    firstClickAt: stats.firstClickAt,
    lastClickAt: stats.lastClickAt,
    avgDailyClicks,
    timeOfDay,
  }
}
