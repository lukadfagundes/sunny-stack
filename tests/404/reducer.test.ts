import { createInitialState, gameReducer } from "@/components/404/reducer";
import {
  GRID_SIZE,
  DEFAULT_CONTROLS,
  type GameState,
  type TileType,
} from "@/components/404/types";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides };
}

function emptyGrid(): TileType[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    new Array<TileType>(GRID_SIZE).fill("empty"),
  ) as TileType[][];
}

describe("createInitialState", () => {
  it("returns a valid initial game state", () => {
    const state = createInitialState();
    expect(state.grid).toHaveLength(GRID_SIZE);
    expect(state.moveCount).toBe(0);
    expect(state.won).toBe(false);
    expect(state.controlMapping).toEqual(DEFAULT_CONTROLS);
    expect(state.currentQuote).toBeNull();
    expect(state.gridRotation).toBe(0);
    expect(state.colorShiftAmount).toBe(0);
  });

  it("places player and goal positions within grid bounds", () => {
    const state = createInitialState();
    expect(state.playerPos.row).toBeGreaterThanOrEqual(0);
    expect(state.playerPos.row).toBeLessThan(GRID_SIZE);
    expect(state.playerPos.col).toBeGreaterThanOrEqual(0);
    expect(state.playerPos.col).toBeLessThan(GRID_SIZE);
    expect(state.goalPos.row).toBeGreaterThanOrEqual(0);
    expect(state.goalPos.col).toBeLessThan(GRID_SIZE);
  });
});

describe("gameReducer — RESET", () => {
  it("returns a fresh state", () => {
    const state = makeState({ moveCount: 50, won: true });
    const next = gameReducer(state, { type: "RESET" });
    expect(next.moveCount).toBe(0);
    expect(next.won).toBe(false);
  });
});

describe("gameReducer — MOVE", () => {
  it("does nothing when game is won", () => {
    const state = makeState({ won: true });
    const next = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(next).toBe(state);
  });

  it("moves player in the requested direction", () => {
    // Place player in center so all directions are valid
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.playerPos).toEqual({ row: 3, col: 4 });
    expect(moved.moveCount).toBe(1);
  });

  it("blocks movement out of bounds", () => {
    const state = makeState({
      playerPos: { row: 0, col: 0 },
      goalPos: { row: GRID_SIZE - 1, col: GRID_SIZE - 1 },
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "up" });
    expect(moved).toBe(state); // no change
  });

  it("blocks movement to the left when at left edge", () => {
    const state = makeState({
      playerPos: { row: 3, col: 0 },
      goalPos: { row: 0, col: GRID_SIZE - 1 },
    });
    const moved = gameReducer(state, { type: "MOVE", direction: "left" });
    expect(moved).toBe(state);
  });

  it("detects win when player reaches goal", () => {
    const state = makeState({
      playerPos: { row: 0, col: 0 },
      goalPos: { row: 0, col: 1 },
    });

    const won = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(won.won).toBe(true);
    expect(won.currentQuote).toBeTruthy();
    expect(won.playerPos).toEqual({ row: 0, col: 1 });
  });

  it("triggers a quote when landing on a deadend tile", () => {
    const grid = emptyGrid();
    grid[3][4] = "deadend";

    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      grid,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.currentQuote).toBeTruthy();
  });

  it("triggers a quote when landing on a sake tile", () => {
    const grid = emptyGrid();
    grid[3][4] = "sake";

    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      grid,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.currentQuote).toBeTruthy();
  });

  it("clears quote when landing on empty tile", () => {
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      currentQuote: "some old quote",
      grid: emptyGrid(),
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.currentQuote).toBeNull();
  });
});

describe("gameReducer — phase effects", () => {
  it("shuffles controls at move 4", () => {
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      moveCount: 3,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.moveCount).toBe(4);
    // Controls should be shuffled — may or may not equal defaults due to randomness,
    // but the shuffle function guarantees it's NOT the identity mapping
    const { controlMapping } = moved;
    const isIdentity =
      controlMapping.up === "up" &&
      controlMapping.down === "down" &&
      controlMapping.left === "left" &&
      controlMapping.right === "right";
    expect(isIdentity).toBe(false);
  });

  it("reshuffles controls every 2 moves starting at 9", () => {
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      moveCount: 9,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.moveCount).toBe(10);
    // Move 10 is even and >= 9, so controls should shuffle
    const isIdentity =
      moved.controlMapping.up === "up" &&
      moved.controlMapping.down === "down" &&
      moved.controlMapping.left === "left" &&
      moved.controlMapping.right === "right";
    expect(isIdentity).toBe(false);
  });

  it("applies grid rotation starting at move 16", () => {
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      moveCount: 15,
      gridRotation: 0,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.moveCount).toBe(16);
    expect(moved.gridRotation).not.toBe(0);
  });

  it("increases color shift starting at move 21", () => {
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      moveCount: 20,
      colorShiftAmount: 0,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.moveCount).toBe(21);
    expect(moved.colorShiftAmount).toBeGreaterThan(0);
  });

  it("caps color shift at 1", () => {
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      moveCount: 20,
      colorShiftAmount: 0.99,
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.colorShiftAmount).toBeLessThanOrEqual(1);
  });

  it("moves goal away every 3 moves starting at 26", () => {
    // Create a grid where the goal has room to move
    const grid = emptyGrid();

    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 3 },
      moveCount: 26,
      grid,
    });

    // Move 27 is 27 % 3 === 0, so goal should move
    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    expect(moved.moveCount).toBe(27);
    // Goal should have moved (may equal original if trapped, but in this open grid it should move)
    const goalMoved =
      moved.goalPos.row !== state.goalPos.row ||
      moved.goalPos.col !== state.goalPos.col;
    expect(goalMoved).toBe(true);
  });
});

describe("gameReducer — control remapping", () => {
  it("applies control mapping to input direction", () => {
    // Set up swapped controls: pressing "right" should actually move "left"
    const state = makeState({
      playerPos: { row: 3, col: 3 },
      goalPos: { row: 0, col: 0 },
      controlMapping: {
        up: "down",
        down: "up",
        left: "right",
        right: "left",
      },
    });

    const moved = gameReducer(state, { type: "MOVE", direction: "right" });
    // "right" is remapped to "left", so col should decrease
    expect(moved.playerPos).toEqual({ row: 3, col: 2 });
  });
});

describe("gameReducer — default case", () => {
  it("returns state for unknown action type", () => {
    const state = makeState();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const next = gameReducer(state, { type: "UNKNOWN" } as any);
    expect(next).toBe(state);
  });
});
