# VideoGallery

## Overview

A client-side component that renders a YouTube-inspired video gallery. It fetches YouTube videos from an internal API endpoint and displays them as a vertical feed of `VideoCard` components with embedded iframes. The gallery includes a YouTube-style red gradient header, loading skeleton states, error handling, and an empty state fallback.

**Source:** `src/components/about/VideoGallery.tsx`

## Props

| Prop     | Type         | Required | Description                                                                                                          |
| -------- | ------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `onBack` | `() => void` | Yes      | Callback invoked when the user clicks "Back to Profile". Used by the parent to switch back to the main profile view. |

### Props Interface

```ts
interface VideoGalleryProps {
  onBack: () => void;
}
```

## State Management

| Hook       | State Variable | Type             | Initial Value | Purpose                                                 |
| ---------- | -------------- | ---------------- | ------------- | ------------------------------------------------------- |
| `useState` | `videos`       | `YouTubeVideo[]` | `[]`          | Stores the array of YouTube videos fetched from the API |
| `useState` | `loading`      | `boolean`        | `true`        | Tracks whether the API request is in progress           |
| `useState` | `error`        | `boolean`        | `false`       | Tracks whether the API request failed                   |

## API Integration

### YouTube Videos (`/api/youtube`)

- **Method:** `GET`
- **Triggered:** On mount via `useEffect` (empty dependency array)
- **Response Type:** `YouTubeVideo[]` (imported from `@/app/api/youtube/route`)
- **Success:** Sets `videos` state and `loading` to `false`
- **Error:** Sets `error` to `true` and `loading` to `false`

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

## Event Handlers

| Handler  | Element                      | Description                                                |
| -------- | ---------------------------- | ---------------------------------------------------------- |
| `onBack` | "Back to Profile" `<button>` | Delegates to parent callback to return to the profile view |

## Child Components

| Component   | Source         | Purpose                                                      |
| ----------- | -------------- | ------------------------------------------------------------ |
| `VideoCard` | `./VideoCard`  | Renders individual YouTube video cards with embedded players |
| `Youtube`   | `lucide-react` | Used as the icon in the header, error state, and empty state |

## Conditional Rendering States

1. **Loading:** Displays 3 skeleton placeholders with pulsing animation (aspect-video placeholder + title/subtitle/description text lines)
2. **Error:** Displays a Youtube icon with "Could not load videos. Please try again later."
3. **Empty:** Displays a Youtube icon with "No videos to display."
4. **Success:** Renders a vertical feed of `VideoCard` components within a `max-w-[600px]` container

## Styling Details

- **Header:** YouTube-style red gradient (`linear-gradient(135deg, #FF0000, #CC0000)`)
- **Background:** Dark black (`#0F0F0F`)
- **Border:** `1px solid #272727`
- **Font Family:** Roboto, Arial, sans-serif
- **Max Content Width:** 600px, centered

## Usage

```tsx
<VideoGallery onBack={() => setView("profile")} />
```

## Integration Points

- **Parent:** Controlled by the About page; the parent manages which view is active (profile vs. video gallery).
- **VideoCard:** Each video in the `videos` array is passed to a `VideoCard` child component.
- **API:** Depends on `/api/youtube` endpoint returning an array of `YouTubeVideo` objects.
