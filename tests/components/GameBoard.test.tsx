import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import GameBoard from "@/components/404/GameBoard";
import { createInitialState } from "@/components/404/reducer";
import type { GameState, TileType } from "@/components/404/types";
import { GRID_SIZE } from "@/components/404/types";

function emptyGrid(): TileType[][] {
  return Array.from({ length: GRID_SIZE }, () =>
    new Array<TileType>(GRID_SIZE).fill("empty"),
  ) as TileType[][];
}

function makeState(overrides: Partial<GameState> = {}): GameState {
  return { ...createInitialState(), ...overrides };
}

describe("GameBoard", () => {
  it("renders the game grid", () => {
    const state = makeState();
    render(<GameBoard state={state} />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders the correct number of grid cells", () => {
    const state = makeState({ grid: emptyGrid() });
    render(<GameBoard state={state} />);
    const cells = screen.getAllByRole("gridcell");
    expect(cells).toHaveLength(GRID_SIZE * GRID_SIZE);
  });

  it("labels the player cell correctly", () => {
    const grid = emptyGrid();
    const state = makeState({
      grid,
      playerPos: { row: 0, col: 0 },
      goalPos: { row: 5, col: 5 },
    });
    render(<GameBoard state={state} />);
    expect(screen.getByLabelText("Zoro (you)")).toBeInTheDocument();
  });

  it("labels the goal cell correctly", () => {
    const grid = emptyGrid();
    const state = makeState({
      grid,
      playerPos: { row: 0, col: 0 },
      goalPos: { row: 5, col: 5 },
    });
    render(<GameBoard state={state} />);
    expect(screen.getByLabelText("Thousand Sunny (goal)")).toBeInTheDocument();
  });

  it("labels sake tiles as Sake shop", () => {
    const grid = emptyGrid();
    grid[2][2] = "sake";
    const state = makeState({
      grid,
      playerPos: { row: 0, col: 0 },
      goalPos: { row: 5, col: 5 },
    });
    render(<GameBoard state={state} />);
    expect(screen.getByLabelText("Sake shop")).toBeInTheDocument();
  });

  it("labels deadend tiles as Dead end", () => {
    const grid = emptyGrid();
    grid[3][3] = "deadend";
    const state = makeState({
      grid,
      playerPos: { row: 0, col: 0 },
      goalPos: { row: 5, col: 5 },
    });
    render(<GameBoard state={state} />);
    expect(screen.getByLabelText("Dead end")).toBeInTheDocument();
  });

  it("applies hue-rotate filter when colorShiftAmount > 0", () => {
    const grid = emptyGrid();
    const state = makeState({
      grid,
      playerPos: { row: 0, col: 0 },
      goalPos: { row: 5, col: 5 },
      colorShiftAmount: 0.5,
    });
    const { container } = render(<GameBoard state={state} />);
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper.style.filter).toContain("hue-rotate");
  });
});
