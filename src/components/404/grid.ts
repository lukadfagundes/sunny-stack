// ── Grid generation ──
// Places player on a random edge, goal on the opposite edge,
// then scatters obstacles randomly. Always solvable because
// all obstacle tiles are passable (they have side effects, not walls).

import {
  type TileType,
  type Position,
  GRID_SIZE,
  SAKE_SHOP_COUNT,
  DEAD_END_COUNT,
} from "./types";

type Edge = "top" | "bottom" | "left" | "right";

const OPPOSITE_EDGE: Record<Edge, Edge> = {
  top: "bottom",
  bottom: "top",
  left: "right",
  right: "left",
};

function randomEdgePosition(edge: Edge): Position {
  const along = Math.floor(Math.random() * GRID_SIZE);
  switch (edge) {
    case "top":
      return { row: 0, col: along };
    case "bottom":
      return { row: GRID_SIZE - 1, col: along };
    case "left":
      return { row: along, col: 0 };
    case "right":
      return { row: along, col: GRID_SIZE - 1 };
  }
}

function posEq(a: Position, b: Position): boolean {
  return a.row === b.row && a.col === b.col;
}

export function generateGrid(): {
  grid: TileType[][];
  playerPos: Position;
  goalPos: Position;
} {
  // Create empty grid
  const grid: TileType[][] = Array.from({ length: GRID_SIZE }, () =>
    Array.from({ length: GRID_SIZE }, () => "empty" as TileType)
  );

  // Pick random edge for player, opposite for goal
  const edges: Edge[] = ["top", "bottom", "left", "right"];
  const playerEdge = edges[Math.floor(Math.random() * edges.length)];
  const goalEdge = OPPOSITE_EDGE[playerEdge];

  const playerPos = randomEdgePosition(playerEdge);
  const goalPos = randomEdgePosition(goalEdge);

  // Scatter obstacles, avoiding player and goal positions
  const reserved = [playerPos, goalPos];
  const obstacleTypes: TileType[] = [
    ...Array(SAKE_SHOP_COUNT).fill("sake" as TileType),
    ...Array(DEAD_END_COUNT).fill("deadend" as TileType),
  ];

  for (const type of obstacleTypes) {
    let pos: Position;
    do {
      pos = {
        row: Math.floor(Math.random() * GRID_SIZE),
        col: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (
      reserved.some((r) => posEq(r, pos)) ||
      grid[pos.row][pos.col] !== "empty"
    );

    grid[pos.row][pos.col] = type;
    reserved.push(pos);
  }

  return { grid, playerPos, goalPos };
}
