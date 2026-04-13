# Landing Page Components Overview

## Summary

The landing page is composed of five main content components plus the `VoyageSail` animated background (documented separately in [VoyageSail.md](../navigation/VoyageSail.md)). Together they create a nautical/pirate-themed developer portfolio landing page with animated gauges, a GitHub contribution heatmap, a tech stack showcase, a spyglass-framed project viewer, and a hero section with animated letter reveals.

## Component Summary Table

| Component             | Source                                           | Props             | Data Source  | Description                                                     |
| --------------------- | ------------------------------------------------ | ----------------- | ------------ | --------------------------------------------------------------- |
| `HeroSection`         | `src/components/HeroSection.tsx`                 | None              | None         | Full-screen hero with animated name and title reveal.           |
| `StatsDashboard`      | `src/components/landing/StatsDashboard.tsx`      | 6 numeric stats   | Server props | Five animated gauge dials showing GitHub statistics.            |
| `ContributionHeatmap` | `src/components/landing/ContributionHeatmap.tsx` | `calendar` object | Server props | GitHub contribution heatmap styled as a nautical chart.         |
| `TechArsenal`         | `src/components/landing/TechArsenal.tsx`         | None              | Static data  | Tech stack organized in categories as "cargo crate" items.      |
| `CurrentlyBuilding`   | `src/components/landing/CurrentlyBuilding.tsx`   | `repos` array     | Server props | Top 3 recently pushed repos displayed through a spyglass frame. |

---

## HeroSection

**Source:** `src/components/HeroSection.tsx`

### Overview

The hero section is a full-screen centered section that displays the developer's name ("Luka Fagundes") and title ("Full Stack Developer") with a staggered letter-by-letter reveal animation. It respects the `prefers-reduced-motion` accessibility preference.

### Props

This component takes no props.

### State Management

| Hook                        | Variable        | Type      | Description                                                          |
| --------------------------- | --------------- | --------- | -------------------------------------------------------------------- |
| `useReducedMotion` (custom) | `reducedMotion` | `boolean` | Detects `prefers-reduced-motion: reduce` via `useSyncExternalStore`. |

### Child Components

| Component      | Source           | Description                                                               |
| -------------- | ---------------- | ------------------------------------------------------------------------- |
| `LetterReveal` | `./LetterReveal` | Animates text character-by-character with configurable delay and stagger. |

### LetterReveal Configuration

| Instance | Text                   | Delay | Stagger | CSS Classes                                         |
| -------- | ---------------------- | ----- | ------- | --------------------------------------------------- |
| Name     | "Luka Fagundes"        | 0.3s  | default | serif, 5xl-8xl responsive, bold, sunny-cream        |
| Title    | "Full Stack Developer" | 1.2s  | 0.03s   | lg-2xl responsive, sunny-cream-muted, tracking-wide |

### Styling

- Full viewport height (`min-h-screen`) with centered flex layout.
- Text is positioned with `z-10` to appear above the `VoyageSail` background.
- Responsive font sizes from mobile (`text-5xl`) to desktop (`text-8xl`).

---

## StatsDashboard

**Source:** `src/components/landing/StatsDashboard.tsx`

### Overview

Displays five animated nautical gauge instruments representing GitHub statistics: Commits, PRs, Issues, Repos, and Stars. Each gauge features a 270-degree arc with tick marks, a needle, and an animated counter. Gauges animate into view with staggered delays when scrolled into the viewport. Titled "Ship's Instruments".

### Props

| Prop                 | Type     | Required | Description                                                        |
| -------------------- | -------- | -------- | ------------------------------------------------------------------ |
| `totalCommits`       | `number` | Yes      | Total commit count.                                                |
| `totalPRs`           | `number` | Yes      | Total pull request count.                                          |
| `totalIssues`        | `number` | Yes      | Total issue count.                                                 |
| `totalRepos`         | `number` | Yes      | Total repository count.                                            |
| `totalStars`         | `number` | Yes      | Total star count.                                                  |
| `totalContributions` | `number` | Yes      | Total contribution count (used to determine if data is available). |

### State Management

| Hook        | Variable   | Type             | Description                                                           |
| ----------- | ---------- | ---------------- | --------------------------------------------------------------------- |
| `useRef`    | `ref`      | `HTMLDivElement` | Element reference for intersection observer.                          |
| `useInView` | `isInView` | `boolean`        | Framer Motion hook; triggers animations once when 60px into viewport. |

### Internal Components: `Gauge`

Each gauge is a self-contained SVG component with:

