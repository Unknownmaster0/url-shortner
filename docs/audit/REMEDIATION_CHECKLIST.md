# Security Audit — Quick Reference Guide

**Date:** June 8, 2026  
**Total Findings:** 14 vulnerabilities (2 Critical, 5 High, 3 Medium, 4 Low)

---

## Quick Summary Table

| ID  | Title                                 | Severity | Status | File                            | Line |
| --- | ------------------------------------- | -------- | ------ | ------------------------------- | ---- |
| 1   | IP Header Injection                   | Critical | ⏳     | app/[shortCode]/route.ts        | 24   |
| 2   | IP Storage Without Validation         | Critical | ⏳     | data/clicks.ts                  | 13   |
| 3   | SSRF — No Protocol Allowlist          | High     | ⏳     | lib/services/url.service.ts     | 28   |
| 4   | SSRF — Internal IP Not Blocked        | High     | ⏳     | lib/services/url.service.ts     | 28   |
| 5   | Missing Rate Limiting (Redirect)      | High     | ⏳     | app/[shortCode]/route.ts        | 14   |
| 6   | Missing Security Headers              | High     | ⏳     | next.config.ts                  | 1    |
| 7   | Missing HSTS Header                   | High     | ⏳     | next.config.ts                  | 1    |
| 8   | Missing Cache-Control Headers         | Medium   | ⏳     | app/dashboard/page.tsx          | 1    |
| 9   | XSS in Alert Messages                 | Medium   | ⏳     | components/link-row-actions.tsx | 38   |
| 10  | Env Variable Validation               | Low      | ⏳     | db/drizzle.ts                   | 6    |
| 11  | Verbose Error Logging                 | Low      | ⏳     | lib/services/url.service.ts     | 81   |
| 12  | CSRF Documentation                    | Low      | ✅     | app/api/urls/route.ts           | 23   |
| 13  | Information Leakage (Enum Prevention) | Low      | ✅     | lib/errors/AppError.ts          | 30   |
| 14  | Rate Limit Retry-After Header         | Low      | ⏳     | app/[shortCode]/route.ts        | 14   |

---

## Remediation Checklist

### 🔴 CRITICAL (Fix Immediately)

- [ ] **Issue #1–2:** Create `lib/ip.ts` with IP validation functions
  - [ ] Update `app/[shortCode]/route.ts` to sanitize X-Forwarded-For
  - [ ] Update `lib/services/url.service.ts` to validate before storage
- [ ] **Issue #3–4:** Update `lib/schemas/url.schema.ts` with SSRF protections
  - [ ] Add `validateAndSanitizeIp()` function for hostname/private IP checks
  - [ ] Add `.refine()` to `CreateUrlSchema` for protocol/hostname validation

### 🔴 HIGH (Fix This Sprint)

- [ ] **Issue #5:** Implement rate limiting
  - [ ] Create `lib/rate-limit.ts` with Upstash Redis client
  - [ ] Update `app/[shortCode]/route.ts` GET handler
  - [ ] Update `app/api/urls/route.ts` POST handler
  - [ ] Add `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` to `.env`

- [ ] **Issue #6–7:** Add security headers to `next.config.ts`
  - [ ] CSP (Content-Security-Policy)
  - [ ] X-Frame-Options: DENY
  - [ ] X-Content-Type-Options: nosniff
  - [ ] Strict-Transport-Security (HSTS)
  - [ ] Referrer-Policy
  - [ ] Permissions-Policy

### 🟡 MEDIUM (Fix Before Release)

- [ ] **Issue #8:** Add cache-control headers
  - [ ] Create `lib/middleware/cache-control.ts`
  - [ ] Update `app/dashboard/page.tsx` with fetchCache config
  - [ ] Update `app/analytics/page.tsx` with fetchCache config

- [ ] **Issue #9:** Replace alert dialogs with toast notifications
  - [ ] Create `components/ui/toast.tsx` (or use shadcn/ui toast)
  - [ ] Update `components/create-link-modal.tsx`
  - [ ] Update `components/link-row-actions.tsx`

