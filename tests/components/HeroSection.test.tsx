import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import HeroSection from "@/components/HeroSection";

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

describe("HeroSection", () => {
  it("renders the name", () => {
    render(<HeroSection />);
    expect(screen.getByLabelText("Luka Fagundes")).toBeInTheDocument();
  });

  it("renders the title", () => {
    render(<HeroSection />);
    expect(screen.getByLabelText("Full Stack Developer")).toBeInTheDocument();
  });

  it("renders a section element", () => {
    const { container } = render(<HeroSection />);
    expect(container.querySelector("section")).toBeInTheDocument();
  });
});