| Feature       | Details                                                                            |
| ------------- | ---------------------------------------------------------------------------------- |
| **Arc**       | 270-degree arc (90-degree gap at bottom) using `stroke-dasharray` on a circle.     |
| **Ticks**     | 19 tick marks (7 major at every 3rd position, 12 minor).                           |
| **Needle**    | Animated line from center to arc edge, tracking current value.                     |
| **Counter**   | Animated number display using `requestAnimationFrame` with elastic easing.         |
| **Animation** | 1800ms duration, elastic ease-out, delayed per gauge (0s, 0.1s, 0.2s, 0.3s, 0.4s). |

### Gauge Constants

| Constant     | Value | Description                           |
| ------------ | ----- | ------------------------------------- |
| `SIZE`       | 100   | SVG viewBox dimensions.               |
| `STROKE`     | 6     | Track stroke width.                   |
| `R`          | 47    | Circle radius.                        |
| `TRACK_DEG`  | 270   | Arc span in degrees.                  |
| `ROTATION`   | 135   | SVG rotation to center gap at bottom. |
| `NEEDLE_LEN` | 32    | Needle length from center.            |

### Max Value Calculation

Each gauge's max value is dynamically calculated with headroom to prevent the gauge from being completely full:

- Commits: `max(totalCommits * 1.2, 100)`
- PRs: `max(totalPRs * 1.3, 50)`
- Issues: `max(totalIssues * 1.3, 50)`
- Repos: `max(totalRepos * 1.5, 20)`
- Stars: `max(totalStars * 1.4, 10)`

### Render Layout

- Title: "Ship's Instruments" (serif italic).
- 5-column grid of gauges.
- "Instruments offline" fallback when `totalContributions === 0`.

---

## ContributionHeatmap

**Source:** `src/components/landing/ContributionHeatmap.tsx`

### Overview

Renders a GitHub contribution heatmap styled as a nautical chart ("The Captain's Chart"). Features a compass rose decoration, month labels, day-of-week labels, interactive cell tooltips, and a 5-level color legend. Titled with the total contribution count as "territories charted".

### Props

| Prop       | Type                                                        | Required | Description                                                            |
| ---------- | ----------------------------------------------------------- | -------- | ---------------------------------------------------------------------- |
| `calendar` | `{ totalContributions: number; weeks: ContributionWeek[] }` | Yes      | GitHub contribution calendar data with weekly contribution day arrays. |

### State Management

| Hook       | Variable  | Type                  | Description                                              |
| ---------- | --------- | --------------------- | -------------------------------------------------------- |
| `useState` | `tooltip` | `TooltipData \| null` | Tooltip state with date, count, and x/y position.        |
| `useRef`   | `gridRef` | `HTMLDivElement`      | Reference to the grid container for tooltip positioning. |

### Constants

| Constant       | Value               | Description                                                         |
| -------------- | ------------------- | ------------------------------------------------------------------- |
| `CELL`         | 16                  | Cell size in pixels.                                                |
| `GAP`          | 3                   | Gap between cells in pixels.                                        |
| `STEP`         | 19                  | Total cell step (CELL + GAP).                                       |
| `LEVEL_COLORS` | 5 gold-toned colors | Contribution level color ramp from transparent dark to bright gold. |

### Level Mapping

| Count | Level | Color Description        |
| ----- | ----- | ------------------------ |
| 0     | 0     | Dark transparent         |
| 1-2   | 1     | Faint gold               |
| 3-5   | 2     | Medium gold              |
| 6-9   | 3     | Bright gold              |
| 10+   | 4     | Brightest gold with glow |

### Internal Components

| Component     | Description                                                                       |
| ------------- | --------------------------------------------------------------------------------- |
| `CompassRose` | Decorative SVG compass rose (64x64) with N/S/E/W labels and 8-point star pattern. |

### Event Handlers

| Handler                    | Element                          | Description                                                   |
| -------------------------- | -------------------------------- | ------------------------------------------------------------- |
| `handleCellHover`          | Each cell `div` (`onMouseEnter`) | Sets tooltip with date, count, and position relative to grid. |
| `onMouseLeave`             | Each cell `div`                  | Clears tooltip.                                               |
| `onMouseOver`/`onMouseOut` | Each cell `div`                  | Scale transform (1.3x) and glow effect on hover.              |

### Render Layout

- Header: "The Captain's Chart" title + compass rose + total contributions count.
- Horizontally scrollable grid container.
- Month labels row (abbreviated month names positioned at week boundaries).
- Day labels column (Mon, Wed, Fri).
- Weekly column grid with colored cells.
- Floating tooltip on hover.
- Color legend: "Uncharted" (low) to "Gold Strike" (high).
- Empty state: "No charts available -- the seas remain uncharted".

---

## TechArsenal

**Source:** `src/components/landing/TechArsenal.tsx`

### Overview

