import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { getUrlsByUser } from "@/data/urls";
import { getClickCountsByUrlIds } from "@/data/clicks";
import {
  Link2,
  ExternalLink,
  Calendar,
  MousePointerClick,
  BarChart3,
} from "lucide-react";
import { CreateLinkModal } from "@/components/create-link-modal";
import { LinkRowActions } from "@/components/link-row-actions";
import { ShortCodeLink } from "@/components/shortcode-link";
import Link from "next/link";

export default async function DashboardPage() {
  // Single auth() call at the page boundary.
  // Middleware is the primary guard; this is defense-in-depth + provides userId
  // to pass down to the repository (which enforces authorization via WHERE userId = ?).
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const links = await getUrlsByUser(userId);
  const clickCounts = await getClickCountsByUrlIds(links.map((l) => l.id));

  return (
    <main className="max-w-5xl mx-auto px-4 py-10 w-full">
      {/* Page header */}
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Your Links
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {links.length === 0
              ? "No links yet. Create your first short link to get started."
              : `${links.length} shortened ${links.length === 1 ? "link" : "links"}`}
          </p>
        </div>
        <CreateLinkModal />
      </div>

      {links.length === 0 ? (
        /* Empty state */
        <div className="rounded-xl border border-dashed border-border bg-card flex flex-col items-center justify-center py-20 text-center gap-3">
          <div className="p-3 rounded-full bg-muted">
            <Link2 className="size-6 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">No links found</p>
          <p className="text-sm text-muted-foreground max-w-xs">
            Links you shorten will appear here. Use the &ldquo;Create
            Link&rdquo; button above to shorten your first URL.
          </p>
        </div>
      ) : (
        /* Links table */
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid sm:grid-cols-[1fr_2fr_auto_auto_auto] gap-4 px-5 py-3 border-b border-border bg-muted/40">
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Short link
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Original URL
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Clicks
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Created
            </span>
            <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Actions
            </span>
          </div>

          {/* Rows */}
          <ul className="divide-y divide-border">
            {links.map((link) => (
              <li
                key={link.id}
                className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_auto_auto_auto] gap-2 sm:gap-4 px-5 py-4 items-center hover:bg-accent/40 transition-colors"
              >
                {/* Short code */}
                <div className="flex items-center gap-2 min-w-0">
                  <Link2 className="size-3.5 shrink-0 text-muted-foreground" />
                  <ShortCodeLink
                    shortCode={link.shortCode}
                    className="text-sm font-mono font-medium text-foreground hover:text-primary truncate"
                  />
                </div>

                {/* Original URL */}
                <div className="flex items-center gap-2 min-w-0">
                  <a
                    href={link.originalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground hover:text-foreground truncate flex items-center gap-1.5 group"
                  >
                    <span className="truncate">{link.originalUrl}</span>
                    <ExternalLink className="size-3 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </a>
                </div>

                {/* Click count + analytics link */}
                <Link
                  href={`/analytics/${link.shortCode}`}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap hover:text-primary transition-colors"
                  title="View analytics"
                >
                  <MousePointerClick className="size-3.5 shrink-0" />
                  <span>{clickCounts[link.id]?.total ?? 0}</span>
                  <BarChart3 className="size-3 shrink-0 ml-0.5" />
                </Link>

                {/* Created at */}
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground whitespace-nowrap">
                  <Calendar className="size-3.5 shrink-0" />
                  <time dateTime={link.createdAt.toISOString()}>
                    {link.createdAt.toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </time>
                </div>

                {/* Actions */}
                <LinkRowActions shortCode={link.shortCode} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </main>
  );
}
