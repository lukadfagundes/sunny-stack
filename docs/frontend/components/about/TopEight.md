# TopEight

## Overview

`TopEight` is a client-side component that displays the user's top 8 most-played Steam games in a 2-column grid. It fetches game data from the Steam API endpoint, renders each game as a clickable card with its header image and name, and handles loading, error, and success states. The component is styled to match the Steam platform's dark blue aesthetic.

**Source:** `src/components/about/TopEight.tsx`

## Props

| Prop         | Type                        | Required | Description                                                                                               |
| ------------ | --------------------------- | -------- | --------------------------------------------------------------------------------------------------------- |
| `onViewGame` | `(game: SteamGame) => void` | No       | Callback invoked when a game card is clicked. Receives the full `SteamGame` object for the selected game. |

## State Management

| Hook       | Variable  | Type          | Initial | Description                                            |
| ---------- | --------- | ------------- | ------- | ------------------------------------------------------ |
| `useState` | `games`   | `SteamGame[]` | `[]`    | Array of top Steam games fetched from the API.         |
| `useState` | `error`   | `boolean`     | `false` | Whether the API request failed or returned empty data. |
| `useState` | `loading` | `boolean`     | `true`  | Whether the API request is in flight.                  |

## API Integration

| Endpoint     | Method | Trigger              | Response Type            | Description                                                                                   |
| ------------ | ------ | -------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `/api/steam` | GET    | `useEffect` on mount | `SteamGamesData \| null` | Fetches the user's top Steam games. Response includes a `games` array of `SteamGame` objects. |

**Fetch flow:**

1. On mount, fetches `/api/steam`.
2. If the response is not OK, throws and enters the error state.
3. If the response data contains a non-empty `games` array, sets it in state; otherwise sets `error` to `true`.
4. On any catch, sets `error` to `true`.

## Event Handlers

| Handler        | Element          | Description                                                                        |
| -------------- | ---------------- | ---------------------------------------------------------------------------------- |
| `onClick`      | Game card button | Calls `onViewGame?.(game)` with the clicked game's data.                           |
| `onMouseEnter` | Game card button | Sets the card background to `#2a475e` and border to `#66c0f4` (Steam hover style). |
| `onMouseLeave` | Game card button | Resets card background and border to transparent.                                  |

## Render States

1. **Loading** -- Displays "Loading..." in italicized Steam grey text (`#8f98a0`).
2. **Error** -- Displays "Unable to load Steam data" in italicized Steam grey text.
3. **Games loaded** -- A 2-column grid of game cards, each showing the game's `headerImage` and `name`.

## Child Components

None (the component renders plain HTML elements and `<img>` tags).

## Data Sources

| Source                        | Type                    | Description                                                                 |
| ----------------------------- | ----------------------- | --------------------------------------------------------------------------- |
| `/api/steam`                  | API                     | Returns `SteamGamesData` containing a `games` array of `SteamGame` objects. |
| `profile`                     | `@/lib/data/personal`   | Used for `profile.name` to display in the header as "{name}'s Top 8 Games". |
| `SteamGame`, `SteamGamesData` | `@/app/api/steam/route` | TypeScript type imports for the API response shape.                         |

## Styling

- Steam-themed design: dark blue background (`#1b2838`), gradient header (`#2a475e` to `#1b2838`).
- Header has a bottom border in Steam blue (`#66c0f4`).
- Game card names use Steam text color (`#c7d5e0`) with Verdana font.
- Hover state adds Steam blue border and darker background.
- Images use `headerImage` URLs from Steam's CDN.

## Usage

```tsx
<TopEight onViewGame={(game) => console.log("Selected:", game.name)} />
```

## Integration Points

- Rendered within the About page layout as a profile widget.
- The `onViewGame` callback typically triggers the parent to render the `GameStats` component for the selected game, creating a drill-down interaction.
- Depends on the Steam API route being properly configured with environment variables.
