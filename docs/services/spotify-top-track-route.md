# Spotify Top Track Route

## Overview

Fetches the user's current top track from Spotify using the medium-term time range (approximately last 6 months). Returns a single `SpotifyTopTrack` object with track details, artist names, album art, and a Spotify link.

**Source:** `src/app/api/spotify/top-track/route.ts` (83 lines)

## Endpoint

`GET /api/spotify/top-track`

## Authentication

Uses the shared Spotify token module (`src/app/api/spotify/token.ts`).

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `SPOTIFY_CLIENT_ID` | Yes | Spotify OAuth client ID |
| `SPOTIFY_CLIENT_SECRET` | Yes | Spotify OAuth client secret |
| `SPOTIFY_REFRESH_TOKEN` | Yes | Spotify OAuth refresh token |

If any credential is missing, the endpoint returns `null` with HTTP 200.

## Response Type

### `SpotifyTopTrack` (exported)

```typescript
interface SpotifyTopTrack {
  id: string;            // Spotify track ID
  name: string;          // Track name
  artist: string;        // Artist names joined with ", "
  albumName: string;     // Album name
  albumImageUrl: string; // First album image URL (largest available)
  spotifyUrl: string;    // Direct Spotify URL to the track
}
```

## Internal Types

### `SpotifyArtist` (not exported)

```typescript
interface SpotifyArtist { name: string; }
```

### `SpotifyImage` (not exported)

```typescript
interface SpotifyImage { url: string; width: number; height: number; }
```

### `SpotifyTrackItem` (not exported)

Contains `id`, `name`, `artists: SpotifyArtist[]`, `album` (with `name` and `images: SpotifyImage[]`), and `external_urls.spotify`.

## Implementation Details

1. Checks credentials via `hasSpotifyCredentials()`
2. Obtains access token via `getSpotifyAccessToken()` (with caching)
3. Fetches `https://api.spotify.com/v1/me/top/tracks?time_range=medium_term&limit=1`
4. If no items returned, returns `null`
5. Takes the first track item and maps it to `SpotifyTopTrack`
6. Artist names are joined with `", "` separator

## Error Handling

| Condition | Behavior |
|-----------|----------|
| Missing Spotify credentials | Returns `null` with HTTP 200 |
| Token refresh failure | Returns `null` with HTTP 200 |
| Spotify API error | Logs error text, returns `null` with HTTP 200 |
| Empty items array | Returns `null` with HTTP 200 |
| Network exception | Logs error, returns `null` with HTTP 200 |

## Dependencies

- **Shared Module:** `../token` (`hasSpotifyCredentials`, `getSpotifyAccessToken`)
- **External API:** Spotify Web API (`api.spotify.com/v1/me/top/tracks`)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"`

## Usage

Consumed by the `MusicPlayer` component on the About page (`src/components/about/MusicPlayer.tsx`).

```typescript
const res = await fetch("/api/spotify/top-track");
const track: SpotifyTopTrack | null = await res.json();
```
