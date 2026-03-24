# MusicGallery

## Overview

A client-side component that renders a Spotify-inspired music gallery displaying the user's recent favorite tracks, artists, and top genres. It fetches data from the Spotify Wrapped API endpoint and presents three ranked sections: Top Tracks (with album art), Top Artists (with circular profile images), and Top Genres (as colored pill badges). The gallery features a Spotify-green gradient header and dark background.

**Source:** `src/components/about/MusicGallery.tsx`

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onBack` | `() => void` | Yes | Callback invoked when the user clicks "Back to Profile". Used by the parent to switch back to the main profile view. |

### Props Interface

```ts
interface MusicGalleryProps {
  onBack: () => void;
}
```

## State Management

| Hook | State Variable | Type | Initial Value | Purpose |
|------|---------------|------|---------------|---------|
| `useState` | `data` | `SpotifyWrappedData \| null` | `null` | Stores the Spotify wrapped data (tracks, artists, genres) fetched from the API |
| `useState` | `loading` | `boolean` | `true` | Tracks whether the API request is in progress |
| `useState` | `error` | `boolean` | `false` | Tracks whether the API request failed |

## API Integration

### Spotify Wrapped (`/api/spotify/wrapped`)
- **Method:** `GET`
- **Triggered:** On mount via `useEffect` (empty dependency array)
- **Response Type:** `SpotifyWrappedData | null` (imported from `@/app/api/spotify/wrapped/route`)
- **Success:** Sets `data` state (only if `result` is truthy and `result.tracks` exists) and `loading` to `false`
- **Error:** Sets `error` to `true` and `loading` to `false`

### SpotifyWrappedData Type

```ts
interface SpotifyWrappedData {
  tracks: SpotifyWrappedTrack[];
  artists: SpotifyWrappedArtist[];
  topGenres: string[];
  year: number;
}

interface SpotifyWrappedTrack {
  id: string;
  name: string;
  artist: string;
  albumName: string;
  albumImageUrl: string;
  spotifyUrl: string;
}

interface SpotifyWrappedArtist {
  id: string;
  name: string;
  imageUrl: string;
  genres: string[];
  spotifyUrl: string;
}
```

## Event Handlers

| Handler | Element | Description |
|---------|---------|-------------|
| `onBack` | "Back to Profile" `<button>` | Delegates to parent callback to return to the profile view |

## Child Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `Image` | `next/image` | Renders album art (48x48, square, rounded) and artist images (48x48, circular) |
| `Music` | `lucide-react` | Used as the icon in the header, error state, empty state, and as a fallback for artists without images |

## Conditional Rendering States

1. **Loading:** Displays skeleton placeholders -- a title line plus 5 rows of album art + text lines with pulsing animation
2. **Error:** Displays a Music icon with "Could not load music data. Please try again later."
3. **Empty:** Displays a Music icon with "No music data to display." (when `data` is `null` after loading)
4. **Success:** Renders three sections: Top Tracks, Top Artists, Top Genres

## Rendering Structure (Success State)

### Header
- Title: "Luka's Recent Favorites" (white, bold, `text-lg`)

### 1. Top Tracks Section
- Subheading: "TOP TRACKS" (Spotify green, uppercase, tracked)
- Each track renders as a clickable row linking to Spotify:
  - Rank number (1-based index)
  - Album artwork (48x48 rounded square via `next/image`)
  - Track name (white, truncated)
  - Artist name (gray, truncated)
- Background per row: `#282828`

### 2. Top Artists Section
- Subheading: "TOP ARTISTS" (Spotify green, uppercase, tracked)
- Each artist renders as a clickable row linking to Spotify:
  - Rank number (1-based index)
  - Artist image (48x48 rounded circle via `next/image`), or a `Music` icon fallback if `imageUrl` is empty
  - Artist name (white, truncated)
  - Genres (gray, comma-separated, truncated) -- only shown if `genres.length > 0`
- Background per row: `#282828`

### 3. Top Genres Section
- Subheading: "TOP GENRES" (Spotify green, uppercase, tracked)
- Genres rendered as pill badges (`rounded-full`, `px-3 py-1`)
- Badge colors: Spotify green background (`#1DB954`) with dark text (`#191414`)
- Layout: `flex flex-wrap gap-2`

## Styling Details

- **Header:** Spotify green gradient (`linear-gradient(135deg, #1DB954, #1ed760)`)
- **Background:** Spotify dark (`#191414`)
- **Border:** `1px solid #1DB954`
- **Row Background:** `#282828`
- **Accent Color:** `#1DB954` (Spotify green)
- **Text Colors:** Names in `#FFFFFF`, metadata in `#B3B3B3`, rank numbers in `#B3B3B3`
- **Font Family:** Apple system font stack

## Usage

```tsx
<MusicGallery onBack={() => setView("profile")} />
```

## Integration Points

- **Parent:** Controlled by the About page; the parent manages which view is active (profile vs. music gallery).
- **API:** Depends on `/api/spotify/wrapped` endpoint returning a `SpotifyWrappedData` object or `null`.
- **External Links:** Each track and artist row links to the corresponding Spotify URL (opens in new tab).
- **Fallback:** If no artist image is available, a `Music` icon from lucide-react is displayed in a gray circle.
