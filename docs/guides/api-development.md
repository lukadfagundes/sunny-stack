# API Development Guide

This guide covers best practices for developing REST API endpoints in sunny-stack.

---

## Architecture Overview

sunny-stack follows a **Next.js App Router API Routes** architecture:

- **Framework:** Next.js 16.2.0
- **Database:** None (external API integrations)
- **ORM:** None
- **Authentication:** Server-side environment variable tokens (no client auth). Each API route reads credentials from `process.env` and authenticates with external services directly.
- **Validation:** Manual validation (regex patterns for `appid`, `postId`; path traversal checks in the docs route)

---

## Project Structure

```
src/app/api/
├── bluesky/
│   └── route.ts             # GET /api/bluesky
├── youtube/
│   └── route.ts             # GET /api/youtube
├── github/
│   └── route.ts             # GET /api/github
├── activity/
│   └── route.ts             # GET /api/activity
├── spotify/
│   ├── token.ts             # Spotify OAuth token management (shared)
│   ├── top-track/
│   │   └── route.ts         # GET /api/spotify/top-track
│   └── wrapped/
│       └── route.ts         # GET /api/spotify/wrapped
├── steam/
│   ├── route.ts             # GET /api/steam
│   └── achievements/
│       └── route.ts         # GET /api/steam/achievements
├── docs/
│   └── route.ts             # GET /api/docs
└── instagram/
    └── route.ts             # GET /api/instagram
```

Each `route.ts` file exports a single `GET` function that serves as both the route definition and the handler. There are no separate controller, service, or model directories for API routes -- all logic is self-contained within each route file.

Shared utilities live in `src/lib/` (e.g., `github.ts` for GitHub GraphQL data) and `src/app/api/spotify/token.ts` (Spotify OAuth token management).

---

## Creating a New Endpoint

### Step 1: Create the Route File

Create a new directory under `src/app/api/` with a `route.ts` file:

```
src/app/api/your-resource/route.ts
```

Next.js App Router uses file-based routing. The directory name becomes the URL path segment.

### Step 2: Define Types

Define TypeScript interfaces for your response data at the top of the file. Export interfaces that other files may need:

```typescript
import { NextResponse } from "next/server";

export interface YourResourceData {
  id: string;
  name: string;
  value: number;
}
```

### Step 3: Implement the GET Handler

Export an async `GET` function. Follow the established pattern:

```typescript
export async function GET() {
  // 1. Check for required credentials
  const apiKey = process.env.YOUR_API_KEY;
  if (!apiKey) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    // 2. Fetch data from external API
    const response = await fetch("https://api.example.com/data", {
      headers: { Authorization: `Bearer ${apiKey}` },
      cache: "no-store",
    });

    // 3. Handle external API errors gracefully
    if (!response.ok) {
      console.error("Your Resource API error:", response.status);
      return NextResponse.json(null, { status: 200 });
    }

    // 4. Transform and type the response
    const json = await response.json();
    const result: YourResourceData = {
      id: json.id,
      name: json.name,
      value: json.value ?? 0,
    };

    // 5. Return typed response
    return NextResponse.json(result);
  } catch (error) {
    // 6. Log errors server-side, return graceful fallback
    console.error("Your Resource fetch error:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
```

### Step 4: Add Query Parameters (if needed)

For endpoints that accept query parameters, use `NextRequest`:

```typescript
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const paramValue = request.nextUrl.searchParams.get("paramName");

  // Validate the parameter
  if (!paramValue) {
    return NextResponse.json(null, { status: 200 });
  }

  if (!/^\d+$/.test(paramValue)) {
    return NextResponse.json(null, { status: 200 });
  }

  // ... fetch and return data
}
```

### Step 5: Update Environment Variables

If the new endpoint requires credentials:

1. Add the variable to `.env.example` with a descriptive comment
2. Add the variable to `.env.local` for local development
3. Document the variable in the [Deployment Guide](./deployment.md)

---

## Established Patterns

### Pattern: Graceful Fallback

Every API route returns data with a 200 status, even on failure. Missing credentials and external API failures return `null` (for single objects) or `[]` (for arrays):

```typescript
// Single object endpoints return null
return NextResponse.json(null, { status: 200 });

// Array endpoints return empty array
return NextResponse.json([], { status: 200 });
```

This ensures the frontend always receives a valid JSON response and can render gracefully without data.

### Pattern: Credential Guard

Every route checks for required environment variables before making any external API calls:

