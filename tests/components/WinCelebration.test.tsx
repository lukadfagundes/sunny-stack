import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import WinCelebration from "@/components/404/WinCelebration";

describe("WinCelebration", () => {
  it("renders the victory heading", () => {
    render(<WinCelebration quote="Test quote" moveCount={10} />);
    expect(screen.getByText("He Found It!")).toBeInTheDocument();
  });

  it("renders the quote when provided", () => {
    render(<WinCelebration quote="I knew it all along" moveCount={5} />);
    expect(screen.getByText(/I knew it all along/)).toBeInTheDocument();
  });

  it("does not render quote when null", () => {
    render(<WinCelebration quote={null} moveCount={5} />);
    // Only heading and move count should show
    expect(screen.getByText("He Found It!")).toBeInTheDocument();
    expect(screen.queryByText(/\u201C/)).not.toBeInTheDocument();
  });

  it("shows the move count message", () => {
    render(<WinCelebration quote={null} moveCount={42} />);
    expect(screen.getByText(/42 moves to find a ship/)).toBeInTheDocument();
  });

  it("renders the Go Home link", () => {
    render(<WinCelebration quote={null} moveCount={10} />);
    const link = screen.getByRole("link", { name: /Go Home for Real/i });
    expect(link).toHaveAttribute("href", "/");
  });

  it("renders particle burst elements", () => {
    const { container } = render(
      <WinCelebration quote={null} moveCount={10} />,
    );
    // 25 particles
    const particles = container.querySelectorAll(".rounded-full");
    expect(particles.length).toBe(25);
  });
});
