// ── Game state machine ──
// All game logic lives here. Phase is derived from moveCount.
// Effects (shuffle, rotation, color shift, Sunny movement) trigger
// inside the reducer based on move count thresholds.

import {
  type GameState,
  type GameAction,
  type Direction,
  type ControlMapping,
  type Position,
  GRID_SIZE,
  DIRECTION_DELTAS,
  DEFAULT_CONTROLS,
} from "./types";
import { generateGrid } from "./grid";
import {
  getRandomDeadEndQuote,
  getRandomSakeQuote,
  getRandomWinQuote,
} from "./quotes";

// ── Control shuffling ──

function shuffleControls(): ControlMapping {
  const dirs: Direction[] = ["up", "down", "left", "right"];
  let shuffled: Direction[];

  // Re-roll if we get the identity mapping
  do {
    shuffled = [...dirs].sort(() => Math.random() - 0.5);
  } while (
    shuffled[0] === "up" &&
    shuffled[1] === "down" &&
    shuffled[2] === "left" &&
    shuffled[3] === "right"
  );

  return {
    up: shuffled[0],
    down: shuffled[1],
    left: shuffled[2],
    right: shuffled[3],
  };
}

// ── Sunny movement (moves 26+): move to adjacent empty tile farthest from player ──

function moveSunnyAway(state: GameState): Position {
  const { goalPos, playerPos, grid } = state;
  const candidates: Position[] = [];

  for (const [dr, dc] of Object.values(DIRECTION_DELTAS)) {
    const nr = goalPos.row + dr;
    const nc = goalPos.col + dc;
    if (nr >= 0 && nr < GRID_SIZE && nc >= 0 && nc < GRID_SIZE) {
      // Don't move onto player
      if (nr === playerPos.row && nc === playerPos.col) continue;
      // Prefer empty tiles
      if (grid[nr][nc] === "empty") {
        candidates.push({ row: nr, col: nc });
      }
    }
  }

  if (candidates.length === 0) return goalPos;

  // Pick the one with greatest Manhattan distance from player
  return candidates.reduce((best, c) => {
    const dBest =
      Math.abs(best.row - playerPos.row) + Math.abs(best.col - playerPos.col);
    const dC =
      Math.abs(c.row - playerPos.row) + Math.abs(c.col - playerPos.col);
    return dC > dBest ? c : best;
  });
}

// ── Initial state factory ──

export function createInitialState(): GameState {
  const { grid, playerPos, goalPos } = generateGrid();
  return {
    grid,
    playerPos,
    goalPos,
    moveCount: 0,
    controlMapping: DEFAULT_CONTROLS,
    currentQuote: null,
    won: false,
    gridRotation: 0,
    colorShiftAmount: 0,
  };
}

// ── Reducer ──

export function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case "RESET":
      return createInitialState();

    case "MOVE": {
      if (state.won) return state;

      // Remap direction through control mapping
      const actualDir = state.controlMapping[action.direction];
      const [dr, dc] = DIRECTION_DELTAS[actualDir];
      const newRow = state.playerPos.row + dr;
      const newCol = state.playerPos.col + dc;

      // Bounds check
      if (
        newRow < 0 ||
        newRow >= GRID_SIZE ||
        newCol < 0 ||
        newCol >= GRID_SIZE
      ) {
        return state;
      }

      const newPos: Position = { row: newRow, col: newCol };
      const newMoveCount = state.moveCount + 1;

      // Check win
      if (newRow === state.goalPos.row && newCol === state.goalPos.col) {
        return {
          ...state,
          playerPos: newPos,
          moveCount: newMoveCount,
          won: true,
          currentQuote: getRandomWinQuote(),
        };
      }

      // Check tile effects — quotes display but don't block movement
      const tile = state.grid[newRow][newCol];
      let quote: string | null = null;

      if (tile === "deadend") {
        quote = getRandomDeadEndQuote();
      } else if (tile === "sake") {
        quote = getRandomSakeQuote();
      }

      // ── Phase effects based on move count ──
      let newMapping = state.controlMapping;
      let newRotation = state.gridRotation;
      let newColorShift = state.colorShiftAmount;
      let newGoalPos = state.goalPos;

      // Moves 4-8: shuffle once at move 4
      if (newMoveCount === 4) {
        newMapping = shuffleControls();
      }

      // Moves 9+: reshuffle every 2 moves
      if (newMoveCount >= 9 && newMoveCount % 2 === 0) {
        newMapping = shuffleControls();
      }

      // Moves 16+: grid rotation, +-3 to 5 degrees per move
      if (newMoveCount >= 16) {
        const delta = (Math.random() * 2 + 3) * (Math.random() > 0.5 ? 1 : -1);
        newRotation = state.gridRotation + delta;
      }

      // Moves 21+: color shift increases
      if (newMoveCount >= 21) {
        newColorShift = Math.min(state.colorShiftAmount + 0.04, 1);
      }

      // Moves 26+: Sunny moves away every 3 moves
      if (newMoveCount >= 26 && newMoveCount % 3 === 0) {
        newGoalPos = moveSunnyAway({
          ...state,
          playerPos: newPos,
          goalPos: state.goalPos,
        });
      }

      return {
        ...state,
        playerPos: newPos,
        moveCount: newMoveCount,
        controlMapping: newMapping,
        currentQuote: quote,
        gridRotation: newRotation,
        colorShiftAmount: newColorShift,
        goalPos: newGoalPos,
      };
    }

    default:
      return state;
  }
}
