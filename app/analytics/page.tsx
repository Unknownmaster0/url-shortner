import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getClickCountsForUser } from '@/data/clicks'
import { BarChart3, MousePointerClick, Link2, ExternalLink, Users } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

export default async function AnalyticsPage() {
  const { userId } = await auth()
  if (!userId) redirect('/sign-in')

  const linkStats = await getClickCountsForUser(userId)

  const totalClicks = linkStats.reduce((sum, l) => sum + l.totalClicks, 0)

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 w-full">
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Click Analytics</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {linkStats.length === 0
            ? 'No links yet. Create short links from the dashboard to start tracking clicks.'
            : `${totalClicks} total ${totalClicks === 1 ? 'click' : 'clicks'} across ${linkStats.length} ${linkStats.length === 1 ? 'link' : 'links'}`}
        </p>
      </div>

      {linkStats.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="p-3 rounded-full bg-muted">
            <BarChart3 className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No analytics yet</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Once your short links receive clicks, analytics will appear here.
          </p>
        </div>
      ) : (
        /* Links grid */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {linkStats.map((link) => (
            <Link key={link.shortCode} href={`/analytics/${link.shortCode}`}>
              <Card className="hover:border-primary/40 hover:shadow-sm transition-all cursor-pointer h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-sm font-mono">
                    <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                    /{link.shortCode}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center gap-1.5 min-w-0">
                    <ExternalLink className="size-3 shrink-0 text-muted-foreground" />
                    <span className="text-xs text-muted-foreground truncate">
                      {link.originalUrl}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MousePointerClick className="size-4 text-primary" />
                    <span className="text-2xl font-bold text-foreground">{link.totalClicks}</span>
                    <span className="text-xs text-muted-foreground">
                      {link.totalClicks === 1 ? 'click' : 'clicks'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Users className="size-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{link.distinctClicks}</span>
                    <span className="text-xs text-muted-foreground">distinct</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </main>
  )
}
