# Instagram Route

## Overview

Fetches the 5 most recent image posts from an Instagram account using the Instagram Graph API. Filters out VIDEO and CAROUSEL_ALBUM media types, returning only IMAGE posts with engagement metrics.

**Source:** `src/app/api/instagram/route.ts` (72 lines)

## Endpoint

`GET /api/instagram`

## Authentication

| Environment Variable     | Required | Description                                 |
| ------------------------ | -------- | ------------------------------------------- |
| `INSTAGRAM_ACCESS_TOKEN` | Yes      | Instagram Graph API long-lived access token |

If the token is missing, the endpoint returns `[]` with HTTP 200.

## Response Type

### `InstagramPost` (exported)

```typescript
interface InstagramPost {
  id: string; // Instagram media ID
  imageUrl: string; // Direct image URL
  caption: string; // Post caption (default: "")
  timestamp: string; // ISO 8601 timestamp
  permalink: string; // Direct link to the post on Instagram
  likeCount: number; // Like count (default: 0)
  commentsCount: number; // Comment count (default: 0)
}
```

## Internal Types

### `InstagramAPIMedia` (not exported)

```typescript
interface InstagramAPIMedia {
  id: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_url: string;
  caption?: string;
  timestamp: string;
  permalink: string;
  like_count?: number;
  comments_count?: number;
}
```

### `InstagramAPIResponse` (not exported)

```typescript
interface InstagramAPIResponse {
  data: InstagramAPIMedia[];
  paging?: {
    cursors: { before: string; after: string };
    next?: string;
  };
}
```

## Implementation Details

1. Fetches up to 50 posts from the Instagram Graph API with fields: `id,media_type,media_url,caption,timestamp,permalink,like_count,comments_count`
2. The access token is passed via the `Authorization: Bearer` header
3. Filters the response to `media_type === "IMAGE"` only
4. Takes the first 5 matching posts
5. Maps Instagram API snake_case fields to camelCase `InstagramPost` properties

### Why Fetch 50?

The API fetches 50 posts to ensure enough IMAGE posts remain after filtering out VIDEO and CAROUSEL_ALBUM types.

## Error Handling

| Condition            | Behavior                                    |
| -------------------- | ------------------------------------------- |
| Missing access token | Returns `[]` with HTTP 200                  |
| Instagram API error  | Logs error text, returns `[]` with HTTP 200 |
| Network exception    | Logs error, returns `[]` with HTTP 200      |

## Dependencies

- **External API:** Instagram Graph API (`graph.instagram.com/me/media`)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"`

## Usage

Consumed by the `PhotoGallery` component on the About page (`src/components/about/PhotoGallery.tsx`).

```typescript
const res = await fetch("/api/instagram");
const posts: InstagramPost[] = await res.json();
```