- [ ] **Issue #10:** Add environment variable validation
  - [ ] Create `lib/env.ts` with Zod schema
  - [ ] Import in `app/layout.tsx`

### 🟢 LOW (Best Practice Documentation)

- [ ] **Issue #11:** Redact shortcode in error logs
  - [ ] Update `lib/services/url.service.ts` line 81

- [ ] **Issue #12:** ✅ Already done — add comment to `app/api/urls/route.ts`

- [ ] **Issue #13:** ✅ Already done — add comment to `lib/errors/AppError.ts`

- [ ] **Issue #14:** Add Retry-After header to rate limit response
  - [ ] Update `lib/rate-limit.ts` 429 response

---

## Files to Create

```
lib/
  ip.ts                          # IP validation + SSRF protection
  env.ts                         # Environment variable schema
  rate-limit.ts                  # Rate limiting utility
  middleware/
    cache-control.ts             # Cache control headers
components/
  ui/
    toast.tsx                    # Toast notification component (if not using shadcn)
```

## Files to Modify

```
app/
  [shortCode]/route.ts           # Add IP sanitization + rate limiting
  api/urls/route.ts              # Add rate limiting
  dashboard/page.tsx             # Add cache-control config
  analytics/page.tsx             # Add cache-control config
  layout.tsx                      # Import env validation
components/
  create-link-modal.tsx          # Replace alert with toast
  link-row-actions.tsx           # Replace alert with toast
lib/
  services/url.service.ts        # Add IP validation + redact logging
  schemas/url.schema.ts          # Add SSRF protection
  errors/AppError.ts             # Add comment about enum prevention
  api/with-auth.ts               # (optional) Add CSRF comment
next.config.ts                   # Add security headers
db/
  drizzle.ts                     # (no change, just reference)
```

---

## Environment Variables Required

Add to `.env`:

```bash
# Rate limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL=https://your-region-rest-upstash.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-token
```

No changes to existing Clerk or database variables.

---

## Risk Assessment Summary

| Category             | Status | Notes                                             |
| -------------------- | ------ | ------------------------------------------------- |
| **Authentication**   | ✅     | Strong (Clerk v7 + middleware)                    |
| **Authorization**    | ✅     | Strong (userId-scoped queries, enum prevention)   |
| **Input Validation** | ⚠️     | Partial (Zod schemas in place, but missing SSRF)  |
| **Data Protection**  | ⚠️     | Partial (missing rate limiting, no cache headers) |
| **Error Handling**   | ✅     | Strong (global error handler, no leakage)         |
| **API Security**     | ⚠️     | Partial (missing security headers, rate limits)   |
| **Infrastructure**   | ⚠️     | Partial (missing HSTS, env validation)            |

---

## Testing Checklist

After implementing fixes:

```bash
# Test IP validation
curl -H "X-Forwarded-For: malformed\r\nvalue" http://localhost:3000/abc1234
# Expected: IP sanitized or rejected

# Test SSRF protection
curl -X POST http://localhost:3000/api/urls -d '{"originalUrl": "javascript:void(0)"}'
# Expected: 400 error

# Test rate limiting
ab -n 150 http://localhost:3000/abc1234
# Expected: 429 after 100 requests

# Test security headers
curl -I http://localhost:3000/dashboard
# Expected: CSP, HSTS, X-Frame-Options headers present

# Test cache headers
curl -I http://localhost:3000/dashboard
# Expected: Cache-Control: private, no-store, must-revalidate

# Test HTTPS enforcement
curl -H "Host: example.com" http://localhost:3000/
# Expected: HSTS header forces HTTPS on next request
```

---

## Support & References

- **Full Report:** [SECURITY_AUDIT.md](./SECURITY_AUDIT.md)
- **OWASP Top 10:** https://owasp.org/Top10/
- **Next.js Security:** https://nextjs.org/docs/app/building-your-application/configuring/content-security-policy
- **Upstash Rate Limiting:** https://upstash.com/docs/redis/features/ratelimit

---

**Last Updated:** June 8, 2026
