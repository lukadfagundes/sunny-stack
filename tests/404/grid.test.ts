import { generateGrid } from "@/components/404/grid";
import { GRID_SIZE, SAKE_SHOP_COUNT, DEAD_END_COUNT } from "@/components/404/types";

describe("generateGrid", () => {
  it("returns a grid of the correct size", () => {
    const { grid } = generateGrid();
    expect(grid).toHaveLength(GRID_SIZE);
    grid.forEach((row) => expect(row).toHaveLength(GRID_SIZE));
  });

  it("places player on an edge cell", () => {
    const { playerPos } = generateGrid();
    const onEdge =
      playerPos.row === 0 ||
      playerPos.row === GRID_SIZE - 1 ||
      playerPos.col === 0 ||
      playerPos.col === GRID_SIZE - 1;
    expect(onEdge).toBe(true);
  });

  it("places goal on the opposite edge from player", () => {
    const last = GRID_SIZE - 1;
    for (let i = 0; i < 20; i++) {
      const { playerPos, goalPos } = generateGrid();

      // Goal must be on an edge
      const goalOnEdge =
        goalPos.row === 0 ||
        goalPos.row === last ||
        goalPos.col === 0 ||
        goalPos.col === last;
      expect(goalOnEdge).toBe(true);

      // Player and goal must be on opposite edges.
      // The grid picks one of 4 edges for the player; the goal goes on the
      // opposite. Corner cells belong to two edges, so we check that at least
      // one opposite-edge pairing holds.
      const topBottom =
        (playerPos.row === 0 && goalPos.row === last) ||
        (playerPos.row === last && goalPos.row === 0);
      const leftRight =
        (playerPos.col === 0 && goalPos.col === last) ||
        (playerPos.col === last && goalPos.col === 0);

      expect(topBottom || leftRight).toBe(true);
    }
  });

  it("places the correct number of obstacles", () => {
    const { grid } = generateGrid();
    let sakeCount = 0;
    let deadEndCount = 0;

    for (const row of grid) {
      for (const tile of row) {
        if (tile === "sake") sakeCount++;
        if (tile === "deadend") deadEndCount++;
      }
    }

    expect(sakeCount).toBe(SAKE_SHOP_COUNT);
    expect(deadEndCount).toBe(DEAD_END_COUNT);
  });

  it("does not place obstacles on player or goal positions", () => {
    for (let i = 0; i < 20; i++) {
      const { grid, playerPos, goalPos } = generateGrid();
      expect(grid[playerPos.row][playerPos.col]).toBe("empty");
      expect(grid[goalPos.row][goalPos.col]).toBe("empty");
    }
  });

  it("produces different grids on repeated calls (randomness)", () => {
    const results = Array.from({ length: 10 }, () => generateGrid());
    const positions = results.map(
      (r) => `${r.playerPos.row},${r.playerPos.col}`
    );
    // With 10 random grids, not all player positions should be identical
    const unique = new Set(positions);
    expect(unique.size).toBeGreaterThan(1);
  });

  it("fills remaining cells with empty", () => {
    const { grid } = generateGrid();
    let emptyCount = 0;
    for (const row of grid) {
      for (const tile of row) {
        if (tile === "empty") emptyCount++;
      }
    }
    const totalCells = GRID_SIZE * GRID_SIZE;
    expect(emptyCount).toBe(totalCells - SAKE_SHOP_COUNT - DEAD_END_COUNT);
  });
});
