import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import CategorySection from "@/components/portfolio/CategorySection";

describe("CategorySection", () => {
  it("renders Professional label for professional category", () => {
    render(
      <CategorySection category="professional">
        <div>Project 1</div>
      </CategorySection>
    );
    expect(screen.getByText("Professional")).toBeInTheDocument();
  });

  it("renders Personal label for personal category", () => {
    render(
      <CategorySection category="personal">
        <div>Project 1</div>
      </CategorySection>
    );
    expect(screen.getByText("Personal")).toBeInTheDocument();
  });

  it("renders Contributions label for contribution category", () => {
    render(
      <CategorySection category="contribution">
        <div>Project 1</div>
      </CategorySection>
    );
    expect(screen.getByText("Contributions")).toBeInTheDocument();
  });

  it("renders children content", () => {
    render(
      <CategorySection category="professional">
        <div>Test Project</div>
      </CategorySection>
    );
    expect(screen.getByText("Test Project")).toBeInTheDocument();
  });
});
