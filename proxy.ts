import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

const isProtected = createRouteMatcher(['/dashboard(.*)'])
const isAuthPage  = createRouteMatcher(['/sign-in(.*)', '/sign-up(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()

  if (isProtected(req) && !userId) {
    const signIn = new URL('/sign-in', req.url)
    return NextResponse.redirect(signIn)
  }

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
