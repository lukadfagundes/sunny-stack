import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import GameHUD from "@/components/404/GameHUD";
import type { GameState } from "@/components/404/types";
import { DEFAULT_CONTROLS } from "@/components/404/types";

function makeState(overrides: Partial<GameState> = {}): GameState {
  return {
    grid: [],
    playerPos: { row: 0, col: 0 },
    goalPos: { row: 6, col: 6 },
    moveCount: 0,
    controlMapping: DEFAULT_CONTROLS,
    currentQuote: null,
    won: false,
    gridRotation: 0,
    colorShiftAmount: 0,
    ...overrides,
  };
}

describe("GameHUD", () => {
  it("renders move count with singular form", () => {
    render(<GameHUD state={makeState({ moveCount: 1 })} />);
    expect(screen.getByText(/1 move\b/)).toBeInTheDocument();
  });

  it("renders move count with plural form", () => {
    render(<GameHUD state={makeState({ moveCount: 5 })} />);
    expect(screen.getByText(/5 moves/)).toBeInTheDocument();
  });

  it("renders zero moves with plural form", () => {
    render(<GameHUD state={makeState({ moveCount: 0 })} />);
    expect(screen.getByText(/0 moves/)).toBeInTheDocument();
  });

  // Phase label tests
  it.each([
    [0, "Smooth sailing..."],
    [3, "Smooth sailing..."],
    [4, "Wait, which way is north?"],
    [8, "Wait, which way is north?"],
    [9, "The controls feel... wrong."],
    [15, "The controls feel... wrong."],
    [16, "Is the world spinning?"],
    [20, "Is the world spinning?"],
    [21, "Everything looks different..."],
    [25, "Everything looks different..."],
    [26, "The ship is RUNNING AWAY?!"],
    [99, "The ship is RUNNING AWAY?!"],
  ])("shows correct phase label at %i moves", (moveCount, expectedLabel) => {
    render(<GameHUD state={makeState({ moveCount })} />);
    expect(screen.getByText(expectedLabel)).toBeInTheDocument();
  });

  it("displays a quote when currentQuote is set and not won", () => {
    render(
      <GameHUD
        state={makeState({ currentQuote: "I don't know where I am!", won: false })}
      />
    );
    // Quote is wrapped in curly quotes
    expect(
      screen.getByText(/I don't know where I am!/)
    ).toBeInTheDocument();
    expect(screen.getByText("— Zoro")).toBeInTheDocument();
  });

  it("does not display quote when won is true", () => {
    render(
      <GameHUD
        state={makeState({ currentQuote: "Some quote", won: true })}
      />
    );
    expect(screen.queryByText(/Some quote/)).not.toBeInTheDocument();
  });

  it("does not display quote when currentQuote is null", () => {
    render(<GameHUD state={makeState({ currentQuote: null })} />);
    expect(screen.queryByText("— Zoro")).not.toBeInTheDocument();
  });
});
