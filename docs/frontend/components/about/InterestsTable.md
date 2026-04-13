# InterestsTable

## Overview

`InterestsTable` is a client-side component that renders a table of personal interests organized by category (General, Music, Movies, Television, Books, Heroes). Each category's values are displayed as colored badge pills. The Music row is special -- it dynamically fetches top genres from the Spotify Wrapped API endpoint rather than using static data.

**Source:** `src/components/about/InterestsTable.tsx`

## Props

This component takes no props.

## State Management

| Hook       | Variable      | Type       | Initial | Description                                                            |
| ---------- | ------------- | ---------- | ------- | ---------------------------------------------------------------------- |
| `useState` | `genres`      | `string[]` | `[]`    | Top music genres fetched from the Spotify Wrapped API.                 |
| `useState` | `genresError` | `boolean`  | `false` | Whether the Spotify Wrapped API request failed or returned empty data. |

## API Integration

| Endpoint               | Method | Trigger              | Response Type                | Description                                               |
| ---------------------- | ------ | -------------------- | ---------------------------- | --------------------------------------------------------- |
| `/api/spotify/wrapped` | GET    | `useEffect` on mount | `SpotifyWrappedData \| null` | Fetches Spotify Wrapped data including `topGenres` array. |

**Fetch flow:**

1. On mount, fetches `/api/spotify/wrapped`.
2. If the response contains a non-empty `topGenres` array, sets it in `genres` state.
3. If the array is empty or the request fails, sets `genresError` to `true`.

## Helper Functions

| Function                    | Description                                                                                                                                                                                                                         |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renderBadges(items, bg)`   | Takes an array of strings and a background color, returns a flex-wrapped row of colored pill badges.                                                                                                                                |
| `renderValue(label, value)` | Determines how to render a row's value. For the "Music" row, uses fetched genres or shows loading/error states. For other categories, splits comma-separated values into badge pills using the category's color from `badgeColors`. |

## Constants

### `badgeColors`

Maps category labels to their badge background colors:

| Category   | Color         | Hex       |
| ---------- | ------------- | --------- |
| General    | Orange        | `#E67E22` |
| Music      | Spotify Green | `#1DB954` |
| Movies     | Red           | `#E74C3C` |
| Television | Purple        | `#9B59B6` |
| Books      | Blue          | `#3498DB` |
| Heroes     | Orange        | `#F97316` |

## Render Structure

The component renders:

1. A `SectionHeader` with the title "Interests".
2. A table-like layout using alternating row backgrounds (`#2A1F14` and `#1A1209`).
3. Each row has a fixed-width label column (120px on mobile, 140px on sm+) and a flexible value column.
4. Values are rendered as colored badge pills for categories with matching `badgeColors` entries.
5. The Music row has three possible states:
   - **Loading** -- Italic "Loading..." text.
   - **Error** -- Italic "Unable to load Spotify data" text.
   - **Success** -- Genre badges in Spotify green.

## Child Components

| Component       | Source            | Description                                                          |
| --------------- | ----------------- | -------------------------------------------------------------------- |
| `SectionHeader` | `./SectionHeader` | Renders the section title header with consistent About page styling. |

## Data Sources

| Source                 | Type                              | Description                                                                               |
| ---------------------- | --------------------------------- | ----------------------------------------------------------------------------------------- |
| `interests`            | `@/lib/data/personal`             | Static array of `{ label, value }` objects defining interest categories and their values. |
| `/api/spotify/wrapped` | API                               | Returns `SpotifyWrappedData` with a `topGenres` string array.                             |
| `SpotifyWrappedData`   | `@/app/api/spotify/wrapped/route` | TypeScript type import.                                                                   |

## Styling

- Uses the site's custom Tailwind theme colors (`sunny-gold`, `sunny-cream`, `sunny-cream-muted`, `sunny-surface-light`).
- Verdana font family for labels and values.
- Alternating row backgrounds for visual separation.
- Badge pills have white text on category-specific colored backgrounds with rounded-full corners.
- Responsive label column width: 120px default, 140px on `sm` breakpoint.

## Usage

```tsx
<InterestsTable />
```

## Integration Points

- Rendered within the About page layout as a profile section.
- Depends on `interests` data from `@/lib/data/personal` for all rows except the dynamic Music genres.
- Depends on the Spotify Wrapped API route for the Music row's genre data.
- Uses `SectionHeader` for consistent section title styling across the About page.
