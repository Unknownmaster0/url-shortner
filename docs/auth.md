# Authentication

Clerk (`@clerk/nextjs` v7) is the **only** auth method used in this project. Do not add any other auth library or custom session logic.

## Key Files

| File | Responsibility |
|------|---------------|
| `proxy.ts` | Clerk middleware — runs on all matched routes, enforces route protection |
| `app/layout.tsx` | Wraps the app in `<ClerkProvider>`, renders `<Show>` conditional UI |
| `app/sign-in/[[...sign-in]]/page.tsx` | Clerk-hosted sign-in UI (catch-all route) |
| `app/sign-up/[[...sign-up]]/page.tsx` | Clerk-hosted sign-up UI (catch-all route) |
| `app/dashboard/page.tsx` | Protected route — requires authentication |

## Route Protection Rules

| Route | Behaviour |
|-------|-----------|
| `/dashboard` | **Protected** — unauthenticated users are redirected to sign-in |
| `/sign-in`, `/sign-up` | **Public** — authenticated users are redirected to `/dashboard` |
| All other routes | Public by default |

## Middleware (`proxy.ts`)

Use `createRouteMatcher` to define protected and auth-only (sign-in/sign-up) routes, then enforce redirects inside `clerkMiddleware`.

```ts
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher(['/dashboard(.*)'])
const isAuthPage  = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  // Redirect unauthenticated users away from protected routes
  if (isProtected(req) && !userId) {
    const signIn = new URL('/sign-in', req.url)
    return NextResponse.redirect(signIn)
  }

  // Redirect authenticated users away from sign-in / sign-up
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
```

## ClerkProvider & Conditional UI (`app/layout.tsx`)

`<ClerkProvider>` must wrap the entire app. Use `<Show>` (not conditional JS) for auth-state-dependent UI:

```tsx
import { ClerkProvider, Show, SignInButton, SignUpButton, UserButton } from '@clerk/nextjs'

// Inside layout JSX:
<ClerkProvider>
  <Show when="signed-out">
    <SignInButton forceRedirectUrl="/dashboard" />
    <SignUpButton forceRedirectUrl="/dashboard" />
  </Show>
  <Show when="signed-in">
    <UserButton />
  </Show>
  {children}
</ClerkProvider>
```

> **Always pass `forceRedirectUrl="/dashboard"`** to `<SignInButton>` and `<SignUpButton>`. Without it, Clerk will redirect back to whichever page the button was clicked on (it persists the current URL as `redirect_url`), overriding any fallback redirect configuration.

## Sign-in / Sign-up Pages

Use Clerk's `<SignIn>` and `<SignUp>` components inside catch-all routes so Clerk's hosted UI handles all OAuth, MFA, and error flows:

```tsx
// app/sign-in/[[...sign-in]]/page.tsx
import { SignIn } from '@clerk/nextjs'
export default function SignInPage() {
  return <SignIn forceRedirectUrl="/dashboard" />
}
```

```tsx
// app/sign-up/[[...sign-up]]/page.tsx
import { SignUp } from '@clerk/nextjs'
export default function SignUpPage() {
  return <SignUp forceRedirectUrl="/dashboard" />
}
```

Set the redirect URLs in `.env`:
```
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL=/dashboard
NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL=/dashboard
```

> **Note:** `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` / `AFTER_SIGN_UP_URL` are **deprecated** in Clerk v7 and have no effect. Use `FORCE_REDIRECT_URL` variants instead.

## Reading Auth State in Server Components

`auth()` is async in Clerk v7:

```ts
import { auth } from '@clerk/nextjs/server'

export default async function DashboardPage() {
  const { userId } = await auth()
  // userId is guaranteed non-null here because the middleware already blocked unauthenticated access
}
```

## Anti-patterns / Pitfalls

- **Do not call `auth().protect()`** instead of middleware redirects — the middleware pattern above is the convention for this project.
- **Do not use `getAuth()`** (Clerk v5/v6 API) — it is removed in v7; use `auth()` from `@clerk/nextjs/server`.
- **Do not add `"use client"` to pages** just to access auth state — use Server Components and `auth()`.
- **Do not hard-code redirect paths** — use `new URL('/dashboard', req.url)` in middleware to build absolute URLs.
- **Do not create additional auth providers** — Clerk is the sole auth method; no NextAuth, iron-session, or custom JWT.
- **Catch-all segments required** for sign-in/sign-up pages — `[[...sign-in]]` is needed for Clerk's multi-step flow to work correctly.
- **Do not use `fallbackRedirectUrl`** for post-auth navigation — it is overridden when a `redirect_url` query param is present (Clerk always adds one when navigating from a button). Use `forceRedirectUrl` instead.
- **Do not use deprecated redirect env vars** — `NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL` and `NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL` are no-ops in Clerk v7. Use `NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL` and `NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL`.
