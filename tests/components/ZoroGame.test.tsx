import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ZoroGame from "@/components/404/ZoroGame";

// Mock useSyncExternalStore to always return true (isClient = true)
jest.mock("react", () => {
  const actual = jest.requireActual("react");
  return {
    ...actual,
    useSyncExternalStore: (
      _subscribe: () => () => void,
      getSnapshot: () => boolean,
    ) => getSnapshot(),
  };
});

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
    // After reset, game should still be functional
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
