import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import LetterReveal from "@/components/LetterReveal";

describe("LetterReveal", () => {
  it("renders the text with aria-label when animated", () => {
    render(<LetterReveal text="Hello World" />);
    expect(screen.getByLabelText("Hello World")).toBeInTheDocument();
  });

  it("renders individual letter spans when animated", () => {
    const { container } = render(<LetterReveal text="ABC" />);
    const spans = container.querySelectorAll("[aria-hidden='true']");
    expect(spans).toHaveLength(3);
  });

  it("renders plain text when reducedMotion is true", () => {
    render(<LetterReveal text="Hello World" reducedMotion />);
    expect(screen.getByText("Hello World")).toBeInTheDocument();
  });

  it("does not render individual spans in reduced motion mode", () => {
    const { container } = render(
      <LetterReveal text="Hello" reducedMotion />
    );
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(0);
  });

  it("applies custom className", () => {
    const { container } = render(
      <LetterReveal text="Test" className="custom-class" reducedMotion />
    );
    expect(container.querySelector(".custom-class")).toBeInTheDocument();
  });

  it("renders non-breaking spaces for space characters", () => {
    const { container } = render(<LetterReveal text="A B" />);
    const spans = container.querySelectorAll("[aria-hidden='true']");
    // Middle span should be a non-breaking space
    expect(spans[1].textContent).toBe("\u00A0");
  });
});
