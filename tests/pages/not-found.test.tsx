import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import NotFound from "@/app/not-found";

// Mock useSyncExternalStore for useReducedMotion — return false (not reduced)
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

// Mock matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: jest.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe("NotFound page", () => {
  it("renders the ZoroGame when motion is not reduced", () => {
    render(<NotFound />);
    // ZoroGame renders the 404 heading and game board
    expect(screen.getByText("404")).toBeInTheDocument();
    expect(screen.getByRole("grid")).toBeInTheDocument();
  });

  it("wraps content in a main element", () => {
    const { container } = render(<NotFound />);
    expect(container.querySelector("main")).toBeInTheDocument();
  });
});
