import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import CurrentlyBuilding from "@/components/landing/CurrentlyBuilding";
import type { GitHubRepo } from "@/lib/github";

function makeRepo(overrides: Partial<GitHubRepo> = {}): GitHubRepo {
  return {
    name: "test-repo",
    description: "A test repo",
    url: "https://github.com/test/test-repo",
    pushedAt: new Date().toISOString(),
    stargazerCount: 5,
    forkCount: 1,
    primaryLanguage: { name: "TypeScript", color: "#3178C6" },
    languages: { edges: [] },
    ...overrides,
  };
}

describe("CurrentlyBuilding", () => {
  it("shows empty state when repos array is empty", () => {
    render(<CurrentlyBuilding repos={[]} />);
    expect(screen.getByText("Through the Spyglass")).toBeInTheDocument();
    expect(
      screen.getByText("Nothing sighted on the horizon")
    ).toBeInTheDocument();
  });

  it("renders the heading", () => {
    render(<CurrentlyBuilding repos={[makeRepo()]} />);
    expect(screen.getByText("Through the Spyglass")).toBeInTheDocument();
  });

  it("renders up to 3 repos", () => {
    const repos = [
      makeRepo({ name: "repo-1" }),
      makeRepo({ name: "repo-2" }),
      makeRepo({ name: "repo-3" }),
      makeRepo({ name: "repo-4" }),
    ];
    render(<CurrentlyBuilding repos={repos} />);
    expect(screen.getByText("repo-1")).toBeInTheDocument();
    expect(screen.getByText("repo-2")).toBeInTheDocument();
    expect(screen.getByText("repo-3")).toBeInTheDocument();
    expect(screen.queryByText("repo-4")).not.toBeInTheDocument();
  });

  it("renders repo links with correct href", () => {
    render(
      <CurrentlyBuilding
        repos={[makeRepo({ name: "my-repo", url: "https://github.com/test/my-repo" })]}
      />
    );
    const link = screen.getByText("my-repo").closest("a");
    expect(link).toHaveAttribute("href", "https://github.com/test/my-repo");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("displays relative time for recent pushes", () => {
    const now = Date.now();
    render(
      <CurrentlyBuilding
        repos={[makeRepo({ pushedAt: new Date(now - 30 * 1000).toISOString() })]}
      />
    );
    expect(screen.getByText("just now")).toBeInTheDocument();
  });

  it("displays minutes ago", () => {
    const now = Date.now();
    render(
      <CurrentlyBuilding
        repos={[makeRepo({ pushedAt: new Date(now - 5 * 60 * 1000).toISOString() })]}
      />
    );
    expect(screen.getByText("5m ago")).toBeInTheDocument();
  });

  it("displays hours ago", () => {
    const now = Date.now();
    render(
      <CurrentlyBuilding
        repos={[makeRepo({ pushedAt: new Date(now - 3 * 60 * 60 * 1000).toISOString() })]}
      />
    );
    expect(screen.getByText("3h ago")).toBeInTheDocument();
  });

  it("displays days ago", () => {
    const now = Date.now();
    render(
      <CurrentlyBuilding
        repos={[makeRepo({ pushedAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString() })]}
      />
    );
    expect(screen.getByText("2d ago")).toBeInTheDocument();
  });

  it("displays weeks ago", () => {
    const now = Date.now();
    render(
      <CurrentlyBuilding
        repos={[makeRepo({ pushedAt: new Date(now - 14 * 24 * 60 * 60 * 1000).toISOString() })]}
      />
    );
    expect(screen.getByText("2w ago")).toBeInTheDocument();
  });

  it("handles hover on spyglass container", () => {
    const { container } = render(
      <CurrentlyBuilding repos={[makeRepo()]} />
    );
    // Spyglass frame uses responsive Tailwind classes (w-[260px] sm:w-[340px])
    const spyglass = container.querySelector(".rounded-full");
    if (spyglass) {
      fireEvent.mouseEnter(spyglass.parentElement!);
      fireEvent.mouseLeave(spyglass.parentElement!);
    }
  });
});
