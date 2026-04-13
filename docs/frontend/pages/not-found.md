# Not Found (404) Page

## Overview

Custom 404 page with accessibility-aware rendering. Detects the user's `prefers-reduced-motion` preference and conditionally renders either an interactive Zoro-themed maze game (`ZoroGame`) or a static fallback (`StaticNotFound`).

**Source:** `src/app/not-found.tsx` (29 lines)

## Route

Automatically served by Next.js for any unmatched route (404 responses).

## Rendering Strategy

- **Type:** Client Component (`"use client"`)
- **Data Fetching:** None

## Data Flow

```
useReducedMotion() hook
  |
  +-> reduced === true  -> StaticNotFound (accessible fallback)
  +-> reduced === false -> ZoroGame (interactive game)
```

## Component Composition

| Component        | Source                            | Rendered When                           |
| ---------------- | --------------------------------- | --------------------------------------- |
| `ZoroGame`       | `@/components/404/ZoroGame`       | `prefers-reduced-motion: no-preference` |
| `StaticNotFound` | `@/components/404/StaticNotFound` | `prefers-reduced-motion: reduce`        |

## Key Logic

### `useReducedMotion()` Hook

A custom hook built with `useSyncExternalStore` for SSR-safe media query detection:

```typescript
function useReducedMotion(): boolean;
```

**Implementation:**

- **`subscribe`:** Attaches a `change` event listener to the `(prefers-reduced-motion: reduce)` media query. Returns a cleanup function that removes the listener. Wrapped in `useCallback` with empty deps for referential stability.
- **`getSnapshot`:** Returns the current `matches` boolean of the media query. Wrapped in `useCallback` with empty deps.
- **Server snapshot:** Returns `false` (assumes no reduced motion preference during SSR, so ZoroGame renders by default).

**Why `useSyncExternalStore`?**

This hook subscribes to a browser API (media query) that exists outside React's state management. `useSyncExternalStore` provides a safe way to sync this external state with React, including proper SSR hydration via the server snapshot parameter.

### Accessibility

Users who have enabled "Reduce motion" in their OS accessibility settings see a static 404 page instead of the interactive game. This respects the `prefers-reduced-motion` media query, which can be set via:

- macOS: System Settings > Accessibility > Display > Reduce motion
- Windows: Settings > Accessibility > Visual effects > Animation effects (off)
- iOS: Settings > Accessibility > Motion > Reduce Motion

## State Management

No explicit `useState` or `useReducer`. State is derived reactively from the browser's media query via `useSyncExternalStore`.

## Dependencies

- `react` -- `useCallback`, `useSyncExternalStore`
- `@/components/404/ZoroGame` -- Interactive maze game component
- `@/components/404/StaticNotFound` -- Static fallback component
