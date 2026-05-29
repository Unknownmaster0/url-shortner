import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider, SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";
import { shadcn } from "@clerk/ui/themes";
import { Link2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeProvider } from "@/components/theme-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "URL Shortener — Shorten, Track & Share",
  description: "Turn long URLs into clean 7-character short links. Track every click from your dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
        <ClerkProvider appearance={{ theme: shadcn }}>
          <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
            <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <Link2 className="size-4" />
                URL Shortener
              </Link>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <Show when="signed-out">
                  <SignInButton forceRedirectUrl="/dashboard">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </SignInButton>
                  <SignUpButton forceRedirectUrl="/dashboard">
                    <Button size="sm">Get Started</Button>
                  </SignUpButton>
                </Show>
                <Show when="signed-in">
                  <Link href="/dashboard">
                    <Button variant="ghost" size="sm">Dashboard</Button>
                  </Link>
                  <UserButton />
                </Show>
              </div>
            </div>
          </header>
          {children}
        </ClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
