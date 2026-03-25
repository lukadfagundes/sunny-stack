# Steam Games Route

## Overview

Fetches the top 8 most-played Steam games for a configured user, sorted by all-time playtime. Excludes non-game applications (e.g., Wallpaper Engine), fetches header images from the Steam Store API in parallel, and flags games with recent activity.

**Source:** `src/app/api/steam/route.ts` (81 lines)

## Endpoint

`GET /api/steam`

## Authentication

| Environment Variable | Required | Description |
|---------------------|----------|-------------|
| `STEAM_API_KEY` | Yes | Steam Web API key |
| `STEAM_ID` | Yes | Steam 64-bit user ID |

## Response Type

### `SteamGamesData` (exported)

```typescript
interface SteamGamesData {
  games: SteamGame[]; // Top 8 games sorted by playtime
}
```

### `SteamGame` (exported)

```typescript
interface SteamGame {
  appid: number;          // Steam application ID
  name: string;           // Game name (fallback: "App {appid}")
  playtimeMinutes: number; // Total playtime in minutes
  headerImage: string;    // Steam store header image URL
  recentlyPlayed: boolean; // true if playtime_2weeks > 0
}
```

## Internal Types

### `SteamApiGame` (not exported)

Raw Steam API game object with `appid`, optional `name`, `playtime_forever`, `playtime_2weeks`.

## Implementation Details

### Excluded Apps

A `Set` of app IDs to exclude from results:
- `431960` (Wallpaper Engine) -- a utility, not a game

### Processing Pipeline

1. Fetches all owned games via `IPlayerService/GetOwnedGames/v1` with `include_appinfo=1` and `include_played_free_games=1`
2. Filters out excluded app IDs
3. Sorts by `playtime_forever` descending
4. Takes the top 8
5. Fetches header images in parallel from `store.steampowered.com/api/appdetails` (one request per game)
6. Maps to `SteamGame[]` with computed `recentlyPlayed` flag

### Header Image Fetch

Each game's header image is fetched individually from the Steam Store API with `filters=basic`. If the fetch fails, an empty string is used as fallback.

## Error Handling

| Condition | Behavior |
|-----------|----------|
| Missing API key or Steam ID | Returns `null` with HTTP 200 |
| Steam API error | Logs status, returns `null` with HTTP 200 |
| Individual header image fetch fails | Empty string used for that game |
| Network exception | Logs error, returns `null` with HTTP 200 |

## Dependencies

- **External APIs:**
  - `api.steampowered.com/IPlayerService/GetOwnedGames/v1` (game list)
  - `store.steampowered.com/api/appdetails` (header images)
- **Next.js:** `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"` on all fetches

## Usage

Consumed by the `TopEight` component on the About page (`src/components/about/TopEight.tsx`).

```typescript
const res = await fetch("/api/steam");
const data: SteamGamesData | null = await res.json();
```
