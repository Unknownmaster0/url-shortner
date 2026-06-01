"use client"

import { useRouter } from "next/navigation"

interface ShortCodeLinkProps {
  shortCode: string
  className?: string
}

// Renders the short-code anchor. Opens the redirect in a new tab (normal behaviour)
// and schedules a router.refresh() after a brief delay so the click that was just
// recorded in the DB is reflected in the dashboard without a manual page reload.
const REFRESH_DELAY_MS = 500

export function ShortCodeLink({ shortCode, className }: ShortCodeLinkProps) {
  const router = useRouter()

  function handleClick() {
    // Let the browser open the new tab first, then refresh the Server Component
    // tree for this tab so the updated click count appears automatically.
    setTimeout(() => router.refresh(), REFRESH_DELAY_MS)
  }

  return (
    <a
      href={`/${shortCode}`}
      target="_blank"
      rel="noopener noreferrer"
      className={className}
      onClick={handleClick}
    >
      /{shortCode}
    </a>
  )
}
