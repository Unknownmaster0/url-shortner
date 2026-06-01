import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, Show } from "@clerk/nextjs";
import {
  Link2,
  BarChart3,
  Zap,
  ArrowRight,
  Globe,
  Lock,
  MousePointerClick,
  Copy,
} from "lucide-react";
import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col">
      {/* ── Hero ───────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-center text-center px-4 py-24 md:py-36">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs text-muted-foreground mb-6">
          <Link2 className="size-3" />
          Free URL Shortener
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-foreground max-w-3xl mb-5 leading-tight">
          Shorten URLs.
          <br />
          Track Clicks.
          <br />
          Share Smarter.
        </h1>

        <p className="text-base md:text-lg text-muted-foreground max-w-xl mb-10">
          Turn long, messy links into clean 7-character short codes. Track
          every click and manage all your links from a single dashboard.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Show when="signed-out">
            <SignUpButton forceRedirectUrl="/dashboard">
              <Button size="lg" className="gap-2">
                Get Started Free <ArrowRight className="size-4" />
              </Button>
            </SignUpButton>
            <SignInButton forceRedirectUrl="/dashboard">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </SignInButton>
          </Show>
          <Show when="signed-in">
            <Link href="/dashboard">
              <Button size="lg" className="gap-2">
                Go to Dashboard <ArrowRight className="size-4" />
              </Button>
            </Link>
          </Show>
        </div>
      </section>

      {/* ── URL Demo ───────────────────────────────────────────────────── */}
      <section className="px-4 py-16 bg-muted/40">
        <div className="max-w-2xl mx-auto">
          <p className="text-center text-sm text-muted-foreground mb-6 font-medium">
            See how it works
          </p>
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="flex flex-col gap-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-mono uppercase tracking-wide">
                  Long URL
                </p>
                <div className="rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground font-mono truncate">
                  https://www.example.com/blog/articles/how-to-shorten-urls-and-track-analytics
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <div className="flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                  <Zap className="size-3" />
                  Shortened
                </div>
                <div className="h-px flex-1 bg-border" />
              </div>

              <div>
                <p className="text-xs text-muted-foreground mb-1.5 font-mono uppercase tracking-wide">
                  Short URL
                </p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 rounded-lg border border-border bg-background px-4 py-3 text-sm font-mono font-medium text-foreground">
                    yourdomain.com/
                    <span className="text-primary font-bold">abc1234</span>
                  </div>
                  <Button variant="outline" size="icon" className="shrink-0">
                    <Copy className="size-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────────────────── */}
      <section className="px-4 py-24">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3">
            Everything you need
          </h2>
          <p className="text-center text-muted-foreground mb-14 max-w-lg mx-auto">
            A complete URL management solution with tracking, analytics, and a
            clean dashboard.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Zap className="size-5 text-primary" />,
                title: "Instant Shortening",
                desc: "Paste any URL and get a clean 7-character alphanumeric short code in seconds.",
              },
              {
                icon: <BarChart3 className="size-5 text-primary" />,
                title: "Click Analytics",
                desc: "Every click is tracked automatically. See how many times each link has been visited.",
              },
              {
                icon: <Globe className="size-5 text-primary" />,
                title: "Real-time Click Tracking",
                desc: "Uses HTTP 302 (Temporary Redirect) so every click hits the server for accurate real-time analytics.",
              },
              {
                icon: <Lock className="size-5 text-primary" />,
                title: "Secure & Private",
                desc: "All links are tied to your account. Only you can view, copy, or delete them.",
              },
              {
                icon: <Link2 className="size-5 text-primary" />,
                title: "Unique Short Codes",
                desc: "Collision-free 7-character codes are regenerated automatically if a conflict occurs.",
              },
              {
                icon: <MousePointerClick className="size-5 text-primary" />,
                title: "Dashboard Management",
                desc: "View, copy, and delete all your short links from one clean, easy-to-use dashboard.",
              },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-xl border border-border bg-card p-6 hover:shadow-sm transition-shadow"
              >
                <div className="size-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  {icon}
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ───────────────────────────────────────────────── */}
      <section className="px-4 py-24 bg-muted/30">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            How it works
          </h2>
          <p className="text-muted-foreground mb-14">
            Three steps to start shortening and tracking.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {[
              {
                step: "1",
                title: "Create an account",
                desc: "Sign up for free in seconds using email or an OAuth provider.",
              },
              {
                step: "2",
                title: "Shorten a URL",
                desc: "Paste your long URL into the dashboard and click Shorten.",
              },
              {
                step: "3",
                title: "Share & track",
                desc: "Copy your short link, share it anywhere, and watch the click counter grow.",
              },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex flex-col items-center">
                <div className="size-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-lg mb-4">
                  {step}
                </div>
                <h3 className="font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────────────────── */}
      <section className="px-4 py-24 text-center">
        <h2 className="text-2xl md:text-3xl font-bold mb-4">
          Ready to start shortening?
        </h2>
        <p className="text-muted-foreground mb-8 max-w-md mx-auto">
          Create a free account and start turning long URLs into clean,
          trackable short links today.
        </p>
        <Show when="signed-out">
          <SignUpButton forceRedirectUrl="/dashboard">
            <Button size="lg" className="gap-2">
              Create free account <ArrowRight className="size-4" />
            </Button>
          </SignUpButton>
        </Show>
        <Show when="signed-in">
          <Link href="/dashboard">
            <Button size="lg" className="gap-2">
              Go to Dashboard <ArrowRight className="size-4" />
            </Button>
          </Link>
        </Show>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────── */}
      <footer className="border-t border-border px-4 py-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Link2 className="size-4" />
            URL Shortener
          </div>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} URL Shortener.
          </p>
        </div>
      </footer>
    </div>
  );
}
