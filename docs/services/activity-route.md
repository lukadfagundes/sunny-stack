# Activity Route

## Overview

Aggregates last-activity timestamps from four platforms (GitHub, Bluesky, Instagram, YouTube) in parallel, determines the most recent activity, and computes an online/offline status using a 1-hour threshold. Powers the online status indicator across the site.

**Source:** `src/app/api/activity/route.ts` (143 lines)

## Endpoint

`GET /api/activity`

## Authentication

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `GITHUB_TOKEN` | Optional | GitHub personal access token |
| `BLUESKY_HANDLE` | Optional | Bluesky account handle |
| `INSTAGRAM_ACCESS_TOKEN` | Optional | Instagram Graph API token |
| `YOUTUBE_API_KEY` | Optional | YouTube Data API v3 key |
| `YOUTUBE_CHANNEL_ID` | Optional | YouTube channel ID |

All variables are optional. Platforms with missing credentials are silently skipped.

## Response Type

### `ActivityStatus` (exported)

```typescript
interface ActivityStatus {
  lastActivityAt: string | null; // ISO 8601 timestamp of most recent activity across all platforms
  isOnline: boolean;             // true if most recent activity is within 1 hour
}
```

## Implementation Details

### Constants

- `ONLINE_THRESHOLD`: `60 * 60 * 1000` (1 hour in milliseconds)
- `GITHUB_GRAPHQL`: `https://api.github.com/graphql`
- `GITHUB_USERNAME`: `"strawhatluka"` (hardcoded)

### Platform Fetchers (4 private async helpers)

Each returns `Promise<string | null>` (ISO 8601 timestamp or null):

1. **`getGitHubLastActivity()`** - GitHub GraphQL query for most recently pushed repository timestamp
2. **`getBlueskyLastActivity()`** - AT Protocol public API, fetches latest post's `createdAt`
3. **`getInstagramLastActivity()`** - Instagram Graph API, fetches most recent media `timestamp`
4. **`getYouTubeLastActivity()`** - YouTube Data API v3, 2-step: channel lookup -> uploads playlist -> latest video `publishedAt`

### Aggregation Logic

1. All 4 fetchers run in parallel via `Promise.all`
2. Null results are filtered out
3. Remaining timestamps are converted to epoch milliseconds
4. Invalid dates (NaN) are filtered out
5. If no valid timestamps remain, returns `{ lastActivityAt: null, isOnline: false }`
6. Otherwise, selects `Math.max()` of all timestamps
7. `isOnline` = `Date.now() - mostRecent < ONLINE_THRESHOLD`

## Error Handling

| Condition | Behavior |
|-----------|----------|
| All platform tokens missing | Returns `{ lastActivityAt: null, isOnline: false }` |
| Individual platform fetch fails | That platform returns `null`, others continue |
| No valid timestamps collected | Returns `{ lastActivityAt: null, isOnline: false }` |
| Top-level exception | Logs error, returns `{ lastActivityAt: null, isOnline: false }` |

Individual platform errors are silently caught and return `null` without affecting other platforms.

## Dependencies

- **External APIs:** GitHub GraphQL, Bluesky AT Protocol, Instagram Graph API, YouTube Data API v3
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"` on all fetches

## Usage

Consumed by the `ProfileCard` component on the About page to display online/offline status.

```typescript
const res = await fetch("/api/activity");
const status: ActivityStatus = await res.json();
```
