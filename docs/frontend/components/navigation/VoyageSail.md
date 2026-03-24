# VoyageSail

## Overview

`VoyageSail` is a full-screen animated background component that creates a nautical night scene with a starfield, shooting stars, ocean waves, a sun glow on the horizon, and a ship silhouette that sails along the horizon line based on the user's scroll position. The component is fixed behind all page content and respects the `prefers-reduced-motion` accessibility preference.

**Source:** `src/components/landing/VoyageSail.tsx`

## Props

This component takes no props.

## State Management

| Hook | Variable | Type | Initial | Description |
|------|----------|------|---------|-------------|
| `useIsClient` (custom) | `isClient` | `boolean` | `false` (server) / `true` (client) | SSR gate to prevent hydration mismatch for client-only sub-components. |
| `useReducedMotion` (custom) | `reducedMotion` | `boolean` | `false` | Detects the user's `prefers-reduced-motion: reduce` media query preference. |
| `useMotionValue` | `scrollProgress` | `MotionValue<number>` | `0` | Current scroll progress from 0 to 1. |
| `useRef` | `prevProgress` | `number` | `0` | Previous scroll progress value for calculating direction. |
| `useState` | `facingRight` | `boolean` | `true` | Whether the ship is facing right (scrolling down) or left (scrolling up). |

## Custom Hooks

### `useIsClient()`
Uses `useSyncExternalStore` with an empty subscribe function to return `false` on the server and `true` on the client. This prevents rendering client-only animations during SSR.

### `useReducedMotion()`
Uses `useSyncExternalStore` to subscribe to the `prefers-reduced-motion: reduce` media query. Returns `true` when the user prefers reduced motion.

## Scroll Tracking

The component uses a manual scroll tracking system via `useEffect`:

1. Computes `scrollable = document.documentElement.scrollHeight - window.innerHeight`.
2. Calculates `progress = window.scrollY / scrollable`, clamped to `[0, 1]`.
3. Sets the `scrollProgress` MotionValue.
4. Determines scroll direction by comparing with `prevProgress.current`.
5. Updates `facingRight` based on direction (delta > 0 means scrolling down = facing right).
6. Listens on both `scroll` and `resize` events with `{ passive: true }`.

## Ship Position

| Transform | Input | Output | Description |
|-----------|-------|--------|-------------|
| `shipX` | `scrollProgress [0, 1]` | `[5, 90]` | Maps scroll progress to viewport width percentage. |
| `shipLeft` | `shipX` | `"{value}vw"` | Converts to CSS vw string for positioning. |

## Internal Components

### `ShipSilhouette`

A small SVG (48x32) rendering a simple ship with a hull, deck, mast, sail, and flag. Uses nautical gold/brown colors. Responsive sizing via Tailwind classes.

### `StarField`

Renders 60 deterministically-positioned stars using a seeded pseudo-random hash function (avoiding `Math.random()` for SSR consistency). Each star has a `voyage-twinkle` CSS animation with unique delay and duration. When `reducedMotion` is `true`, stars render at static 0.4 opacity with no animation.

**Constants:** `STARS` array is generated at module level with seeded values for `x`, `y`, `size`, `delay`, and `duration`. Values are rounded to 2 decimals to prevent hydration mismatch.

### `ShootingStars`

Spawns ephemeral shooting star elements at random intervals (3-5 seconds between spawns, with an initial 2-second delay). Each shooting star has a random position, angle (15-30 degrees), and duration (0.6-1.4 seconds). Stars are removed from state after 2 seconds. Fully disabled when `reducedMotion` is `true`.

### `OceanWaves`

Three layered SVG wave paths with staggered horizontal drift animations (`voyage-wave-drift`). Positioned below the 70% horizon line with a gradient overlay. Animations disabled when `reducedMotion` is `true`.

### `SunGlow`

Two stacked radial gradients creating a warm glow effect on the horizon. Purely decorative, no animation. Positioned at 55% from top, 30% height.

## Render Structure

The component renders as a fixed full-screen `div` with a vertical gradient background:

```
Background gradient: #0D0A06 -> #1A1209 -> #2A1F14 -> #3D2E1F -> #6B4226 -> #B8860B
  |-- StarField (0-70% height)
  |-- ShootingStars (0-70% height)
  |-- SunGlow (55-85% area)
  |-- Horizon glow line (at 70%)
  |-- OceanWaves (70-100%)
  |-- Ship (at 70%, moves horizontally with scroll)
       |-- Wake trail (behind ship)
       |-- ShipSilhouette (with bobbing animation)
```

When `reducedMotion` is `true`, the ship is rendered as a static centered element without scroll-based movement, bobbing, or wake trail.

## CSS Animations Required

The component references these CSS keyframe animations that must be defined in global styles:

| Animation | Description |
|-----------|-------------|
| `voyage-twinkle` | Star twinkling opacity animation. |
| `voyage-shooting-star` | Shooting star movement and fade. |
| `voyage-wave-drift` | Horizontal wave scrolling. |
| `voyage-ship-bob` | Ship vertical bobbing motion (4s ease-in-out infinite). |

## Child Components

| Component | Source | Description |
|-----------|--------|-------------|
| `motion.div` | `framer-motion` | Used for scroll-driven ship positioning. |
| `useMotionValue`, `useTransform` | `framer-motion` | Scroll-to-position transform chain. |

## Usage

```tsx
<VoyageSail />
```

## Integration Points

- Rendered as a fixed `z-0` background layer, typically in the main layout or landing page.
- All page content should be positioned with a higher z-index to appear above this component.
- Scroll tracking works naturally on scrollable pages and returns 0 on non-scrollable pages (like 404).
- Resets correctly on navigation without stale MotionValue issues.
