# PostCard

## Overview

A client-side presentational component that renders an individual Instagram post card. It displays the post image (linking to the original Instagram permalink), engagement metrics (like count, comment count), the caption, and a formatted date. This component is used as a child of `PhotoGallery`.

**Source:** `src/components/about/PostCard.tsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `post` | `InstagramPost` | Yes | The Instagram post data object containing all fields needed for rendering |

### Props Interface

```ts
interface PostCardProps {
  post: InstagramPost;
}
```

### InstagramPost Type

```ts
interface InstagramPost {
  id: string;
  imageUrl: string;
  caption: string;
  timestamp: string;
  permalink: string;
  likeCount: number;
  commentsCount: number;
}
```

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**. It receives all data via the `post` prop.

## Event Handlers

This component has **no explicit event handlers**. The image is wrapped in a native `<a>` tag that links to the Instagram permalink.

## Child Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `Image` | `next/image` | Renders the Instagram post image with optimized loading (`fill` layout, responsive `sizes`) |
| `Heart` | `lucide-react` | Like count icon |
| `MessageCircle` | `lucide-react` | Comment count icon |

## Rendering Structure

1. **Image Section:** Aspect-square container with `next/image` fill, wrapped in an `<a>` linking to `post.permalink` (opens in new tab)
2. **Engagement Row:** Displays like count with Heart icon and comment count with MessageCircle icon
3. **Caption:** Conditionally rendered if `post.caption` is truthy
4. **Date:** Formatted using `toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })`

## Styling Details

- **Border:** Bottom border `1px solid #262626` separating cards in the feed
- **Text Colors:** Engagement metrics in `#FAFAFA`, caption in `#A8A8A8`, date in `#737373`
- **Image:** Responsive `sizes="(max-width: 640px) 100vw, 600px"`, `object-cover`
- **Padding:** `px-3 pt-2 pb-8` for the content area below the image

## Usage

```tsx
<PostCard post={instagramPost} />
```

## Integration Points

- **Parent:** `PhotoGallery` passes individual `InstagramPost` objects from its fetched array.
- **External Link:** Each card links to the original Instagram post via `post.permalink`.
- **Data:** All content is derived from the `post` prop; no external data fetching or static imports.
