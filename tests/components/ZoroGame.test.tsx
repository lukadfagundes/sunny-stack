import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import { createInitialState } from "@/components/404/reducer";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(globalThis as any).__zoroStateOverride = null;

// Mock useSyncExternalStore + useReducer with override support
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useSyncExternalStore: (
      _subscribe: () => () => void,
      getSnapshot: () => boolean,
    ) => getSnapshot(),
    useReducer: (
      reducer: unknown,
      initArg: unknown,
      init?: (arg: unknown) => unknown,
    ) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const override = (globalThis as any).__zoroStateOverride;
      if (override) {
        return [override, jest.fn()];
      }
      return actual.useReducer(reducer, initArg, init);
    },
  };
});

import ZoroGame from "@/components/404/ZoroGame";

describe("ZoroGame", () => {
  it("renders the 404 heading", () => {
    render(<ZoroGame />);
    expect(screen.getByText("404")).toBeInTheDocument();
  });

  it("renders help text", () => {
    render(<ZoroGame />);
    expect(
      screen.getByText("Help Zoro find the Thousand Sunny")
    ).toBeInTheDocument();
  });

  it("renders the game board", () => {
    render(<ZoroGame />);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders the Go Home link", () => {
    render(<ZoroGame />);
    const link = screen.getByRole("link", { name: /Just go home/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders the New grid button", () => {
    render(<ZoroGame />);
    expect(screen.getByText("New grid")).toBeInTheDocument();
  });

  it("resets game when New grid is clicked", () => {
    render(<ZoroGame />);
    const resetButton = screen.getByText("New grid");
    fireEvent.click(resetButton);
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("renders the error footer", () => {
    render(<ZoroGame />);
    expect(
      screen.getByText(/Error 404: Page not found/)
    ).toBeInTheDocument();
  });

  it("renders movement instructions", () => {
    render(<ZoroGame />);
    expect(
      screen.getByText(/Arrow keys \/ WASD \/ Swipe to move/)
    ).toBeInTheDocument();
  });
});

describe("ZoroGame (game states)", () => {
  afterEach(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__zoroStateOverride = null;
  });

  it("renders WinCelebration when won", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__zoroStateOverride = {
      ...createInitialState(),
      won: true,
      moveCount: 15,
      currentQuote: "Told you it was a shortcut.",
    };
    render(<ZoroGame />);
    expect(screen.getByText("He Found It!")).toBeInTheDocument();
    expect(screen.getByText(/15 moves to find a ship/)).toBeInTheDocument();
  });

  it("shows NamiEscalation at 25 moves", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__zoroStateOverride = {
      ...createInitialState(),
      moveCount: 25,
      won: false,
    };
    render(<ZoroGame />);
    expect(
      screen.getByText("I can SEE the Sunny from here!")
    ).toBeInTheDocument();
  });

  it("shows NamiEscalation without glow at 21 moves", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__zoroStateOverride = {
      ...createInitialState(),
      moveCount: 21,
      won: false,
    };
    render(<ZoroGame />);
    expect(
      screen.getByText("Zoro... the ship is that way.")
    ).toBeInTheDocument();
  });

  it("shows Nami takeover at 40+ moves", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (globalThis as any).__zoroStateOverride = {
      ...createInitialState(),
      moveCount: 42,
      won: false,
    };
    render(<ZoroGame />);
    expect(screen.getByText("THAT'S IT!")).toBeInTheDocument();
  });
});
