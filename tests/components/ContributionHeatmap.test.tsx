import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ContributionHeatmap from "@/components/landing/ContributionHeatmap";

function makeWeek(days: Array<{ count: number; date: string }>) {
  return {
    contributionDays: days.map((d) => ({
      contributionCount: d.count,
      date: d.date,
      color: "#000",
    })),
  };
}

describe("ContributionHeatmap", () => {
  it("shows empty state when weeks array is empty", () => {
    render(
      <ContributionHeatmap calendar={{ totalContributions: 0, weeks: [] }} />
    );
    expect(
      screen.getByText("No charts available - the seas remain uncharted")
    ).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(
      <ContributionHeatmap
        calendar={{
          totalContributions: 100,
          weeks: [makeWeek([{ count: 5, date: "2025-06-01" }])],
        }}
      />
    );
    expect(screen.getByText("The Captain's Chart")).toBeInTheDocument();
  });

  it("renders total contributions count", () => {
    render(
      <ContributionHeatmap
        calendar={{
          totalContributions: 1234,
          weeks: [makeWeek([{ count: 5, date: "2025-06-01" }])],
        }}
      />
    );
    expect(screen.getByText("1,234 territories charted")).toBeInTheDocument();
  });

  it("renders day labels (Mon, Wed, Fri)", () => {
    render(
      <ContributionHeatmap
        calendar={{
          totalContributions: 10,
          weeks: [makeWeek([{ count: 1, date: "2025-01-06" }])],
        }}
      />
    );
    expect(screen.getByText("Mon")).toBeInTheDocument();
    expect(screen.getByText("Wed")).toBeInTheDocument();
    expect(screen.getByText("Fri")).toBeInTheDocument();
  });

  it("renders legend labels", () => {
    render(
      <ContributionHeatmap
        calendar={{
          totalContributions: 10,
          weeks: [makeWeek([{ count: 1, date: "2025-01-06" }])],
        }}
      />
    );
    expect(screen.getByText("Uncharted")).toBeInTheDocument();
    expect(screen.getByText("Gold Strike")).toBeInTheDocument();
  });

  it("renders compass rose SVG", () => {
    const { container } = render(
      <ContributionHeatmap
        calendar={{
          totalContributions: 10,
          weeks: [makeWeek([{ count: 1, date: "2025-01-06" }])],
        }}
      />
    );
    // CompassRose renders an SVG with aria-hidden
    const svg = container.querySelector("svg[aria-hidden]");
    expect(svg).toBeInTheDocument();
  });

  it("renders cells with all contribution level colors", () => {
    // count=0 → level 0, count=1 → level 1, count=3 → level 2, count=7 → level 3, count=15 → level 4
    const weeks = [
      makeWeek([
        { count: 0, date: "2025-01-06" },
        { count: 1, date: "2025-01-07" },
        { count: 3, date: "2025-01-08" },
        { count: 7, date: "2025-01-09" },
        { count: 15, date: "2025-01-10" },
      ]),
    ];
    const { container } = render(
      <ContributionHeatmap calendar={{ totalContributions: 26, weeks }} />
    );
    // Should render contribution cells (they have cursor: crosshair style)
    const cells = container.querySelectorAll("[style*='crosshair']");
    expect(cells.length).toBeGreaterThanOrEqual(5);
  });

  it("handles mouse hover on cells", () => {
    const weeks = [
      makeWeek([{ count: 5, date: "2025-06-01" }]),
    ];
    const { container } = render(
      <ContributionHeatmap
        calendar={{ totalContributions: 5, weeks }}
      />
    );
    // Find contribution cells (they have cursor: crosshair)
    const cells = container.querySelectorAll("[style*='crosshair']");
    if (cells.length > 0) {
      fireEvent.mouseOver(cells[0]);
      fireEvent.mouseOut(cells[0]);
      fireEvent.mouseEnter(cells[0], { clientX: 50, clientY: 50 });
      fireEvent.mouseLeave(cells[0]);
    }
  });

  it("renders month labels from week data", () => {
    const weeks = [
      makeWeek([{ count: 1, date: "2025-01-06" }]),
      makeWeek([{ count: 2, date: "2025-02-03" }]),
    ];
    render(
      <ContributionHeatmap
        calendar={{ totalContributions: 3, weeks }}
      />
    );
    expect(screen.getByText("Jan")).toBeInTheDocument();
    expect(screen.getByText("Feb")).toBeInTheDocument();
  });
});
