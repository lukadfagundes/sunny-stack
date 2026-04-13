# PhotoGallery

## Overview

A client-side component that renders an Instagram-inspired photo gallery. It fetches Instagram posts from an internal API endpoint and displays them as a vertical feed of `PostCard` components. The gallery includes an Instagram-style gradient header, loading skeleton states, error handling, and an empty state fallback.

**Source:** `src/components/about/PhotoGallery.tsx`

## Props

| Prop     | Type         | Required | Description                                                                                                          |
| -------- | ------------ | -------- | -------------------------------------------------------------------------------------------------------------------- |
| `onBack` | `() => void` | Yes      | Callback invoked when the user clicks "Back to Profile". Used by the parent to switch back to the main profile view. |

### Props Interface

```ts
interface PhotoGalleryProps {
  onBack: () => void;
}
```

## State Management

| Hook       | State Variable | Type              | Initial Value | Purpose                                                  |
| ---------- | -------------- | ----------------- | ------------- | -------------------------------------------------------- |
| `useState` | `posts`        | `InstagramPost[]` | `[]`          | Stores the array of Instagram posts fetched from the API |
| `useState` | `loading`      | `boolean`         | `true`        | Tracks whether the API request is in progress            |
| `useState` | `error`        | `boolean`         | `false`       | Tracks whether the API request failed                    |

## API Integration

### Instagram Posts (`/api/instagram`)

- **Method:** `GET`
- **Triggered:** On mount via `useEffect` (empty dependency array)
- **Response Type:** `InstagramPost[]` (imported from `@/app/api/instagram/route`)
- **Success:** Sets `posts` state and `loading` to `false`
- **Error:** Sets `error` to `true` and `loading` to `false`

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

## Event Handlers

| Handler  | Element                      | Description                                                |
| -------- | ---------------------------- | ---------------------------------------------------------- |
| `onBack` | "Back to Profile" `<button>` | Delegates to parent callback to return to the profile view |

## Child Components

| Component   | Source         | Purpose                                                      |
| ----------- | -------------- | ------------------------------------------------------------ |
| `PostCard`  | `./PostCard`   | Renders individual Instagram post cards within the feed      |
| `Instagram` | `lucide-react` | Used as the icon in the header, error state, and empty state |

## Conditional Rendering States

1. **Loading:** Displays 3 skeleton placeholders with pulsing animation (aspect-square image placeholder + text lines)
2. **Error:** Displays an Instagram icon with "Could not load photos. Please try again later."
3. **Empty:** Displays an Instagram icon with "No photos to display."
4. **Success:** Renders a vertical feed of `PostCard` components within a `max-w-[600px]` container

## Styling Details

- **Header:** Instagram-style rainbow gradient (`linear-gradient(45deg, #405DE6, ... #FCAF45)`)
- **Background:** Pure black (`#000000`)
- **Border:** `1px solid #262626`
- **Font Family:** Apple system font stack
- **Max Content Width:** 600px, centered

## Usage

```tsx
<PhotoGallery onBack={() => setView("profile")} />
```

## Integration Points

- **Parent:** Controlled by the About page; the parent manages which view is active (profile vs. photo gallery).
- **PostCard:** Each post in the `posts` array is passed to a `PostCard` child component.
- **API:** Depends on `/api/instagram` endpoint returning an array of `InstagramPost` objects.
