import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// Pages that require an authenticated user — unauthenticated → redirect to /sign-in.
const isProtectedPage = createRouteMatcher(['/dashboard(.*)', '/analytics(.*)'])

// API routes that require an authenticated user — unauthenticated → 401 JSON.
// These mutate user-scoped data (create/list/delete short URLs).
const isProtectedApi = createRouteMatcher(['/api/urls(.*)'])

// Auth pages — authenticated users should not see them.
const isAuthPage = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

// Public short-code redirect route: /{7-char alphanumeric}. Bypass Clerk entirely
// so the public hot path skips session resolution and stays fast.
const SHORT_CODE_PATH_RE = /^\/[A-Za-z0-9]{7}$/

export default clerkMiddleware(async (auth, req) => {
  // Fast-path: short-code redirects are public — do not resolve a session.
  if (SHORT_CODE_PATH_RE.test(req.nextUrl.pathname)) return

  const { userId } = await auth()

  // Protected pages → redirect to sign-in for unauthenticated users.
  if (isProtectedPage(req) && !userId) {
    const signIn = new URL('/sign-in', req.url)
    return NextResponse.redirect(signIn)
  }

  // Protected API routes → return uniform 401 ApiResponse (no redirect for fetch calls).
  if (isProtectedApi(req) && !userId) {
    return NextResponse.json(
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Authentication required.' } },
      { status: 401 },
    )
  }

  // Authenticated users should not see auth pages.
  if (isAuthPage(req) && userId) {
    const dashboard = new URL('/dashboard', req.url)
    return NextResponse.redirect(dashboard)
  }
})

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
}