Displays the developer's technology stack organized into four categories ("Languages", "Frameworks", "Tools", "Cloud & Deploy") as interactive "cargo crate" items on wooden shelves. Each item reveals its technology color on hover. Titled "The Cargo Hold". All data is static and defined inline.

### Props

This component takes no props.

### Constants

#### `TECH_CATEGORIES`

| Category       | Items                                                      |
| -------------- | ---------------------------------------------------------- |
| Languages      | TypeScript, JavaScript, Python, Java, HTML/CSS, SQL        |
| Frameworks     | React, Next.js, Node.js, Express, Tailwind CSS, Discord.js |
| Tools          | Git, Docker, Jest, PostgreSQL, Prisma, Framer Motion       |
| Cloud & Deploy | Vercel, AWS, GitHub Actions, Supabase                      |

Each item has a `name` and associated brand `color`.

### Internal Components

#### `CrateItem`

| Prop       | Type       | Description                                  |
| ---------- | ---------- | -------------------------------------------- |
| `item`     | `TechItem` | Technology name and brand color.             |
| `delay`    | `number`   | Animation delay for staggered entrance.      |
| `isInView` | `boolean`  | Whether the parent shelf is in the viewport. |

**Behavior:**

- Renders a "wooden crate" box with subtle plank lines when closed.
- On hover (`onMouseEnter`/`onMouseLeave`), the crate "opens" with a color glow, lifted position, and brand-colored text.
- Entrance animation: fade in + slide up with staggered delay.

#### `CategoryShelf`

| Prop         | Type           | Description                          |
| ------------ | -------------- | ------------------------------------ |
| `category`   | `TechCategory` | Category label and items array.      |
| `shelfIndex` | `number`       | Index for staggered animation delay. |

**Behavior:**

- Uses `useInView` (Framer Motion) with `-60px` margin for scroll-triggered entrance.
- Renders category label with a decorative bar and divider line.
- Wraps `CrateItem` elements in a flex-wrap container.

### Render Layout

- Title: "The Cargo Hold" (serif italic bold).
- Vertical stack of `CategoryShelf` components with 4px gap.
- Each shelf has a labeled header and a flex-wrap grid of crate items.

---

## CurrentlyBuilding

**Source:** `src/components/landing/CurrentlyBuilding.tsx`

### Overview

Displays the top 3 most recently pushed GitHub repositories inside a decorative spyglass (telescope lens) frame. The component features a brass ring border, lens vignette effects, crosshair overlays, and brass screw decorations. Titled "Through the Spyglass". Each repo links to its GitHub URL.

### Props

| Prop    | Type           | Required | Description                                                         |
| ------- | -------------- | -------- | ------------------------------------------------------------------- |
| `repos` | `GitHubRepo[]` | Yes      | Array of GitHub repository objects. Only the first 3 are displayed. |

### State Management

| Hook        | Variable    | Type             | Description                                                 |
| ----------- | ----------- | ---------------- | ----------------------------------------------------------- |
| `useRef`    | `ref`       | `HTMLDivElement` | Element reference for intersection observer.                |
| `useInView` | `isInView`  | `boolean`        | Framer Motion hook for scroll-triggered entrance animation. |
| `useState`  | `isHovered` | `boolean`        | Whether the spyglass frame is hovered.                      |

### Helper Functions

| Function  | Signature                     | Description                                                                       |
| --------- | ----------------------------- | --------------------------------------------------------------------------------- |
| `timeAgo` | `(dateStr: string) => string` | Converts an ISO date string to a relative time string (e.g., "3d ago", "2w ago"). |

### Render Layout

- Title: "Through the Spyglass" (serif italic bold).
- Spyglass frame (340x340):
  - Outer brass ring with conic gradient and hover scale effect.
  - Inner brass ring.
  - Lens area with radial gradient, vignette shadow, and glare highlight.
  - Content: 3 stacked repos with names, external link icons, and relative timestamps.
  - Separators between repos.
  - Crosshair lines (horizontal and vertical).
  - 4 brass screws at compass points.
- Empty state: "Nothing sighted on the horizon".

### Repository Display

Each repository shows:

- **Name** in serif bold (first repo is brighter than subsequent ones).
- **External link icon** (lucide-react `ExternalLink`).
- **Time ago** in italic gold text.
- Links to `repo.url` opening in a new tab.

### Child Components

| Component      | Source          | Description                        |
| -------------- | --------------- | ---------------------------------- |
| `motion.div`   | `framer-motion` | Scale/opacity entrance animation.  |
| `ExternalLink` | `lucide-react`  | External link icon for repo cards. |

### Data Sources

| Source       | Type           | Description                                                                       |
| ------------ | -------------- | --------------------------------------------------------------------------------- |
| `repos` prop | `GitHubRepo[]` | From `@/lib/github`. Contains `name`, `url`, `pushedAt`, and other repo metadata. |
