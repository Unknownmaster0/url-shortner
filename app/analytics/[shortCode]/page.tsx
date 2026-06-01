import { auth } from '@clerk/nextjs/server'
import { redirect, notFound } from 'next/navigation'
import { getClickAnalyticsForShortCode } from '@/data/clicks'
import { ShortCodeParamSchema } from '@/lib/schemas/url.schema'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TimeOfDayChart } from '@/components/time-of-day-chart'
import {
  ArrowLeft,
  MousePointerClick,
  CalendarClock,
  TrendingUp,
  Clock,
  ExternalLink,
  Link2,
  Users,
} from 'lucide-react'
import Link from 'next/link'

export default async function AnalyticsDetailPage({
  params,
}: {
  params: Promise<{ shortCode: string }>
}) {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const { shortCode: rawShortCode } = await params
  const parsed = ShortCodeParamSchema.safeParse({ shortCode: rawShortCode })
  if (!parsed.success) notFound()
  const { shortCode } = parsed.data

  const analytics = await getClickAnalyticsForShortCode(shortCode, userId)
  if (!analytics) notFound()

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 w-full">
      {/* Back link + header */}
      <div className="mb-8">
        <Link
          href="/analytics"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="size-3.5" />
          Back to Analytics
        </Link>

        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Link2 className="size-5 text-foreground" />
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-foreground tracking-tight font-mono">
              /{analytics.shortCode}
            </h1>
            <a
              href={analytics.originalUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1.5 group mt-1"
            >
              <span className="truncate">{analytics.originalUrl}</span>
              <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          </div>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <MousePointerClick className="size-4" />
              Total Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{analytics.totalClicks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Users className="size-4" />
              Distinct Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{analytics.distinctClicks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Clock className="size-4" />
              Clicks Today
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{analytics.clicksToday}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarClock className="size-4" />
              Clicks This Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{analytics.clicksThisWeek}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <TrendingUp className="size-4" />
              Avg. Daily Clicks
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{analytics.avgDailyClicks}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarClock className="size-4" />
              First Click
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">
              {analytics.firstClickAt
                ? analytics.firstClickAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CalendarClock className="size-4" />
              Last Click
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-lg font-semibold text-foreground">
              {analytics.lastClickAt
                ? analytics.lastClickAt.toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })
                : '—'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Pie chart */}
      <div className="max-w-md">
        <TimeOfDayChart data={analytics.timeOfDay} />
      </div>
    </main>
  )
}
