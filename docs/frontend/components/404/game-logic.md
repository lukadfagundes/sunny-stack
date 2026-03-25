# Zoro Game Logic

## Overview

The Zoro 404 game is a grid-based puzzle where the player (Zoro) must navigate to the goal (the Thousand Sunny ship) on a 7x7 grid. The game progressively increases difficulty through control shuffling, visual distortions, and an AI that moves the goal away from the player. All game logic is pure and deterministic (given the same random seed), managed through a React `useReducer` pattern.

**Source Files:**
- `src/components/404/types.ts` -- Type definitions, constants, and direction deltas
- `src/components/404/grid.ts` -- Grid generation algorithm
- `src/components/404/reducer.ts` -- Game state machine (reducer + initial state factory)
- `src/components/404/quotes.ts` -- Quote pools and random selectors
- `src/components/404/useGameInput.ts` -- Keyboard and touch swipe input hook

---

## GameState Interface

Defined in `types.ts`:

```typescript
interface GameState {
  grid: TileType[][];       // 7x7 grid of tile types
  playerPos: Position;       // Current player position {row, col}
  goalPos: Position;         // Current goal/Sunny position {row, col}
  moveCount: number;         // Total moves made
  controlMapping: ControlMapping;  // Current direction remapping
  currentQuote: string | null;     // Active quote to display (or null)
  won: boolean;              // Whether the player has reached the goal
  gridRotation: number;      // CSS rotation in degrees (visual only)
  colorShiftAmount: number;  // Color distortion amount 0-1 (visual only)
}
```

### Supporting Types

```typescript
type Direction = "up" | "down" | "left" | "right";
type TileType = "empty" | "sake" | "deadend";

interface Position {
  row: number;
  col: number;
}

interface ControlMapping {
  up: Direction;
  down: Direction;
  left: Direction;
  right: Direction;
}
```

---

## GameAction Types

Defined in `types.ts`:

```typescript
type GameAction =
  | { type: "MOVE"; direction: Direction }
  | { type: "RESET" };
```

| Action | Payload | Description |
|--------|---------|-------------|
| `MOVE` | `direction: Direction` | Attempts to move the player in the specified direction (subject to control mapping). |
| `RESET` | None | Regenerates the entire game state (new grid, positions, reset counters). |

---

## Constants

Defined in `types.ts`:

| Constant | Value | Description |
|----------|-------|-------------|
| `GRID_SIZE` | `7` | Grid dimensions (7x7). |
| `SAKE_SHOP_COUNT` | `3` | Number of sake shop tiles placed on the grid. |
| `DEAD_END_COUNT` | `4` | Number of dead end tiles placed on the grid. |
| `DIRECTION_DELTAS` | `{ up: [-1,0], down: [1,0], left: [0,-1], right: [0,1] }` | Row/column deltas for each direction. |
| `DEFAULT_CONTROLS` | Identity mapping | Default control mapping where each direction maps to itself. |

---

## Difficulty Phases

Difficulty is derived purely from `moveCount`. No explicit phase state is stored. The reducer applies effects based on move count thresholds:

| Move Range | Phase | Effects |
|------------|-------|---------|
| 0-3 | Normal | No difficulty modifiers. Default controls. |
| 4-8 | First Shuffle | Controls shuffled once at move 4. Player must discover the new mapping. |
| 9-15 | Frequent Shuffle | Controls reshuffle every 2 moves (on even move counts). |
| 16-20 | Visual Distortion | Grid rotation begins. Random +/-3 to 5 degrees per move, cumulative. |
| 21-25 | Color Shift + Nami | `colorShiftAmount` increases by 0.04 per move (capped at 1.0). Nami escalation button appears in the UI. |
| 26-39 | Sunny AI | The Sunny (goal) moves to an adjacent empty tile farthest from the player every 3 moves. All previous effects continue. |
| 40+ | Nami Takeover | Game input is blocked. The UI displays a full-screen modal forcing navigation home. |

---

## Grid Generation Algorithm

Defined in `grid.ts`:

### Process

1. **Create empty grid:** 7x7 matrix filled with `"empty"` tile type.
2. **Place player:** Pick a random edge (top/bottom/left/right), then a random position along that edge.
3. **Place goal:** Use the opposite edge from the player, random position along it.
4. **Scatter obstacles:** Place `SAKE_SHOP_COUNT` (3) sake tiles and `DEAD_END_COUNT` (4) deadend tiles at random positions, avoiding the player position, goal position, and previously placed obstacles.

### Edge Selection

```
Player on "top"    -> Goal on "bottom"
Player on "left"   -> Goal on "right"
(and vice versa)
```

### Solvability

The grid is always solvable because all obstacle tiles (sake and deadend) are passable -- they trigger side effects (quotes) but do not block movement. There are no walls or impassable cells.

---

## Control Shuffling

Defined in `reducer.ts` (`shuffleControls` function):

The function creates a random permutation of the four directions and maps them to the four input directions:

```typescript
// Example result:
{
  up: "left",      // pressing "up" moves left
  down: "right",   // pressing "down" moves right
  left: "up",      // pressing "left" moves up
  right: "down"    // pressing "right" moves down
}
```

**Guarantee:** The identity mapping (where each direction maps to itself) is re-rolled to ensure the controls are always actually shuffled.

### Shuffle Triggers

| Condition | Trigger |
|-----------|---------|
| `moveCount === 4` | Single shuffle at move 4. |
| `moveCount >= 9 && moveCount % 2 === 0` | Reshuffle every even move from 9 onward. |

---

## Sunny AI Movement

Defined in `reducer.ts` (`moveSunnyAway` function):

