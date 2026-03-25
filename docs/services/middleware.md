# Proxy (Rate Limiter)

## Overview

IP-based rate limiter for all `/api/*` routes. Implements a sliding window algorithm with an in-memory `Map` store, 60-second windows, 30-request maximum per IP, and automatic stale entry cleanup when the map exceeds 10,000 entries.

**Source:** `src/proxy.ts` (49 lines)

## Scope

Applies to all API routes via the Next.js middleware matcher:

```typescript
export const config = {
  matcher: "/api/:path*",
};
```

Non-API requests (pages, static assets, etc.) pass through immediately via `NextResponse.next()`.

## Configuration

| Constant | Value | Description |
|----------|-------|-------------|
| `WINDOW_MS` | `60_000` (60 seconds) | Rate limit window duration |
| `MAX_REQUESTS` | `30` | Maximum requests per IP per window |
| `MAX_MAP_SIZE` | `10_000` | Maximum entries in the rate limit map before cleanup |

## Exports

### `proxy(request: NextRequest): NextResponse`

The rate limiting proxy function. Returns either `NextResponse.next()` (pass through) or a 429 JSON response.

### `config`

```typescript
{ matcher: "/api/:path*" }
```

## Implementation Details

### IP Resolution

Client IP is determined in order of precedence:
1. First entry from `x-forwarded-for` header (split by comma, trimmed)
2. `x-real-ip` header
3. `"unknown"` fallback

### Rate Limit Algorithm

```
For each request:
  1. If pathname does not start with "/api/", pass through
  2. Resolve client IP
  3. If map size > 10,000, clean up all expired entries
  4. Look up IP entry in map
  5. If no entry or entry expired (now > resetAt):
     - Create new entry: { count: 1, resetAt: now + 60000 }
     - Pass through
  6. Increment entry count
  7. If count > 30:
     - Return 429 with Retry-After header
  8. Otherwise, pass through
```

### Map Cleanup

When the map exceeds `MAX_MAP_SIZE` (10,000 entries), all entries with `now > resetAt` are deleted in a single sweep. This prevents unbounded memory growth from many unique IPs.

### Retry-After Header

When rate limited, the response includes a `Retry-After` header with the number of seconds until the window resets:

```typescript
"Retry-After": String(Math.ceil((entry.resetAt - now) / 1000))
```

## Error Responses

### 429 Too Many Requests

```json
{
  "error": "Too many requests"
}
```

Headers:
- `Retry-After: {seconds}` -- Seconds until the rate limit window resets

## Dependencies

- **Next.js:** `NextRequest`, `NextResponse` from `next/server`
- **Storage:** In-memory `Map<string, { count: number; resetAt: number }>`

## Usage

The proxy function is exported from `src/proxy.ts` and applied to matching API routes.
