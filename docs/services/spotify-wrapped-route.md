# Spotify Wrapped Route

## Overview

Generates a Spotify Wrapped-style summary containing the user's top 5 tracks, top 5 artists, and aggregated top 10 genres (by frequency across artists). Uses the medium-term time range and fetches tracks and artists in parallel.

**Source:** `src/app/api/spotify/wrapped/route.ts` (131 lines)

## Endpoint

`GET /api/spotify/wrapped`

## Authentication

Uses the shared Spotify token module (`src/app/api/spotify/token.ts`).

| Environment Variable    | Required | Description                 |
| ----------------------- | -------- | --------------------------- |
| `SPOTIFY_CLIENT_ID`     | Yes      | Spotify OAuth client ID     |
| `SPOTIFY_CLIENT_SECRET` | Yes      | Spotify OAuth client secret |
| `SPOTIFY_REFRESH_TOKEN` | Yes      | Spotify OAuth refresh token |

## Response Type

### `SpotifyWrappedData` (exported)

```typescript
interface SpotifyWrappedData {
  tracks: SpotifyWrappedTrack[]; // Top 5 tracks
  artists: SpotifyWrappedArtist[]; // Top 5 artists
  topGenres: string[]; // Top 10 genres by frequency
  year: number; // Current year (new Date().getFullYear())
}
```

### `SpotifyWrappedTrack` (exported)

```typescript
interface SpotifyWrappedTrack {
  id: string; // Spotify track ID
  name: string; // Track name
  artist: string; // Artist names joined with ", "
  albumName: string; // Album name
  albumImageUrl: string; // First album image URL
  spotifyUrl: string; // Direct Spotify URL
}
```

### `SpotifyWrappedArtist` (exported)

```typescript
interface SpotifyWrappedArtist {
  id: string; // Spotify artist ID
  name: string; // Artist name
  imageUrl: string; // First artist image URL
  genres: string[]; // Genre tags for this artist
  spotifyUrl: string; // Direct Spotify URL
}
```

## Internal Types

### `SpotifyAPITrack` (not exported)

Raw Spotify track object with `id`, `name`, `artists[].name`, `album.name`, `album.images[]`, `external_urls.spotify`.

### `SpotifyAPIArtist` (not exported)

Raw Spotify artist object with `id`, `name`, `images[]`, `genres[]`, `external_urls.spotify`.

## Implementation Details

### Parallel Fetch

Tracks and artists are fetched simultaneously via `Promise.all`:

- `https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=5`
- `https://api.spotify.com/v1/me/top/artists?time_range=medium_term&limit=5`

### Genre Aggregation

1. Iterates over all artists and their genre arrays
2. Counts genre frequency in a `Record<string, number>` map
3. Sorts by count descending
4. Takes the top 10 genres

### Year Injection

The `year` field is set to `new Date().getFullYear()` at response time.

## Error Handling

| Condition                          | Behavior                                                  |
| ---------------------------------- | --------------------------------------------------------- |
| Missing Spotify credentials        | Returns `null` with HTTP 200                              |
| Token refresh failure              | Returns `null` with HTTP 200                              |
| Either tracks or artists API fails | Logs first failing response, returns `null` with HTTP 200 |
| Network exception                  | Logs error, returns `null` with HTTP 200                  |

## Dependencies

- **Shared Module:** `../token` (`hasSpotifyCredentials`, `getSpotifyAccessToken`)
- **External API:** Spotify Web API (`/me/top/tracks`, `/me/top/artists`)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"`

## Usage

Consumed by the `MusicGallery` component on the About page (`src/components/about/MusicGallery.tsx`).

```typescript
const res = await fetch("/api/spotify/wrapped");
const data: SpotifyWrappedData | null = await res.json();
```
