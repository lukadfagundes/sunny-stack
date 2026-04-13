# YouTube Route

## Overview

Fetches the 5 most recent videos from a YouTube channel using a 3-step pipeline: channel lookup, uploads playlist retrieval, and parallel video statistics fetch. Returns an array of `YouTubeVideo` objects with titles, thumbnails, and engagement metrics.

**Source:** `src/app/api/youtube/route.ts` (122 lines)

## Endpoint

`GET /api/youtube`

## Authentication

| Environment Variable | Required | Description               |
| -------------------- | -------- | ------------------------- |
| `YOUTUBE_API_KEY`    | Yes      | YouTube Data API v3 key   |
| `YOUTUBE_CHANNEL_ID` | Yes      | Target YouTube channel ID |

If either variable is missing, the endpoint returns `[]` with HTTP 200.

## Response Type

### `YouTubeVideo` (exported)

```typescript
interface YouTubeVideo {
  id: string; // YouTube video ID
  title: string; // Video title
  description: string; // Video description
  thumbnailUrl: string; // Thumbnail URL (highest available quality)
  publishedAt: string; // ISO 8601 publish timestamp
  viewCount: number; // View count (parsed to integer, default 0)
  likeCount: number; // Like count (parsed to integer, default 0)
  commentCount: number; // Comment count (parsed to integer, default 0)
}
```

## Internal Types

### `PlaylistItemSnippet` (not exported)

Contains `resourceId.videoId`, `title`, `description`, `thumbnails` (high/medium/default), and `publishedAt`.

### `PlaylistItem` (not exported)

Wraps `snippet: PlaylistItemSnippet`.

### `VideoStatistics` (not exported)

Contains optional string fields: `viewCount`, `likeCount`, `commentCount`.

### `VideoItem` (not exported)

Contains `id: string` and `statistics: VideoStatistics`.

## Implementation Details

### 3-Step Pipeline

**Step 1 - Channel Lookup:**
Fetches `contentDetails` from the YouTube Channels API to obtain the uploads playlist ID via `relatedPlaylists.uploads`.

**Step 2 - Playlist Items:**
Fetches up to 5 items from the uploads playlist via the PlaylistItems API with `part=snippet`.

**Step 3 - Statistics (parallel):**
Joins all video IDs with commas and makes a single batch request to the Videos API with `part=statistics`. Statistics are indexed into a `Record<string, VideoStatistics>` map for O(1) lookup per video.

### Thumbnail Priority Chain

Thumbnails are selected in order of preference: `high` > `medium` > `default`. Falls back to empty string if none available.

### Numeric Parsing

All statistics values arrive as strings from the YouTube API and are parsed to integers using `parseInt(value ?? "0", 10)`.

## Error Handling

| Condition                     | Behavior                                                          |
| ----------------------------- | ----------------------------------------------------------------- |
| Missing API key or channel ID | Returns `[]` with HTTP 200                                        |
| Channel API error             | Logs error, returns `[]` with HTTP 200                            |
| No uploads playlist found     | Returns `[]` with HTTP 200                                        |
| Playlist API error            | Logs error, returns `[]` with HTTP 200                            |
| Empty playlist                | Returns `[]` with HTTP 200                                        |
| Statistics fetch failure      | Statistics map remains empty; videos still returned with 0 counts |
| Network exception             | Logs error, returns `[]` with HTTP 200                            |

## Dependencies

- **External API:** YouTube Data API v3 (`googleapis.com/youtube/v3/channels`, `playlistItems`, `videos`)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"` on all fetches

## Usage

Consumed by the `VideoGallery` component on the About page (`src/components/about/VideoGallery.tsx`) and the activity aggregation route (`src/app/api/activity/route.ts`).

```typescript
const res = await fetch("/api/youtube");
const videos: YouTubeVideo[] = await res.json();
```
