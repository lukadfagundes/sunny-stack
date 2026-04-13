# Bluesky Route

## Overview

Fetches the latest non-reply post from a Bluesky (AT Protocol) account. Transforms raw AT Protocol feed data into a simplified `BlueskyPost` structure with embed handling, engagement metrics, and a constructed permalink.

**Source:** `src/app/api/bluesky/route.ts` (148 lines)

## Endpoint

`GET /api/bluesky`

## Authentication

| Environment Variable | Required | Description                                           |
| -------------------- | -------- | ----------------------------------------------------- |
| `BLUESKY_HANDLE`     | Yes      | The Bluesky account handle (e.g., `user.bsky.social`) |

If `BLUESKY_HANDLE` is not set, the endpoint returns `null` with HTTP 200.

## Response Type

### `BlueskyPost` (exported)

```typescript
interface BlueskyPost {
  text: string; // Post text content
  facets: BlueskyFacet[]; // Rich text annotations (links, mentions, hashtags)
  embed: BlueskyEmbed | null; // Attached media or link preview
  likeCount: number; // Number of likes (defaults to 0)
  replyCount: number; // Number of replies (defaults to 0)
  repostCount: number; // Number of reposts (defaults to 0)
  permalink: string; // Constructed URL: https://bsky.app/profile/{handle}/post/{rkey}
  createdAt: string; // ISO 8601 timestamp from the post record
}
```

### `BlueskyFacet` (exported)

```typescript
interface BlueskyFacet {
  index: { byteStart: number; byteEnd: number }; // Byte range in the post text
  features: BlueskyFacetFeature[]; // What the annotation represents
}
```

### `BlueskyFacetFeature` (exported)

```typescript
interface BlueskyFacetFeature {
  $type: string; // AT Protocol type identifier
  uri?: string; // Link URL (for link facets)
  did?: string; // DID (for mention facets)
  tag?: string; // Hashtag value (for tag facets)
}
```

### `BlueskyEmbed` (exported)

```typescript
interface BlueskyEmbed {
  type: "external" | "images" | "unknown"; // Embed category
  external?: {
    uri: string; // Link URL
    title: string; // Link preview title
    description: string; // Link preview description
    thumb?: string; // Thumbnail URL
  };
  images?: {
    thumb: string; // Thumbnail URL
    fullsize: string; // Full-size image URL
    alt: string; // Alt text
  }[];
}
```

## Internal Types

### `APIEmbed` (not exported)

Raw AT Protocol embed structure with `$type` discriminator field. Used to type the raw API response before transformation.

### `FeedViewPost` (not exported)

Raw AT Protocol feed item containing `post.uri`, `post.author.handle`, `post.record` (text, createdAt, facets), `post.embed`, and engagement counts.

## Implementation Details

### Data Flow

1. Constructs the AT Protocol public API URL with the configured handle
2. Fetches the author feed with `limit=1` and `filter=posts_no_replies`
3. Extracts the first feed item; returns `null` if empty
4. Constructs the permalink by extracting the `rkey` (last segment of the post URI)
5. Transforms the embed via `transformEmbed()` helper
6. Returns the assembled `BlueskyPost` object

### `transformEmbed(embed?: APIEmbed): BlueskyEmbed | null`

Internal helper that converts raw AT Protocol embed types to the simplified `BlueskyEmbed` format:

- `app.bsky.embed.external#view` with `external` data -> `{ type: "external", external: {...} }`
- `app.bsky.embed.images#view` with `images` data -> `{ type: "images", images: [...] }`
- Any other type or missing embed -> `null`

### Permalink Construction

```
URI:  at://did:plc:abc123/app.bsky.feed.post/3kxxxxxx
rkey: 3kxxxxxx (extracted via post.uri.split("/").pop())
URL:  https://bsky.app/profile/{handle}/post/{rkey}
```

## Error Handling

| Condition                 | Behavior                                      |
| ------------------------- | --------------------------------------------- |
| `BLUESKY_HANDLE` not set  | Returns `null` with HTTP 200                  |
| API returns non-OK status | Logs error text, returns `null` with HTTP 200 |
| Empty feed (no posts)     | Returns `null` with HTTP 200                  |
| Network/fetch exception   | Logs error, returns `null` with HTTP 200      |

All errors return HTTP 200 with a `null` body to enable graceful frontend degradation.

## Dependencies

- **External API:** `https://public.api.bsky.app/xrpc/app.bsky.feed.getAuthorFeed` (public API, no auth token required)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"` (no fetch-level caching)

## Usage

Consumed by the `BlogEntry` component on the About page (`src/components/about/BlogEntry.tsx`) and by the activity aggregation route (`src/app/api/activity/route.ts`).

```typescript
// Frontend fetch
const res = await fetch("/api/bluesky");
const post: BlueskyPost | null = await res.json();
```
