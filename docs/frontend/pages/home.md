# Home Page

## Overview

The landing page of sunny-stack. An async Server Component that fetches all GitHub data at build/revalidation time and passes it as props to child components. Renders a pirate-themed dashboard with a contribution heatmap, stats, tech arsenal, and recently active repositories.

**Source:** `src/app/page.tsx` (143 lines)

## Route

`/`

## Rendering Strategy

- **Type:** Async Server Component (no `"use client"` directive)
- **ISR:** `export const revalidate = 3600` -- revalidates every 1 hour
- **Data Fetching:** Calls `fetchGitHubData()` at the top level during server rendering

## Data Flow

```
fetchGitHubData() [src/lib/github.ts]
  |
  v
Home (Server Component)
  |
  +-> HeroSection (no data props)
  +-> ContributionHeatmap (calendar={data.contributionCalendar})
  +-> StatsDashboard (totalCommits, totalPRs, totalIssues, totalRepos, totalStars, totalContributions)
  +-> TechArsenal (no data props)
  +-> CurrentlyBuilding (repos={data.publicRepos})
```

## Component Composition

| Component | Source | Props Received |
|-----------|--------|---------------|
| `HeroSection` | `@/components/HeroSection` | None |
| `ContributionHeatmap` | `@/components/landing/ContributionHeatmap` | `calendar` (contribution calendar with totalContributions and weeks) |
| `StatsDashboard` | `@/components/landing/StatsDashboard` | `totalCommits`, `totalPRs`, `totalIssues`, `totalRepos`, `totalStars`, `totalContributions` |
| `TechArsenal` | `@/components/landing/TechArsenal` | None |
| `CurrentlyBuilding` | `@/components/landing/CurrentlyBuilding` | `repos` (public repos array: GitHubRepo[]) |

## Key Logic

### Layout Structure ("The Ship's Deck")

The main content area is a single unified panel with:
- Radial gradient background (dark wood tones: rgba(52,38,24) to rgba(20,14,8))
- Faint map grid overlay at 48px spacing with gold lines at 3% opacity
- Burnt edge vignette via inset box shadows
- 4 corner rivet decorations (absolute positioned radial gradient circles)
- Rounded border (20px radius) with gold-tinted border

### Content Zones

1. **Zone 1 (Captain's Chart):** Full-width contribution heatmap with padding
2. **Zone 2 (Instruments):** Full-width stats dashboard with padding
3. **Zone 3 (Cargo Hold + Spyglass):** Two-column grid on large screens (`lg:grid-cols-[auto_auto_1fr]`)
   - Left: TechArsenal
   - Right: CurrentlyBuilding
   - Separated by a vertical gradient divider (hidden on mobile via `hidden lg:block`)

Zones are separated by horizontal gradient dividers (gold at 20% opacity, fading to transparent at edges).

## State Management

None. This is a pure server component with no client-side state.

## Dependencies

- `@/lib/github` -- `fetchGitHubData()`
- 5 child components (listed in Component Composition table above)