```typescript
const token = process.env.YOUR_TOKEN;
if (!token) {
  return NextResponse.json(null, { status: 200 });
}
```

### Pattern: Error Logging

Errors are logged server-side with descriptive prefixes but never exposed to clients:

```typescript
console.error("[your-resource] API error:", response.status);
console.error("[your-resource] Fetch failed:", error);
```

### Pattern: No Cache for External APIs

External API fetches use `cache: "no-store"` to ensure fresh data on every request:

```typescript
const response = await fetch(url, { cache: "no-store" });
```

### Pattern: Parallel Fetching

When an endpoint needs data from multiple sources, use `Promise.all` for parallel requests:

```typescript
const [tracksRes, artistsRes] = await Promise.all([
  fetch("https://api.spotify.com/v1/me/top/tracks", options),
  fetch("https://api.spotify.com/v1/me/top/artists", options),
]);
```

---

## Request Validation

Input validation is done inline within route handlers:

- `/api/steam/achievements` validates `appid` with `/^\d+$/` regex
- `/api/docs` validates `path` against traversal attacks (blocks `..`), restricts to `.md` files within `docs/` or `README.md`

Example validation from the steam achievements route:

```typescript
const appid = request.nextUrl.searchParams.get("appid");
if (!appid) {
  return NextResponse.json(null, { status: 200 });
}

if (!/^\d+$/.test(appid)) {
  return NextResponse.json(null, { status: 200 });
}
```

For the docs route, which is the only endpoint that returns 400/404 error codes:

```typescript
if (filePath.includes("..")) {
  return NextResponse.json({ error: "Invalid path" }, { status: 400 });
}

if (!filePath.endsWith(".md")) {
  return NextResponse.json({ error: "Invalid path" }, { status: 400 });
}
```

---

## Authentication & Authorization

No client-facing authentication. Server-side routes authenticate with external APIs using environment variable tokens (`GITHUB_TOKEN`, `INSTAGRAM_ACCESS_TOKEN`, `YOUTUBE_API_KEY`, etc.).

Spotify uses an OAuth 2.0 refresh token flow via `src/app/api/spotify/token.ts` with in-memory token caching:

```typescript
// src/app/api/spotify/token.ts provides:
import { getSpotifyAccessToken, hasSpotifyCredentials } from "../token";

// Check if Spotify credentials are configured
if (!hasSpotifyCredentials()) {
  return NextResponse.json(null, { status: 200 });
}

// Get a fresh access token (automatically refreshed and cached)
const accessToken = await getSpotifyAccessToken();
```

The token module handles:

- Checking if all three Spotify env vars are set (`SPOTIFY_CLIENT_ID`, `SPOTIFY_CLIENT_SECRET`, `SPOTIFY_REFRESH_TOKEN`)
- Refreshing the access token using the OAuth 2.0 refresh token grant
- Caching the access token in memory with a 60-second buffer before expiry

---

## Error Handling

### Standard Error Pattern

All API routes use try/catch with graceful fallbacks. Errors are logged server-side but never exposed to clients:

```typescript
try {
  // ... API logic
} catch (error) {
  console.error("[resource-name] Fetch failed:", error);
  return NextResponse.json(null, { status: 200 });
}
```

### Error Response Format (docs route only)

The `/api/docs` endpoint is the only route that returns non-200 error responses:

```json
{ "error": "Missing 'path' parameter" }
{ "error": "Invalid path" }
{ "error": "File not found" }
```

---

## Testing API Endpoints

### Unit Tests

API route tests live in `tests/api/` and mirror the `src/app/api/` structure:

```
tests/api/
├── bluesky.test.ts
├── youtube.test.ts
├── github.test.ts
├── activity.test.ts
├── spotify/
│   ├── top-track.test.ts
│   └── wrapped.test.ts
├── steam.test.ts
├── steam-achievements.test.ts
├── docs.test.ts
└── instagram.test.ts
```

Tests mock `fetch` and `process.env` to isolate route handlers:

