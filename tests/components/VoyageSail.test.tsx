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

  it("renders the ship image", () => {
    const { container } = render(<VoyageSail />);
    const shipImg = container.querySelector("img[aria-hidden='true']");
    expect(shipImg).toBeInTheDocument();
    expect(shipImg).toHaveAttribute("src", "/ship.png");
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
    // 3 wave SVGs (ship is now an img)
    expect(waveSvgs.length).toBe(3);
  });

  it("applies wave-drift animation to wave SVGs", () => {
    const { container } = render(<VoyageSail />);
    const animatedSvgs = Array.from(
      container.querySelectorAll("svg[aria-hidden='true']")
    ).filter((svg) =>
      (svg as HTMLElement).style.animation?.includes("voyage-wave-drift")
    );
    expect(animatedSvgs.length).toBe(3);
  });
});

describe("VoyageSail (reduced motion)", () => {
  beforeEach(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: jest.fn(),
        removeListener: jest.fn(),
        addEventListener: jest.fn(),
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
  });

  afterEach(() => {
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
  });

  it("waves have animation none when reduced motion is preferred", () => {
    const { container } = render(<VoyageSail />);
    const waveSvgs = Array.from(
      container.querySelectorAll("svg[aria-hidden='true']")
    ).filter((svg) => (svg as HTMLElement).style.animation === "none");
    expect(waveSvgs.length).toBe(3);
  });

  it("stars have static opacity when reduced motion is preferred", () => {
    const { container } = render(<VoyageSail />);
    const starDivs = Array.from(container.querySelectorAll("div")).filter(
      (div) =>
        div.style.borderRadius === "50%" && div.style.opacity === "0.4"
    );
    expect(starDivs.length).toBe(60);
  });

  it("ship renders as static div when reduced motion is preferred", () => {
    const { container } = render(<VoyageSail />);
    const staticShip = Array.from(container.querySelectorAll("div")).find(
      (div) =>
        div.style.left === "50%" &&
        div.style.transform === "translate(-50%, -100%)"
    );
    expect(staticShip).toBeTruthy();
  });

  it("shooting stars are not rendered when reduced motion is preferred", () => {
    const { container } = render(<VoyageSail />);
    const overflowContainers = Array.from(
      container.querySelectorAll("div[aria-hidden='true']")
    ).filter(
      (div) =>
        (div as HTMLElement).style.height === "70%" &&
        div.className.includes("overflow")
    );
    expect(overflowContainers.length).toBe(1);
  });
});
