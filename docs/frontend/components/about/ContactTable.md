# ContactTable

## Overview

A client-side component that renders a two-column grid of social media and contact links. Each link displays a platform-specific colored icon (from lucide-react or a custom SVG) alongside the platform label. External links open in new tabs; the email link opens in the same window.

**Source:** `src/components/about/ContactTable.tsx`

## Props

This component accepts **no props**. All data is sourced from the static `contactLinks` import.

## State Management

This component has **no internal state**. It is a pure presentational component.

## API Integration

This component makes **no API calls**.

## Event Handlers

This component has **no explicit event handlers**. Links use native `<a>` tag click behavior.

## Child Components

| Component | Source | Purpose |
|-----------|--------|---------|
| `SectionHeader` | `./SectionHeader` | Renders the section title ("Contacting Luka") with consistent styling |

## Internal Components

### `XIcon`
A custom inline SVG component rendering the X (formerly Twitter) logo, since lucide-react does not include a native X icon.

```ts
function XIcon({ className, style }: { className?: string; style?: React.CSSProperties })
```

## Icon Mapping

The component uses two lookup maps to associate contact types with icons and colors:

### `ICON_MAP`

| Key | Icon Component |
|-----|---------------|
| `instagram` | `Instagram` (lucide-react) |
| `twitter` | `XIcon` (custom SVG) |
| `bluesky` | `CloudSun` (lucide-react) |
| `twitch` | `Twitch` (lucide-react) |
| `youtube` | `Youtube` (lucide-react) |
| `linkedin` | `Linkedin` (lucide-react) |
| `github` | `Github` (lucide-react) |
| `email` | `Mail` (lucide-react) |

### `COLOR_MAP`

| Key | Color |
|-----|-------|
| `instagram` | `#E1306C` (pink) |
| `twitter` | `#FFFFFF` (white) |
| `bluesky` | `#0085FF` (blue) |
| `twitch` | `#9146FF` (purple) |
| `youtube` | `#FF0000` (red) |
| `linkedin` | `#0A66C2` (blue) |
| `github` | `#F5E6D3` (cream) |
| `email` | `#F0B429` (gold) |

## Data Sources

| Source | Import Path | Type | Description |
|--------|-------------|------|-------------|
| `contactLinks` | `@/lib/data/personal` | `ContactLink[]` | Array of contact objects with `label`, `url`, and `type` fields |

### ContactLink Structure

```ts
interface ContactLink {
  label: string;
  url: string;
  type: "instagram" | "twitter" | "bluesky" | "twitch" | "youtube" | "linkedin" | "github" | "email";
}
```

## Rendering Logic

- Links are rendered in a 2-column grid (`grid grid-cols-2 gap-x-4 gap-y-1.5`)
- Each link is an `<a>` element with the platform-specific color applied via inline `style`
- External links (all types except `email`) get `target="_blank"` and `rel="noopener noreferrer"`
- The email link uses a `mailto:` URL and opens in the same tab
- Icons are rendered at `w-3 h-3` alongside the label text

## Usage

```tsx
<ContactTable />
```

## Integration Points

- **Parent:** Rendered within the About page layout, typically in a sidebar or contact section.
- **SectionHeader:** Relies on the `SectionHeader` component for the styled title bar.
- **Data:** Driven by `contactLinks` from `@/lib/data/personal`. Adding or removing entries in that array automatically updates the rendered grid.
