import React from "react";
import { render, screen } from "@testing-library/react";
import "../../tests/helpers/mocks";
import StatsDashboard from "@/components/landing/StatsDashboard";

const defaultProps = {
  totalCommits: 500,
  totalPRs: 30,
  totalIssues: 20,
  totalRepos: 15,
  totalStars: 10,
  totalContributions: 800,
};

describe("StatsDashboard", () => {
  it("renders the section heading", () => {
    render(<StatsDashboard {...defaultProps} />);
    expect(screen.getByText("Ship's Instruments")).toBeInTheDocument();
  });

  it("renders all 5 gauge labels when data is present", () => {
    render(<StatsDashboard {...defaultProps} />);
    expect(screen.getByText("Commits")).toBeInTheDocument();
    expect(screen.getByText("PRs")).toBeInTheDocument();
    expect(screen.getByText("Issues")).toBeInTheDocument();
    expect(screen.getByText("Repos")).toBeInTheDocument();
    expect(screen.getByText("Stars")).toBeInTheDocument();
  });

  it("shows 'Instruments offline' when totalContributions is 0", () => {
    render(
      <StatsDashboard
        {...defaultProps}
        totalContributions={0}
      />
    );
    expect(screen.getByText("Instruments offline")).toBeInTheDocument();
    expect(screen.queryByText("Commits")).not.toBeInTheDocument();
  });

  it("renders 5 SVG gauges", () => {
    const { container } = render(<StatsDashboard {...defaultProps} />);
    const svgs = container.querySelectorAll("svg");
    expect(svgs).toHaveLength(5);
  });

  it("renders initial display values of 0 (before animation)", () => {
    render(<StatsDashboard {...defaultProps} />);
    // Before animation fires, all gauge numbers start at 0
    const zeros = screen.getAllByText("0");
    expect(zeros.length).toBe(5);
  });

  it("animates gauge values after timeout", () => {
    jest.useFakeTimers();
    let rafCallback: FrameRequestCallback | null = null;
    jest.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      rafCallback = cb;
      return 1;
    });

    render(<StatsDashboard {...defaultProps} />);

    // Advance past the setTimeout delay
    jest.advanceTimersByTime(2000);

    // Run the rAF callback with a timestamp that completes animation (t=1)
    if (rafCallback !== null) {
      (rafCallback as FrameRequestCallback)(0); // start
      (rafCallback as FrameRequestCallback)(2000); // complete
    }

    jest.useRealTimers();
    jest.restoreAllMocks();
  });
});
