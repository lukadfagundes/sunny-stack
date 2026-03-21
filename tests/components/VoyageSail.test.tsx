import React from "react";
import { render } from "@testing-library/react";
import "../../tests/helpers/mocks";
import VoyageSail from "@/components/landing/VoyageSail";

// Mock useSyncExternalStore — isClient returns true, reducedMotion returns false
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

// Mock matchMedia for useReducedMotion
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

describe("VoyageSail", () => {
  it("renders the fixed background container", () => {
    const { container } = render(<VoyageSail />);
    const bg = container.firstElementChild as HTMLElement;
    expect(bg.style.background).toContain("linear-gradient");
  });

  it("renders the ship SVG", () => {
    const { container } = render(<VoyageSail />);
    const shipSvg = container.querySelector("svg[aria-hidden='true']");
    expect(shipSvg).toBeInTheDocument();
  });

  it("renders the horizon glow line", () => {
    const { container } = render(<VoyageSail />);
    // The horizon line has a box-shadow with rgba(240, 180, 41)
    const horizonElements = container.querySelectorAll("[style]");
    const horizonLine = Array.from(horizonElements).find(
      (el) => (el as HTMLElement).style.boxShadow?.includes("240, 180, 41")
    );
    expect(horizonLine).toBeTruthy();
  });

  it("renders star field elements", () => {
    const { container } = render(<VoyageSail />);
    // Stars have border-radius: 50% — find the star container
    const starContainer = container.querySelector("[aria-hidden='true']");
    expect(starContainer).toBeInTheDocument();
  });

  it("renders ocean wave SVGs", () => {
    const { container } = render(<VoyageSail />);
    const waveSvgs = container.querySelectorAll("svg[aria-hidden='true']");
    // Ship SVG + 3 wave SVGs = at least 4
    expect(waveSvgs.length).toBeGreaterThanOrEqual(4);
  });
});
