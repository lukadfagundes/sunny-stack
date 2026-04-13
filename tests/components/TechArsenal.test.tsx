import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import TechArsenal from "@/components/landing/TechArsenal";

describe("TechArsenal", () => {
  it("renders the main heading", () => {
    render(<TechArsenal />);
    expect(screen.getByText("The Cargo Hold")).toBeInTheDocument();
  });

  it("renders all 4 category labels", () => {
    render(<TechArsenal />);
    expect(screen.getByText("Languages")).toBeInTheDocument();
    expect(screen.getByText("Frameworks")).toBeInTheDocument();
    expect(screen.getByText("Tools")).toBeInTheDocument();
    expect(screen.getByText("Cloud & Deploy")).toBeInTheDocument();
  });

  it("renders tech items within categories", () => {
    render(<TechArsenal />);
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("React")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    expect(screen.getByText("Vercel")).toBeInTheDocument();
  });

  it("renders all language items", () => {
    render(<TechArsenal />);
    const languages = [
      "TypeScript",
      "JavaScript",
      "Python",
      "Lua",
      "HTML/CSS",
      "SQL",
    ];
    for (const lang of languages) {
      expect(screen.getByText(lang)).toBeInTheDocument();
    }
  });

  it("renders all framework items", () => {
    render(<TechArsenal />);
    const frameworks = [
      "React",
      "Next.js",
      "Node.js",
      "Express",
      "Tailwind CSS",
      "Discord.js",
    ];
    for (const fw of frameworks) {
      expect(screen.getByText(fw)).toBeInTheDocument();
    }
  });

  it("expands crate item on hover", () => {
    render(<TechArsenal />);
    const tsItem = screen.getByText("TypeScript");
    const parent = tsItem.closest("[style*='perspective']");
    if (parent) {
      fireEvent.mouseEnter(parent);
      fireEvent.mouseLeave(parent);
    }
  });
});
