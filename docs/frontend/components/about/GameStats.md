# GameStats

## Overview

`GameStats` is a client-side component that displays detailed statistics for a specific Steam game, including its header banner, play status, total playtime, and an achievements breakdown with a progress bar and earned achievement grid. It fetches achievement data from a dedicated API endpoint and provides a "Back to Profile" navigation button.

**Source:** `src/components/about/GameStats.tsx`

## Props

| Prop     | Type         | Required | Description                                                                                               |
| -------- | ------------ | -------- | --------------------------------------------------------------------------------------------------------- |
| `game`   | `SteamGame`  | Yes      | The Steam game object containing `appid`, `name`, `headerImage`, `playtimeMinutes`, and `recentlyPlayed`. |
| `onBack` | `() => void` | Yes      | Callback invoked when the "Back to Profile" button is clicked.                                            |

## State Management

| Hook       | Variable              | Type                           | Initial | Description                                                                     |
| ---------- | --------------------- | ------------------------------ | ------- | ------------------------------------------------------------------------------- |
| `useState` | `achievements`        | `SteamAchievementData \| null` | `null`  | Achievement data for the game (achieved count, total, individual achievements). |
| `useState` | `achievementsLoading` | `boolean`                      | `true`  | Whether the achievements API request is in flight.                              |

## Derived State

| Variable             | Calculation                                                      | Description                                                                                                                            |
| -------------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| `achievementPercent` | `Math.round((achievements.achieved / achievements.total) * 100)` | Percentage of achievements earned, used for the progress bar width and display text. Returns `0` if no achievement data or total is 0. |

## API Integration

| Endpoint                                | Method | Trigger                            | Response Type                  | Description                                      |
| --------------------------------------- | ------ | ---------------------------------- | ------------------------------ | ------------------------------------------------ |
| `/api/steam/achievements?appid={appid}` | GET    | `useEffect` on `game.appid` change | `SteamAchievementData \| null` | Fetches achievement data for the specified game. |

**Fetch flow:**

1. When `game.appid` changes, fetches `/api/steam/achievements?appid={game.appid}`.
2. On success, stores the achievement data in state.
3. On failure, silently sets loading to `false` (achievements remain `null`).

## Event Handlers

| Handler                  | Element                  | Description                                        |
| ------------------------ | ------------------------ | -------------------------------------------------- |
| `onClick` (via `onBack`) | "Back to Profile" button | Calls the `onBack` prop callback to navigate back. |

## Helper Functions

| Function           | Signature                       | Description                                                                                                             |
| ------------------ | ------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| `formatPlaytime`   | `(minutes: number) => string`   | Converts minutes to a human-readable format. Under 1 hour: `"{minutes}m"`. 1+ hours: `"{hours.toFixed(1)} hrs"`.        |
| `formatUnlockDate` | `(timestamp: number) => string` | Converts a Unix timestamp to a formatted date string (e.g., "Mar 15, 2024"). Returns empty string for falsy timestamps. |

## Render Sections

1. **Header** -- Steam gradient header with game name and "Back to Profile" button.
2. **Hero banner** -- Full-width `headerImage` from Steam CDN.
3. **Status card** -- Shows "Played recently" (green) or "Not played recently" (grey) based on `game.recentlyPlayed`.
4. **Playtime card** -- Displays formatted total playtime in Steam blue (`#66c0f4`).
5. **Achievements card** -- Contains:
   - Loading state with "Loading..." text.
   - Progress summary: `achieved / total` count and percentage.
   - Progress bar with green fill (`#5ba32b`) and accessible `role="progressbar"` attributes.
   - Scrollable grid (max-height 312px) of earned achievements, each showing icon, display name, description, and unlock date.
   - "No achievements" fallback when data is null after loading.

## Child Components

None (renders plain HTML elements and `<img>` tags).

## Data Sources

| Source                    | Type                                 | Description                                                                                       |
| ------------------------- | ------------------------------------ | ------------------------------------------------------------------------------------------------- |
| `game` prop               | `SteamGame`                          | Passed from parent; contains `appid`, `name`, `headerImage`, `playtimeMinutes`, `recentlyPlayed`. |
| `/api/steam/achievements` | API                                  | Returns `SteamAchievementData` with `achieved`, `total`, and `achievements` array.                |
| `SteamGame`               | `@/app/api/steam/route`              | Type import.                                                                                      |
| `SteamAchievementData`    | `@/app/api/steam/achievements/route` | Type import.                                                                                      |

## Styling

- Steam-themed design consistent with `TopEight`: dark blue background (`#1b2838`), blue accents (`#66c0f4`), green for positive states (`#5ba32b`).
- Verdana font family throughout.
- Achievement grid uses a 2-column layout with scrollable overflow.
- Cards use `#2a475e` background with rounded corners.

## Usage

```tsx
<GameStats
  game={{
    appid: 12345,
    name: "Game Title",
    headerImage: "https://...",
    playtimeMinutes: 3600,
    recentlyPlayed: true,
  }}
  onBack={() => setSelectedGame(null)}
/>
```

## Integration Points

- Rendered by the About page when a user clicks a game in `TopEight`. The parent manages the selected game state and passes the `game` object and `onBack` callback.
- Depends on the Steam achievements API route being properly configured.
