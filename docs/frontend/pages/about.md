# About Page

## Overview

A MySpace-inspired profile page with a two-column layout and multiple view modes. Client-side component that manages view state for switching between the main profile, photo gallery, video gallery, music gallery, and game stats views.

**Source:** `src/app/about/page.tsx` (73 lines)

## Route

`/about`

## Rendering Strategy

- **Type:** Client Component (`"use client"`)
- **Data Fetching:** None at the page level; child components fetch their own data from API routes

## Data Flow

```
AboutPage (client component, manages view state)
  |
  +-- Left Column (always visible) --+
  |   +-> ProfileCard                |
  |   +-> ContactTable               |
  |   +-> MusicPlayer                |
  |   +-> DetailsBox                 |
  +----------------------------------+
  |
  +-- Right Column (conditional on view) --+
  |   profile: NetworkBanner, BlogEntry,    |
  |            BioSections, InterestsTable, |
  |            TopEight                     |
  |   pics:    PhotoGallery -> /api/instagram         |
  |   videos:  VideoGallery -> /api/youtube           |
  |   music:   MusicGallery -> /api/spotify/wrapped   |
  |   game:    GameStats -> /api/steam/achievements   |
  +---------------------------------------------+
```

## Component Composition

### Left Column (always visible)

| Component | Props |
|-----------|-------|
| `ProfileCard` | `onViewPics: () => void`, `onViewVideos: () => void` |
| `ContactTable` | None |
| `MusicPlayer` | `onViewMusic: () => void` |
| `DetailsBox` | None |

### Right Column (profile view -- default)

| Component | Props |
|-----------|-------|
| `NetworkBanner` | None |
| `BlogEntry` | None |
| `BioSections` | None |
| `InterestsTable` | None |
| `TopEight` | `onViewGame: (game: SteamGame) => void` |

### Right Column (alternate views)

| View | Component | Props |
|------|-----------|-------|
| `pics` | `PhotoGallery` | `onBack: () => void` |
| `videos` | `VideoGallery` | `onBack: () => void` |
| `music` | `MusicGallery` | `onBack: () => void` |
| `game` | `GameStats` | `game: SteamGame`, `onBack: () => void` |

## State Management

```typescript
type AboutView = "profile" | "pics" | "videos" | "music" | "game";

const [view, setView] = useState<AboutView>("profile");
const [selectedGame, setSelectedGame] = useState<SteamGame | null>(null);
```

- `view` controls which content renders in the right column
- `selectedGame` stores the selected Steam game for the GameStats view
- View transitions are triggered by callback props passed to child components

### View Switching

- `ProfileCard.onViewPics()` -> sets view to `"pics"`
- `ProfileCard.onViewVideos()` -> sets view to `"videos"`
- `MusicPlayer.onViewMusic()` -> sets view to `"music"`
- `TopEight.onViewGame(game)` -> sets `selectedGame` and view to `"game"`
- All alternate views have `onBack()` -> sets view back to `"profile"`

## Key Logic

### Two-Column Grid

```
md:grid-cols-[300px_1fr]
```
- Left column: fixed 300px on medium+ screens
- Right column: fluid remaining space
- Stacks to single column on small screens

### Font

Uses `Verdana, sans-serif` as the base font for the MySpace aesthetic.

### Conditional Rendering

The right column uses a chain of ternary expressions:
1. `view === "profile"` -> render all profile sections
2. `view === "pics"` -> render PhotoGallery
3. `view === "videos"` -> render VideoGallery
4. `view === "music"` -> render MusicGallery
5. `selectedGame` (view === "game" implied) -> render GameStats
6. Otherwise -> null

## Dependencies

- 13 component imports from `@/components/about/`
- `SteamGame` type from `@/app/api/steam/route`