```typescript
import { GET } from "@/app/api/github/route";

describe("GET /api/github", () => {
  it("returns null when GITHUB_TOKEN is not set", async () => {
    delete process.env.GITHUB_TOKEN;
    const response = await GET();
    const data = await response.json();
    expect(data).toBeNull();
    expect(response.status).toBe(200);
  });

  it("returns profile data when credentials are valid", async () => {
    process.env.GITHUB_TOKEN = "test-token";
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          user: {
            avatarUrl: "https://example.com/avatar.jpg",
            name: "Test User",
            bio: "Test bio",
            location: "Test City",
            repositories: { nodes: [{ pushedAt: "2026-01-01T00:00:00Z" }] },
          },
        },
      }),
    });

    const response = await GET();
    const data = await response.json();
    expect(data).toEqual({
      avatarUrl: "https://example.com/avatar.jpg",
      name: "Test User",
      bio: "Test bio",
      location: "Test City",
      lastPushedAt: "2026-01-01T00:00:00Z",
    });
  });
});
```

### Running Tests

```bash
# Run all tests
npm test

# Run only API tests
npx jest tests/api/

# Run a specific API test
npx jest tests/api/github.test.ts

# Run with coverage
npm run test:coverage
```

---

## API Versioning

Currently unversioned. All routes at `/api/*`. If versioning becomes necessary in the future, the recommended approach would be to nest routes under `/api/v2/` while maintaining `/api/` as v1 for backward compatibility.

---

## Performance Considerations

### ISR and Caching

The site uses ISR (Incremental Static Regeneration) with a 1-hour revalidation window for pages. API routes themselves use `cache: "no-store"` to fetch fresh data from external APIs on every request.

### Rate Limiting

The middleware (`src/middleware.ts`) rate-limits all `/api/*` requests to 30 per minute per IP address. This protects both the server and the external APIs from excessive requests.

---

## Debugging

### Enable Debug Logging

`console.error` is used for API failures with descriptive prefixes (e.g., `[github/profile] API responded`, `Bluesky API error:`, `Steam API error:`). Errors are logged server-side but never exposed to clients -- all routes return `null` or empty arrays as graceful fallbacks.

To debug an API route locally:

1. Start the dev server: `npm run dev`
2. Make a request: `curl http://localhost:3000/api/github`
3. Check the terminal output for any error logs

### API Testing Tools

- **cURL:** Command-line API testing (see examples above)
- **Postman:** GUI for testing API endpoints
- **Thunder Client:** VS Code extension for API testing
- **Browser DevTools:** Network tab for inspecting requests/responses

---

## Complete Example: Adding a New Service

Here is a full example of adding a hypothetical Twitter/X endpoint:

**1. Create the route file:**

```typescript
// src/app/api/twitter/route.ts
import { NextResponse } from "next/server";

export interface TwitterPost {
  id: string;
  text: string;
  likeCount: number;
  retweetCount: number;
  createdAt: string;
  permalink: string;
}

export async function GET() {
  const bearerToken = process.env.TWITTER_BEARER_TOKEN;
  if (!bearerToken) {
    return NextResponse.json(null, { status: 200 });
  }

  try {
    const response = await fetch(
      "https://api.twitter.com/2/users/me/tweets?max_results=1&tweet.fields=public_metrics,created_at",
      {
        headers: { Authorization: `Bearer ${bearerToken}` },
        cache: "no-store",
      },
    );

    if (!response.ok) {
      console.error("[twitter] API error:", response.status);
      return NextResponse.json(null, { status: 200 });
    }

    const json = await response.json();
    const tweet = json.data?.[0];
    if (!tweet) {
      return NextResponse.json(null, { status: 200 });
    }

    const result: TwitterPost = {
      id: tweet.id,
      text: tweet.text,
      likeCount: tweet.public_metrics?.like_count ?? 0,
      retweetCount: tweet.public_metrics?.retweet_count ?? 0,
      createdAt: tweet.created_at,
      permalink: `https://twitter.com/i/web/status/${tweet.id}`,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[twitter] Fetch failed:", error);
    return NextResponse.json(null, { status: 200 });
  }
}
```

**2. Add to `.env.example`:**

```bash
# Twitter/X
TWITTER_BEARER_TOKEN=
```

**3. Write tests:**

```typescript
// tests/api/twitter.test.ts
import { GET } from "@/app/api/twitter/route";

describe("GET /api/twitter", () => {
  it("returns null when TWITTER_BEARER_TOKEN is not set", async () => {
    delete process.env.TWITTER_BEARER_TOKEN;
    const response = await GET();
    expect(await response.json()).toBeNull();
  });

  // ... additional test cases
});
```

---

## Related Documentation

- [API Reference](../api/README.md) - Complete endpoint documentation
- [Getting Started](./getting-started.md) - Project setup guide
- [Deployment Guide](./deployment.md) - Production deployment

---

_Last updated: 2026-03-24_
