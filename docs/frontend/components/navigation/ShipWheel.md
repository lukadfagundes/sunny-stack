# ShipWheel

## Overview

`ShipWheel` is the primary navigation component for the application, rendered as a fixed-position ship's wheel on desktop and a radial anchor menu on mobile. The wheel rotates based on the current page, with navigation labels appearing on hover. It supports four routes: Home (`/`), Portfolio (`/portfolio`), About (`/about`), and Docs (`/docs`), and automatically hides on unknown/404 routes.

**Source:** `src/components/ShipWheel.tsx`

## Props

This component takes no props.

## State Management

| Hook | Variable | Type | Initial | Description |
|------|----------|------|---------|-------------|
| `usePathname` | `pathname` | `string` | -- | Current route path from Next.js navigation. |
| `useState` | `hovered` | `boolean` | `false` | Whether the desktop wheel is being hovered. |
| `useState` | `mobileOpen` | `boolean` | `false` | Whether the mobile radial menu is expanded. |

## Derived State

| Variable | Calculation | Description |
|----------|-------------|-------------|
| `currentItem` | `NAV_ITEMS.find(item => item.href === pathname)` | The nav item matching the current route. |
| `currentAngle` | `-currentItem.angle` or `0` | Negative of the matched item's angle, causing the wheel to rotate so the current page's spoke points up. |
| `labelsAtPositions` | Computed from `currentAngle` | Maps each label position (top/right/bottom/left) to the nav item whose spoke visually points there after rotation. |

## Constants

### `NAV_ITEMS`

| Label | Href | Angle |
|-------|------|-------|
| Home | `/` | 0 |
| Portfolio | `/portfolio` | 90 |
| About | `/about` | 180 |
| Docs | `/docs` | 270 |

### SVG Dimensions

| Constant | Value | Description |
|----------|-------|-------------|
| `WHEEL_SIZE` | 80 | SVG viewport width/height in pixels. |
| `HUB_RADIUS` | 10 | Radius of the center hub. |
| `RIM_RADIUS` | 36 | Radius of the outer rim. |
| `LABEL_OFFSET` | 18 | Distance from wheel edge to navigation labels. |

### `KNOWN_ROUTES`

A `Set` containing `"/"`, `"/portfolio"`, `"/about"`, `"/docs"`. The wheel returns `null` (hides) when the pathname is not in this set.

## Event Handlers

| Handler | Element | Description |
|---------|---------|-------------|
| `onMouseEnter` | Desktop `<nav>` | Sets `hovered` to `true`, showing navigation labels. |
| `onMouseLeave` | Desktop `<nav>` | Sets `hovered` to `false`, hiding navigation labels. |
| `handleZoroClick` | Center hub button | Easter egg handler (currently empty `useCallback`). |
| `onClick` | Mobile toggle button | Toggles `mobileOpen` state. |
| `onClick` | Mobile nav links | Sets `mobileOpen` to `false` after clicking a link. |

## Internal Components

### `ShipWheelSVG`

A pure SVG component that renders the ship's wheel graphic.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `hovered` | `boolean` | Controls color intensity of wheel elements. |
| `currentAngle` | `number` | Rotation angle applied via Framer Motion spring animation. |

**SVG Elements:**
- Outer rim circle (3px stroke).
- Inner rim circle (1px stroke).
- 8 spokes: 4 main (thicker, lighter) + 4 secondary (thinner, darker), distributed at 45-degree intervals.
- 4 spoke tip handles (gold circles at main spoke ends, outside the rim).
- Center hub (filled circle with border).
- Center dot (small accent circle).

All colors transition between muted and bright states based on `hovered`.

## Render Modes

### Desktop (lg+ breakpoint)

- Fixed position: bottom-right corner (`bottom-6 right-16`).
- Hidden at `< lg` breakpoint via `hidden lg:block`.
- The SVG wheel rotates via spring animation when navigating between pages.
- Navigation labels appear on hover with `AnimatePresence` fade/scale animation.
- Labels are positioned absolutely at top/right/bottom/left of the wheel.
- Active page label is highlighted in `sunny-gold`.
- Screen-reader-only links are provided for keyboard accessibility.

### Mobile (< lg breakpoint)

- Fixed position: bottom-right corner (`bottom-6 right-6`).
- Hidden at `lg+` breakpoint via `lg:hidden`.
- Toggle button with `Anchor` icon from lucide-react (14x14, rotates 180 degrees when open).
- Nav items fan out in a compass-rose arc pattern on toggle.
- Each item is a 12x12 circle showing the first 3 characters of the label.
- Active page has `sunny-gold` background; others have `sunny-surface` background.
- Spring animations with staggered delays for each item.

## Child Components

| Component | Source | Description |
|-----------|--------|-------------|
| `ShipWheelSVG` | Internal | SVG rendering of the ship's wheel. |
| `Link` | `next/link` | Next.js navigation links. |
| `motion.*` | `framer-motion` | Animation wrappers for labels and mobile menu items. |
| `AnimatePresence` | `framer-motion` | Manages enter/exit animations. |
| `Anchor` | `lucide-react` | Anchor icon for mobile toggle button. |

## Usage

```tsx
<ShipWheel />
```

## Integration Points

- Rendered at the application layout level (likely in `layout.tsx` or a global wrapper) so it persists across all known routes.
- Uses `usePathname` from `next/navigation` for route-aware behavior.
- Automatically hides on 404/unknown routes.
- Navigation is purely client-side via Next.js `Link` component.
