# Steam Achievements Route

## Overview

Fetches achievement data for a specific Steam game. Retrieves both the player's earned achievements and the game's achievement schema, then merges them to provide display names, descriptions, and icons sorted by unlock time.

**Source:** `src/app/api/steam/achievements/route.ts` (111 lines)

## Endpoint

`GET /api/steam/achievements?appid={appid}`

## Authentication

| Environment Variable | Required | Description          |
| -------------------- | -------- | -------------------- |
| `STEAM_API_KEY`      | Yes      | Steam Web API key    |
| `STEAM_ID`           | Yes      | Steam 64-bit user ID |

## Query Parameters

| Parameter | Type   | Required | Validation              | Description          |
| --------- | ------ | -------- | ----------------------- | -------------------- |
| `appid`   | string | Yes      | `/^\d+$/` (digits only) | Steam application ID |

## Response Type

### `SteamAchievementData` (exported)

```typescript
interface SteamAchievementData {
  achieved: number; // Count of earned achievements
  total: number; // Total achievement count for the game
  achievements: SteamEarnedAchievement[]; // Earned achievements sorted by unlock time (newest first)
}
```

### `SteamEarnedAchievement` (exported)

```typescript
interface SteamEarnedAchievement {
  apiname: string; // Internal achievement identifier
  displayName: string; // Human-readable achievement name (from schema, fallback: apiname)
  description: string; // Achievement description (from schema, fallback: "")
  icon: string; // Achievement icon URL (from schema, fallback: "")
  unlocktime: number; // Unix timestamp when the achievement was earned
}
```

## Internal Types

### `PlayerAchievement` (not exported)

```typescript
interface PlayerAchievement {
  apiname: string;
  achieved: number; // 1 = earned, 0 = not earned
  unlocktime: number; // Unix timestamp
}
```

### `SchemaAchievement` (not exported)

```typescript
interface SchemaAchievement {
  name: string;
  displayName: string;
  description?: string;
  icon: string;
  icongray: string;
  hidden: number;
}
```

## Implementation Details

### Parallel Fetch

Player achievements and game schema are fetched simultaneously via `Promise.all`:

- `ISteamUserStats/GetPlayerAchievements/v1` -- player's achievement state
- `ISteamUserStats/GetSchemaForGame/v2` -- game's achievement definitions

### Schema Lookup

A `Map<string, SchemaAchievement>` is built from the schema response for O(1) lookup when enriching each player achievement with display name, description, and icon.

### Processing Pipeline

1. Validates `appid` query parameter (must be digits only)
2. Fetches player achievements and game schema in parallel
3. Checks for `playerstats.success === false` (game may not support achievements)
4. Builds schema map from game definitions
5. Filters to earned achievements only (`achieved === 1`)
6. Sorts by `unlocktime` descending (most recent first)
7. Maps each earned achievement to `SteamEarnedAchievement` using schema lookup

## Error Handling

| Condition                       | Behavior                                        |
| ------------------------------- | ----------------------------------------------- |
| Missing API key or Steam ID     | Returns `null` with HTTP 200                    |
| Missing `appid` parameter       | Returns `null` with HTTP 200                    |
| Invalid `appid` format          | Returns `null` with HTTP 200                    |
| Player achievements API fails   | Returns `null` with HTTP 200                    |
| `playerstats.success === false` | Returns `null` with HTTP 200                    |
| No achievements exist           | Returns `null` with HTTP 200                    |
| Schema fetch fails              | Achievements still returned with fallback names |
| Network exception               | Returns `null` with HTTP 200                    |

## Dependencies

- **External APIs:**
  - `api.steampowered.com/ISteamUserStats/GetPlayerAchievements/v1`
  - `api.steampowered.com/ISteamUserStats/GetSchemaForGame/v2`
- **Next.js:** `NextRequest`, `NextResponse` from `next/server`
- **Caching:** `cache: "no-store"` on all fetches

## Usage

Consumed by the `GameStats` component on the About page (`src/components/about/GameStats.tsx`).

```typescript
const res = await fetch(`/api/steam/achievements?appid=${game.appid}`);
const data: SteamAchievementData | null = await res.json();
```
