# VideoCard

## Overview

A client-side component that renders an individual YouTube video card with an embedded video player (iframe), engagement metrics (views, likes, comments), a collapsible description toggle, and a formatted publish date. Large numbers are formatted with K/M suffixes for readability.

**Source:** `src/components/about/VideoCard.tsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `video` | `YouTubeVideo` | Yes | The YouTube video data object containing all fields needed for rendering |

### Props Interface

```ts
interface VideoCardProps {
  video: YouTubeVideo;
}
```

### YouTubeVideo Type

```ts
interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  publishedAt: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
}
```

## State Management

| Hook | State Variable | Type | Initial Value | Purpose |
|------|---------------|------|---------------|---------|
| `useState` | `descOpen` | `boolean` | `false` | Toggles the visibility of the video description text |

## API Integration

This component makes **no API calls**. It receives all data via the `video` prop.

## Event Handlers

| Handler | Element | Description |
|---------|---------|-------------|
| `() => setDescOpen((o) => !o)` | "Description" / "Hide description" `<button>` | Toggles the `descOpen` state to show/hide the video description |

## Child Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `ThumbsUp` | `lucide-react` | Like count icon |
| `MessageSquare` | `lucide-react` | Comment count icon |
| `Eye` | `lucide-react` | View count icon |
| `ChevronDown` | `lucide-react` | Shown when description is collapsed |
| `ChevronUp` | `lucide-react` | Shown when description is expanded |

## Helper Functions

### `formatCount(n: number): string`

Formats large numbers with K/M suffixes for compact display:

| Input Range | Output Format | Example |
|-------------|--------------|---------|
| >= 1,000,000 | `X.XM` | `1500000` -> `"1.5M"` |
| >= 1,000 | `X.XK` | `4500` -> `"4.5K"` |
| < 1,000 | Raw number | `750` -> `"750"` |

## Rendering Structure

1. **Embedded Video:** Aspect-video iframe with `src="https://www.youtube.com/embed/{video.id}"`, sandboxed with `allow-scripts allow-same-origin allow-popups`
2. **Title:** Rendered as `<h3>` with Roboto font
3. **Engagement Row:** View count (Eye icon), like count (ThumbsUp icon), comment count (MessageSquare icon) -- all formatted via `formatCount()`
4. **Description Toggle:** Conditionally rendered button (only if `video.description` is truthy) that toggles description visibility with chevron icons
5. **Description Text:** Shown when `descOpen` is `true`, with `whitespace-pre-line` for newline preservation
6. **Date:** Formatted using `toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })`

## Styling Details

- **Border:** Bottom border `1px solid #272727` separating cards in the feed
- **Title Color:** `#F1F1F1`
- **Engagement/Description Color:** `#AAAAAA`
- **Date Color:** `#717171`
- **Font Family:** Roboto, Arial, sans-serif
- **Iframe Security:** `sandbox="allow-scripts allow-same-origin allow-popups"`

## Usage

```tsx
<VideoCard video={youtubeVideo} />
```

## Integration Points

- **Parent:** `VideoGallery` passes individual `YouTubeVideo` objects from its fetched array.
- **Embedded Content:** Each card embeds a YouTube video player via iframe using the video ID.
- **Data:** All content is derived from the `video` prop; no external data fetching or static imports.
