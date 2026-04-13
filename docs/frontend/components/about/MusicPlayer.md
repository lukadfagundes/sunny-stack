# MusicPlayer

## Overview

`MusicPlayer` is a client-side component that displays the user's current top Spotify track as an embedded player. It fetches the top track from the Spotify API endpoint, renders a Spotify embed iframe when data is available, and provides loading, error, and empty states. An optional "Check out more music" button allows the parent to handle navigation to a music-focused view.

**Source:** `src/components/about/MusicPlayer.tsx`

## Props

| Prop          | Type         | Required | Description                                                                                                   |
| ------------- | ------------ | -------- | ------------------------------------------------------------------------------------------------------------- |
| `onViewMusic` | `() => void` | No       | Callback invoked when the "Check out more music" button is clicked. When omitted, the button is not rendered. |

## State Management

| Hook       | Variable  | Type                      | Initial | Description                                    |
| ---------- | --------- | ------------------------- | ------- | ---------------------------------------------- |
| `useState` | `track`   | `SpotifyTopTrack \| null` | `null`  | The fetched top track data (id, name, artist). |
| `useState` | `loading` | `boolean`                 | `true`  | Whether the API request is in flight.          |
| `useState` | `error`   | `boolean`                 | `false` | Whether the API request failed.                |

## API Integration

| Endpoint                 | Method | Trigger              | Response Type             | Description                                                                                    |
| ------------------------ | ------ | -------------------- | ------------------------- | ---------------------------------------------------------------------------------------------- |
| `/api/spotify/top-track` | GET    | `useEffect` on mount | `SpotifyTopTrack \| null` | Fetches the user's top Spotify track. The response includes `id`, `name`, and `artist` fields. |

**Fetch flow:**

1. On mount, fetches `/api/spotify/top-track`.
2. If the response is not OK, throws and enters the error state.
3. If the response contains a valid track (with a truthy `id`), sets it in state; otherwise sets `track` to `null`.
4. On any catch, sets `error` to `true`.

## Event Handlers

| Handler                       | Element                       | Description                                        |
| ----------------------------- | ----------------------------- | -------------------------------------------------- |
| `onClick` (via `onViewMusic`) | "Check out more music" button | Calls the `onViewMusic` prop callback if provided. |

## Render States

The component renders one of four states inside an 80px-tall container with a Spotify dark background (`#191414`):

1. **Loading** -- Two animated pulse skeleton bars.
2. **Error** -- A `Music` icon from lucide-react with "Could not load music." text.
3. **No track** -- A small `Music` icon with "No track available" text (e.g., when env is not configured).
4. **Track loaded** -- A Spotify embed iframe for the track, using `https://open.spotify.com/embed/track/{id}?theme=0`. The iframe is sandboxed with `allow-scripts allow-same-origin allow-popups`.

## Child Components

| Component | Source         | Description                          |
| --------- | -------------- | ------------------------------------ |
| `Music`   | `lucide-react` | Icon used in error and empty states. |

## Data Sources

| Source                   | Type                                | Description                                                       |
| ------------------------ | ----------------------------------- | ----------------------------------------------------------------- |
| `/api/spotify/top-track` | API                                 | Returns `SpotifyTopTrack` with `id`, `name`, and `artist` fields. |
| `SpotifyTopTrack` type   | `@/app/api/spotify/top-track/route` | TypeScript type import for the API response shape.                |

## Styling

- Spotify-themed design: `#191414` background, `#1DB954` green accents.
- The outer container has a 1px `#1DB954` border with rounded corners.
- The embed area is fixed at 80px height.
- The "Check out more music" button is 28px tall with Spotify green text on Spotify dark background.

## Usage

```tsx
<MusicPlayer onViewMusic={() => console.log("Navigate to music page")} />
```

## Integration Points

- Rendered within the About page layout alongside other profile widgets (TopEight, InterestsTable, etc.).
- The `onViewMusic` callback allows the parent to control navigation behavior (e.g., switching views or scrolling to a music section).
- Depends on the Spotify API route being properly configured with environment variables for authentication.
