// ── Game types, constants, and direction deltas ──

export type Direction = "up" | "down" | "left" | "right";

export type TileType = "empty" | "sake" | "deadend";

export interface Position {
  row: number;
  col: number;
}

export interface ControlMapping {
  up: Direction;
  down: Direction;
  left: Direction;
  right: Direction;
}

export interface GameState {
  grid: TileType[][];
  playerPos: Position;
  goalPos: Position;
  moveCount: number;
  controlMapping: ControlMapping;
  currentQuote: string | null;
  won: boolean;
  gridRotation: number;
  colorShiftAmount: number;
}

export type GameAction =
  | { type: "MOVE"; direction: Direction }
  | { type: "RESET" };

// Grid size
export const GRID_SIZE = 7;

// Direction deltas: [row, col]
export const DIRECTION_DELTAS: Record<Direction, [number, number]> = {
  up: [-1, 0],
  down: [1, 0],
  left: [0, -1],
  right: [0, 1],
};

// Default (identity) control mapping
export const DEFAULT_CONTROLS: ControlMapping = {
  up: "up",
  down: "down",
  left: "left",
  right: "right",
};

// Obstacle counts
export const SAKE_SHOP_COUNT = 3;
export const DEAD_END_COUNT = 4;
