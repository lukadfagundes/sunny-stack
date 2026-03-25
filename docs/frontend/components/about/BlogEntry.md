# BlogEntry

## Overview

A client-side component that fetches and displays the latest Bluesky post as a "blog entry." It handles rich text rendering with facets (links, hashtags, mentions), external embed cards, image embeds, and engagement metrics (likes, replies, reposts). The component features a Bluesky-themed blue header and dark background with full loading, error, and empty states.

**Source:** `src/components/about/BlogEntry.tsx`

## Props

This component accepts **no props**. It fetches its data from the `/api/bluesky` endpoint and uses the `profile` static import for the header title.

## State Management

| Hook | State Variable | Type | Initial Value | Purpose |
|------|---------------|------|---------------|---------|
| `useState` | `post` | `BlueskyPost \| null` | `null` | Stores the latest Bluesky post fetched from the API |
| `useState` | `loading` | `boolean` | `true` | Tracks whether the API request is in progress |
| `useState` | `error` | `boolean` | `false` | Tracks whether the API request failed |

## API Integration

### Bluesky Latest Post (`/api/bluesky`)
- **Method:** `GET`
- **Triggered:** On mount via `useEffect` (empty dependency array)
- **Response Type:** `BlueskyPost | null` (imported from `@/app/api/bluesky/route`)
- **Success:** Sets `post` state and `loading` to `false`
- **Error:** Sets `error` to `true` and `loading` to `false`

### BlueskyPost Type

```ts
interface BlueskyPost {
  text: string;
  facets: BlueskyFacet[];
  embed: BlueskyEmbed | null;
  likeCount: number;
  replyCount: number;
  repostCount: number;
  permalink: string;
  createdAt: string;
}
```

### BlueskyFacet Type

```ts
interface BlueskyFacet {
  index: { byteStart: number; byteEnd: number };
  features: BlueskyFacetFeature[];
}

interface BlueskyFacetFeature {
  $type: string;
  uri?: string;   // for links
  did?: string;   // for mentions
  tag?: string;   // for hashtags
}
```

### BlueskyEmbed Type

```ts
interface BlueskyEmbed {
  type: "external" | "images" | "unknown";
  external?: {
    uri: string;
    title: string;
    description: string;
    thumb?: string;
  };
  images?: {
    thumb: string;
    fullsize: string;
    alt: string;
  }[];
}
```

## Event Handlers

This component has **no explicit event handlers**. All interactivity is via native `<a>` tag links.

## Internal Helper Functions

### `buildSegments(text: string, facets: BlueskyFacet[]): RichSegment[]`

Processes Bluesky rich text by splitting the post text into segments based on facet byte offsets. Uses `TextEncoder`/`TextDecoder` for correct UTF-8 byte offset handling (critical for emoji and multibyte characters).

**RichSegment Interface:**

```ts
interface RichSegment {
  text: string;
  link?: string;    // external link URI
  tag?: string;     // hashtag (without #)
  mention?: string; // mention DID
}
```

**Supported Facet Types:**

| Facet `$type` | Rendered As | Link Target |
|---------------|------------|-------------|
| `app.bsky.richtext.facet#link` | `<a>` with original URI | External URL |
| `app.bsky.richtext.facet#tag` | `<a>` linking to Bluesky search | `https://bsky.app/search?q=%23{tag}` |
| `app.bsky.richtext.facet#mention` | `<a>` linking to profile | `https://bsky.app/profile/{did}` |

## Child Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `Image` | `next/image` | Renders embed thumbnails and images |
| `Heart` | `lucide-react` | Like count icon |
| `MessageCircle` | `lucide-react` | Reply count icon |
| `Repeat2` | `lucide-react` | Repost count icon |
| `CloudSun` | `lucide-react` | Bluesky icon in the header |

## Conditional Rendering States

1. **Loading:** Displays skeleton placeholders with pulsing animation (two text lines + one smaller line)
2. **Error:** Displays "Could not load latest post."
3. **Empty:** Displays "No posts to display." (when `post` is `null` after loading)
4. **Success:** Renders the full post with rich text, embeds, engagement, and date

## Rendering Structure (Success State)

1. **Rich Text:** Post text rendered as segments, with links/tags/mentions as styled `<a>` elements (color `#208BFE`)
2. **External Embed Card:** If `post.embed.type === "external"`, renders a card with thumbnail image, title, description, and hostname
3. **Image Embed:** If `post.embed.type === "images"`, renders images in a grid (single image full width, multiple in 2-column grid)
4. **Engagement Row:** Like count (Heart), reply count (MessageCircle), repost count (Repeat2)
5. **Date:** Formatted using `toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })`

## Data Sources

| Source | Import Path | Fields Used | Description |
|--------|-------------|-------------|-------------|
| `profile` | `@/lib/data/personal` | `name` | Used in the header title ("[Name]'s Latest Blog Entry") |
| `BlueskyPost` (type) | `@/app/api/bluesky/route` | All fields | API response type |
| `BlueskyFacet` (type) | `@/app/api/bluesky/route` | `index`, `features` | Rich text facet annotations |

## Styling Details

- **Header:** Bluesky blue (`background: #0560FF`, white text)
- **Content Background:** Dark navy (`#0A1929`)
- **Border:** `1px solid #1D3044`
- **Text Colors:** Post text `#E4E8EC`, links `#208BFE`, engagement `#8899A6`, date `#536471`
- **Font Family:** Apple system font stack

## Usage

```tsx
<BlogEntry />
```

## Integration Points

- **Parent:** Rendered within the About page layout as the "Latest Blog Entry" section.
- **API:** Depends on `/api/bluesky` endpoint returning a `BlueskyPost` object or `null`.
- **Data:** Uses `profile.name` from `@/lib/data/personal` for the section header.
- **Rich Text:** The `buildSegments` function handles Bluesky's AT Protocol rich text format with UTF-8 byte-offset facets.