When triggered (moves 26+, every 3rd move), the Sunny moves to maximize distance from the player:

### Algorithm

1. Enumerate all 4 adjacent cells (up/down/left/right) from the current goal position.
2. Filter out: cells outside grid bounds, the player's current position, and non-empty tiles.
3. If no valid candidates exist, the Sunny stays put.
4. Otherwise, select the candidate with the greatest Manhattan distance from the player: `|row_diff| + |col_diff|`.

### Trigger Condition

```typescript
moveCount >= 26 && moveCount % 3 === 0
```

---

## Quote System

Defined in `quotes.ts`:

### Quote Pools

| Pool | Count | Trigger | Example |
|------|-------|---------|---------|
| `DEAD_END_QUOTES` | 12 | Player steps on a `deadend` tile. | "This is clearly a shortcut." |
| `SAKE_QUOTES` | 8 | Player steps on a `sake` tile. | "*takes a long sip* ...What was I doing again?" |
| `WIN_QUOTES` | 4 | Player reaches the goal. | "See? I knew exactly where I was going." |
| `NAMI_LINES` | 20 | Moves 21-40, displayed as escalating button text. | "RORONOA ZORO GET BACK HERE THIS INSTANT!" |

### Selection Functions

| Function | Returns | Description |
|----------|---------|-------------|
| `getRandomDeadEndQuote()` | `string` | Random quote from `DEAD_END_QUOTES`. |
| `getRandomSakeQuote()` | `string` | Random quote from `SAKE_QUOTES`. |
| `getRandomWinQuote()` | `string` | Random quote from `WIN_QUOTES`. |
| `getNamiLine(moveCount)` | `string` | Returns the Nami line at index `moveCount - 21`, clamped to array bounds. Lines escalate from calm ("Zoro... the ship is that way.") to furious ("THAT'S IT, I'M COMING TO GET YOU!"). |

### Quote Display Logic in Reducer

- Quotes are set on each move based on tile effects.
- If the player steps on a `deadend` tile: `currentQuote = getRandomDeadEndQuote()`.
- If the player steps on a `sake` tile: `currentQuote = getRandomSakeQuote()`.
- On win: `currentQuote = getRandomWinQuote()`.
- On an empty tile: `currentQuote = null`.
- Quotes display but never block movement.

---

## Reducer State Machine

Defined in `reducer.ts`:

### `createInitialState()`

Factory function that generates a fresh game state:
1. Calls `generateGrid()` to get a new grid, player position, and goal position.
2. Returns a `GameState` with `moveCount: 0`, `DEFAULT_CONTROLS`, no quote, `won: false`, `gridRotation: 0`, and `colorShiftAmount: 0`.

### `gameReducer(state, action)`

| Action | Behavior |
|--------|----------|
| `RESET` | Returns `createInitialState()` -- completely fresh state. |
| `MOVE` | See detailed flow below. |

### MOVE Action Flow

1. **Won check:** If `state.won`, return state unchanged (no moves after winning).
2. **Remap direction:** `actualDir = state.controlMapping[action.direction]`. The input direction is translated through the current control mapping.
3. **Calculate new position:** Apply `DIRECTION_DELTAS[actualDir]` to current player position.
4. **Bounds check:** If new position is outside the 7x7 grid, return state unchanged.
5. **Increment move count:** `newMoveCount = state.moveCount + 1`.
6. **Win check:** If new position matches goal position, return won state with a random win quote.
7. **Tile effects:** Check the tile at the new position for deadend/sake and set the appropriate quote.
8. **Phase effects:** Apply difficulty escalation based on `newMoveCount`:
   - Move 4: Shuffle controls once.
   - Move 9+ (even): Reshuffle controls.
   - Move 16+: Add random rotation delta (+/-3 to 5 degrees).
   - Move 21+: Increase color shift by 0.04 (capped at 1.0).
   - Move 26+ (every 3rd): Move Sunny away from player.
9. **Return new state** with all updated fields.

---

## Input Handling (useGameInput)

Defined in `useGameInput.ts`:

### Hook Signature

```typescript
function useGameInput(
  onMove: (direction: Direction) => void,
  disabled?: boolean
): {
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchEnd: (e: React.TouchEvent) => void;
}
```

### Keyboard Input

Registers a global `keydown` listener that maps keys to directions:

| Key | Direction |
|-----|-----------|
| `ArrowUp` / `w` / `W` | `up` |
| `ArrowDown` / `s` / `S` | `down` |
| `ArrowLeft` / `a` / `A` | `left` |
| `ArrowRight` / `d` / `D` | `right` |

When a mapped key is detected:
1. Check if `disabled` is `true` -- if so, ignore.
2. Call `e.preventDefault()` to prevent scroll.
3. Call `onMove(direction)`.

### Touch Swipe Input

Returns `onTouchStart` and `onTouchEnd` callbacks for the parent to attach to a container element.

| Constant | Value | Description |
|----------|-------|-------------|
| `SWIPE_THRESHOLD` | `50` | Minimum pixel distance for a swipe to register. |

**Swipe Detection:**
1. On `touchstart`, record the touch coordinates.
2. On `touchend`, calculate the delta from start to end.
3. If both `|dx|` and `|dy|` are below the threshold, ignore (tap, not swipe).
4. If `|dx| > |dy|`: horizontal swipe (right if dx > 0, left otherwise).
5. If `|dy| >= |dx|`: vertical swipe (down if dy > 0, up otherwise).

### Ref Pattern

The hook uses `useRef` for both `onMove` and `disabled` to avoid re-registering the keyboard event listener when these values change. The refs are updated on every render (for `onMove`) and via `useEffect` (for `disabled`).
