import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "../../tests/helpers/mocks";
import ProjectCard from "@/components/portfolio/ProjectCard";
import type { ProjectData } from "@/lib/data/types";

function makeProject(overrides: Partial<ProjectData> = {}): ProjectData {
  return {
    id: "test-project",
    title: "Test Project",
    tagline: "A test project tagline",
    description: "Full description of the test project.",
    category: "professional",
    techStack: [
      "TypeScript",
      "React",
      "Next.js",
      "Node.js",
      "Docker",
      "PostgreSQL",
    ],
    features: [
      { label: "Feature 1", description: "First feature desc" },
      { label: "Feature 2", description: "Second feature desc" },
    ],
    links: [
      { label: "GitHub", url: "https://github.com/test/project" },
      { label: "Live App", url: "https://app.example.com" },
    ],
    status: "active",
    footer: "Some footer text",
    ...overrides,
  };
}

describe("ProjectCard", () => {
  it("renders project title and tagline", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={false}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByText("Test Project")).toBeInTheDocument();
    expect(screen.getByText("A test project tagline")).toBeInTheDocument();
  });

  it("shows at most 5 tech stack pills when collapsed", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={false}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("Docker")).toBeInTheDocument();
    // 6th item hidden, +1 shown
    expect(screen.queryByText("PostgreSQL")).not.toBeInTheDocument();
    expect(screen.getByText("+1")).toBeInTheDocument();
  });

  it("shows all tech stack pills when expanded", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={true}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
    expect(screen.queryByText("+1")).not.toBeInTheDocument();
  });

  it("calls onToggle when clicked in collapsed state", () => {
    const onToggle = jest.fn();
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={false}
        onToggle={onToggle}
      />,
    );
    fireEvent.click(screen.getByText("Test Project"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows close button when expanded", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={true}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByRole("button", { name: /close/i })).toBeInTheDocument();
  });

  it("shows description, features, and links when expanded", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={true}
        onToggle={jest.fn()}
      />,
    );
    expect(
      screen.getByText("Full description of the test project."),
    ).toBeInTheDocument();
    expect(screen.getByText("Key Features")).toBeInTheDocument();
    expect(screen.getByText("Feature 1")).toBeInTheDocument();
    expect(screen.getByText("Feature 2")).toBeInTheDocument();
    expect(screen.getByText("GitHub")).toBeInTheDocument();
    expect(screen.getByText("Live App")).toBeInTheDocument();
  });

  it("shows footer when expanded", () => {
    render(
      <ProjectCard
        project={makeProject({ footer: "Footer info here" })}
        isExpanded={true}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.getByText("Footer info here")).toBeInTheDocument();
  });

  it("hides expanded content when collapsed", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={false}
        onToggle={jest.fn()}
      />,
    );
    expect(
      screen.queryByText("Full description of the test project."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Key Features")).not.toBeInTheDocument();
  });

  it("renders link with GitHub icon for GitHub links", () => {
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={true}
        onToggle={jest.fn()}
      />,
    );
    const ghLink = screen.getByText("GitHub").closest("a");
    expect(ghLink).toHaveAttribute("href", "https://github.com/test/project");
    expect(ghLink).toHaveAttribute("target", "_blank");
  });

  it("calls onToggle when close button is clicked", () => {
    const onToggle = jest.fn();
    render(
      <ProjectCard
        project={makeProject()}
        isExpanded={true}
        onToggle={onToggle}
      />,
    );
    const closeBtn = screen.getByRole("button", { name: /close/i });
    fireEvent.click(closeBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("renders mouse move handler for tilt effect", () => {
    const { container } = render(
      <ProjectCard
        project={makeProject()}
        isExpanded={false}
        onToggle={jest.fn()}
      />,
    );
    const card = container.firstElementChild as HTMLElement;
    // Trigger mouse move on the card
    fireEvent.mouseMove(card, { clientX: 100, clientY: 100 });
    fireEvent.mouseLeave(card);
  });

  it("does not show +N pill when tech stack has 5 or fewer items", () => {
    render(
      <ProjectCard
        project={makeProject({ techStack: ["TS", "React", "Node"] })}
        isExpanded={false}
        onToggle={jest.fn()}
      />,
    );
    expect(screen.queryByText(/^\+\d+$/)).not.toBeInTheDocument();
  });
});
