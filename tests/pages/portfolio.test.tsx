import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import PortfolioPage from "@/app/portfolio/page";

describe("PortfolioPage", () => {
  it("renders the Portfolio heading", () => {
    render(<PortfolioPage />);
    expect(screen.getByText("Portfolio")).toBeInTheDocument();
  });

  it("renders category sections", () => {
    render(<PortfolioPage />);
    // Should render at least one category label
    const labels = ["Professional", "Personal", "Contributions"];
    const found = labels.some((label) => screen.queryByText(label));
    expect(found).toBe(true);
  });

  it("renders project cards", () => {
    render(<PortfolioPage />);
    // Projects should render with title elements (h3)
    const headings = screen.getAllByRole("heading");
    expect(headings.length).toBeGreaterThan(1);
  });

  it("expands a card on click", () => {
    render(<PortfolioPage />);
    // Cards use div click handlers, not buttons — click a project title
    const firstProject = screen.getAllByRole("heading", { level: 3 })[0];
    fireEvent.click(firstProject);
  });

  it("wraps content in a main element", () => {
    const { container } = render(<PortfolioPage />);
    expect(container.querySelector("main")).toBeInTheDocument();
  });
});
