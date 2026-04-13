# ZoroGame

## Overview

`ZoroGame` is the main 404-page component that presents a One Piece-themed mini-game where the player helps the directionally-challenged Zoro navigate a 7x7 grid to find the Thousand Sunny ship. The game features progressive difficulty phases (control shuffling, grid rotation, color shifts, and the Sunny running away), an escalating Nami frustration system, and a full takeover modal at 40 moves.

**Source:** `src/components/404/ZoroGame.tsx`

## Props

This component takes no props.

## State Management

| Hook                   | Variable   | Type        | Initial                | Description                                                                                                      |
| ---------------------- | ---------- | ----------- | ---------------------- | ---------------------------------------------------------------------------------------------------------------- |
| `useReducer`           | `state`    | `GameState` | `createInitialState()` | Full game state managed by `gameReducer`. See [game-logic.md](./game-logic.md) for complete state documentation. |
| `useIsClient` (custom) | `isClient` | `boolean`   | `false`/`true`         | SSR hydration gate.                                                                                              |

### Key State Fields Used

| Field                | Usage in Component                                         |
| -------------------- | ---------------------------------------------------------- |
| `state.moveCount`    | Drives Nami escalation visibility and takeover thresholds. |
| `state.won`          | Controls win celebration overlay and hides D-Pad.          |
| `state.currentQuote` | Passed to `GameHUD` for display.                           |

## Derived State

| Variable         | Calculation                           | Description                                           |
| ---------------- | ------------------------------------- | ----------------------------------------------------- |
| `showNamiButton` | `state.moveCount >= 21 && !state.won` | Whether to show the escalating Nami "go home" button. |
| `namiTakeover`   | `state.moveCount >= 40 && !state.won` | Whether Nami has taken over, blocking all game input. |

## Event Handlers

| Handler                       | Type                                          | Description                                                                    |
| ----------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------ |
| `handleMove`                  | `useCallback((direction: Direction) => void)` | Dispatches a `MOVE` action to the reducer. Stable reference via `useCallback`. |
| `handleReset`                 | `useCallback(() => void)`                     | Dispatches a `RESET` action to regenerate the grid.                            |
| `onTouchStart` / `onTouchEnd` | From `useGameInput`                           | Touch swipe handlers attached to the main container.                           |

## Input Handling

Uses the `useGameInput` custom hook which provides:

- **Keyboard input:** Arrow keys and WASD mapped to directions. Disabled when `namiTakeover` is `true`.
- **Touch swipe input:** `onTouchStart` and `onTouchEnd` handlers with a 50px swipe threshold.

## Internal Components

### `NamiEscalation`

Renders an escalating "go home" button that grows in size, glow, and urgency from moves 21-39.

| Prop        | Type     | Description                                                |
| ----------- | -------- | ---------------------------------------------------------- |
| `moveCount` | `number` | Current move count, used to calculate escalation progress. |

**Visual Escalation (moves 21-39):**

- `progress` = `(moveCount - 21) / 19` (0 to 1)
- Font size: 0.75rem to 1.25rem
- Padding: 8-16px vertical, 16-32px horizontal
- Border glow: increases from 0 to 25px
- Border width: 1px to 3px
- Border color opacity: 0.4 to 1.0

The button text comes from `getNamiLine(moveCount)` which returns One Piece-themed escalating Nami dialogue.

## Render Structure

```
SSR loading state (if !isClient):
  Swords icon (pulsing) + "Loading..." text

Main game container (onTouchStart, onTouchEnd):
  |-- Top spacer (15vh)
  |-- Title section ("404", "Help Zoro find the Thousand Sunny", controls hint)
  |-- GameBoard (with motion entrance animation)
  |   |-- WinCelebration overlay (AnimatePresence, when state.won)
  |-- Below-board section:
      |-- GameHUD (move counter + quotes)
      |-- DPad (mobile only, hidden when won)
      |-- NamiEscalation button (moves 21-39, AnimatePresence)
      |-- Escape hatch links:
      |   |-- "Just go home" (Link to /)
      |   |-- "New grid" (reset button)
      |-- Footer text ("Error 404: Page not found...")

Nami Takeover Modal (AnimatePresence, when moveCount >= 40 && !won):
  |-- Full-screen backdrop (z-50, 85% opacity)
  |-- Modal card:
      |-- Swords icon
      |-- "THAT'S IT!" heading
      |-- Description text
      |-- "Back to the Ship. NOW." Link to /
```

## Child Components

| Component                     | Source             | Description                                                  |
| ----------------------------- | ------------------ | ------------------------------------------------------------ |
| `GameBoard`                   | `./GameBoard`      | Renders the 7x7 game grid with player, goal, and tile types. |
| `GameHUD`                     | `./GameHUD`        | Displays move counter and current quote.                     |
| `DPad`                        | `./DPad`           | Mobile directional pad for touch input.                      |
| `WinCelebration`              | `./WinCelebration` | Victory overlay with quote and move count.                   |
| `NamiEscalation`              | Internal           | Escalating "go home" button.                                 |
| `Link`                        | `next/link`        | Navigation links to home page.                               |
| `Home`, `RotateCcw`, `Swords` | `lucide-react`     | Icons for navigation and UI.                                 |
| `motion.*`, `AnimatePresence` | `framer-motion`    | Animation wrappers.                                          |

## Data Sources

| Source               | Type             | Description                                                |
| -------------------- | ---------------- | ---------------------------------------------------------- |
| `gameReducer`        | `./reducer`      | Pure function managing all game state transitions.         |
| `createInitialState` | `./reducer`      | Factory function for initial game state.                   |
| `useGameInput`       | `./useGameInput` | Custom hook for keyboard + touch input handling.           |
| `getNamiLine`        | `./quotes`       | Returns the Nami dialogue line for the current move count. |

## Usage

```tsx
// In the 404 page (app/not-found.tsx):
<ZoroGame />
```

## Integration Points

- Serves as the complete 404 page content.
- Uses `VoyageSail` as its background (rendered by the parent layout).
- The `ShipWheel` navigation component automatically hides on 404 routes via its `KNOWN_ROUTES` check.
- All game logic is isolated in the reducer -- the component is primarily a UI shell.
