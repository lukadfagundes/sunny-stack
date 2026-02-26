import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProjectModal, ProjectData } from "@/components/portfolio/ProjectModal";

// Mock lucide-react icons as simple spans
jest.mock("lucide-react", () => ({
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Zap: (props: any) => <span data-testid="icon-zap" {...props} />,
  Users: (props: any) => <span data-testid="icon-users" {...props} />,
  ExternalLink: (props: any) => (
    <span data-testid="icon-external-link" {...props} />
  ),
  Github: (props: any) => <span data-testid="icon-github" {...props} />,
}));

/**
 * Creates a minimal ProjectData fixture for tests.
 * Only id, icon, title, and description are required.
 */
function createProjectData(overrides: Partial<ProjectData> = {}): ProjectData {
  return {
    id: "test-project-1",
    icon: <span data-testid="project-icon">Icon</span>,
    title: "Test Project",
    description: "A test project description.",
    ...overrides,
  };
}

describe("ProjectModal", () => {
  const defaultOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset body overflow style between tests
    document.body.style.overflow = "unset";
  });

  describe("Visibility", () => {
    it("returns null when isOpen is false", () => {
      const project = createProjectData();
      const { container } = render(
        <ProjectModal
          project={project}
          isOpen={false}
          onClose={defaultOnClose}
        />,
      );
      expect(container.innerHTML).toBe("");
    });

    it("returns null when project is null", () => {
      const { container } = render(
        <ProjectModal project={null} isOpen={true} onClose={defaultOnClose} />,
      );
      expect(container.innerHTML).toBe("");
    });

    it("returns null when both isOpen is false and project is null", () => {
      const { container } = render(
        <ProjectModal project={null} isOpen={false} onClose={defaultOnClose} />,
      );
      expect(container.innerHTML).toBe("");
    });

    it("renders modal content when isOpen is true and project is provided", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByText("Test Project")).toBeInTheDocument();
    });
  });

  describe("Header Content", () => {
    it("displays the project title", () => {
      const project = createProjectData({ title: "My Portfolio App" });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByText("My Portfolio App")).toBeInTheDocument();
    });

    it("displays the project description", () => {
      const project = createProjectData({
        description: "An amazing portfolio application.",
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(
        screen.getByText("An amazing portfolio application."),
      ).toBeInTheDocument();
    });

    it("displays the project icon", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByTestId("project-icon")).toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    it("renders a close button with aria-label", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      const closeButton = screen.getByLabelText("Close modal");
      expect(closeButton).toBeInTheDocument();
    });

    it("calls onClose when the close button is clicked", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      const closeButton = screen.getByLabelText("Close modal");
      fireEvent.click(closeButton);
      expect(defaultOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the backdrop is clicked", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      // The backdrop has aria-hidden="true"
      const backdrop = document.querySelector('[aria-hidden="true"]')!;
      fireEvent.click(backdrop);
      expect(defaultOnClose).toHaveBeenCalledTimes(1);
    });

    it("calls onClose when the Escape key is pressed", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      fireEvent.keyDown(document, { key: "Escape" });
      expect(defaultOnClose).toHaveBeenCalledTimes(1);
    });

    it("does not call onClose for non-Escape key presses", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      fireEvent.keyDown(document, { key: "Enter" });
      expect(defaultOnClose).not.toHaveBeenCalled();
    });
  });

  describe("Body Overflow", () => {
    it("sets body overflow to hidden when modal is open", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(document.body.style.overflow).toBe("hidden");
    });

    it("resets body overflow to unset on unmount", () => {
      const project = createProjectData();
      const { unmount } = render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(document.body.style.overflow).toBe("hidden");
      unmount();
      expect(document.body.style.overflow).toBe("unset");
    });
  });

  describe("Key Features Section", () => {
    it("renders key features when provided", () => {
      const project = createProjectData({
        keyFeatures: {
          title: "Core Features",
          items: [
            { label: "Authentication", description: "Google OAuth login" },
            { label: "Dashboard", description: "Real-time analytics" },
          ],
        },
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByText("Core Features")).toBeInTheDocument();
      expect(screen.getByText(/Authentication/)).toBeInTheDocument();
      expect(screen.getByText(/Google OAuth login/)).toBeInTheDocument();
      expect(screen.getByText(/Dashboard/)).toBeInTheDocument();
      expect(screen.getByText(/Real-time analytics/)).toBeInTheDocument();
    });

    it("does not render key features section when not provided", () => {
      const project = createProjectData({ keyFeatures: undefined });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.queryByTestId("icon-zap")).not.toBeInTheDocument();
    });
  });

  describe("Call to Action Section", () => {
    it("renders call to action when provided", () => {
      const project = createProjectData({
        callToAction: {
          title: "Get Involved",
          description: "Contribute to this project.",
          techStack: ["React", "TypeScript", "Prisma"],
          links: [
            { label: "View on GitHub", url: "https://github.com/test" },
            { label: "Live Demo", url: "https://demo.example.com" },
          ],
        },
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByText("Get Involved")).toBeInTheDocument();
      expect(
        screen.getByText("Contribute to this project."),
      ).toBeInTheDocument();
      expect(screen.getByText("React")).toBeInTheDocument();
      expect(screen.getByText("TypeScript")).toBeInTheDocument();
      expect(screen.getByText("Prisma")).toBeInTheDocument();
      expect(screen.getByText("View on GitHub")).toBeInTheDocument();
      expect(screen.getByText("Live Demo")).toBeInTheDocument();
    });

    it("renders call to action links with correct href and target attributes", () => {
      const project = createProjectData({
        callToAction: {
          title: "Links",
          description: "Check out the project.",
          techStack: [],
          links: [
            { label: "GitHub Repo", url: "https://github.com/test/repo" },
          ],
        },
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      const link = screen.getByText("GitHub Repo").closest("a")!;
      expect(link).toHaveAttribute("href", "https://github.com/test/repo");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not render call to action section when not provided", () => {
      const project = createProjectData({ callToAction: undefined });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.queryByTestId("icon-users")).not.toBeInTheDocument();
    });
  });

  describe("Tech Stack (Standalone)", () => {
    it("renders standalone tech stack when provided and no callToAction exists", () => {
      const project = createProjectData({
        techStack: ["Next.js", "PostgreSQL", "Tailwind CSS"],
        callToAction: undefined,
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByText("Tech Stack")).toBeInTheDocument();
      expect(screen.getByText("Next.js")).toBeInTheDocument();
      expect(screen.getByText("PostgreSQL")).toBeInTheDocument();
      expect(screen.getByText("Tailwind CSS")).toBeInTheDocument();
    });

    it("does not render standalone tech stack when callToAction is present", () => {
      const project = createProjectData({
        techStack: ["Next.js", "PostgreSQL"],
        callToAction: {
          title: "CTA",
          description: "Do something.",
          techStack: ["React"],
          links: [],
        },
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      // The standalone "Tech Stack" heading should not appear
      expect(screen.queryByText("Tech Stack")).not.toBeInTheDocument();
      // But CTA tech badges do render
      expect(screen.getByText("React")).toBeInTheDocument();
    });

    it("does not render standalone tech stack section when techStack is not provided", () => {
      const project = createProjectData({ techStack: undefined });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.queryByText("Tech Stack")).not.toBeInTheDocument();
    });
  });

  describe("External Links (Standalone)", () => {
    it("renders standalone external links when provided and no callToAction exists", () => {
      const project = createProjectData({
        externalLinks: [
          { label: "Documentation", url: "https://docs.example.com" },
          { label: "Source Code", url: "https://github.com/example" },
        ],
        callToAction: undefined,
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.getByText("Links")).toBeInTheDocument();
      expect(screen.getByText("Documentation")).toBeInTheDocument();
      expect(screen.getByText("Source Code")).toBeInTheDocument();
    });

    it("renders standalone external links with correct attributes", () => {
      const project = createProjectData({
        externalLinks: [{ label: "Docs", url: "https://docs.example.com" }],
        callToAction: undefined,
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      const link = screen.getByText("Docs").closest("a")!;
      expect(link).toHaveAttribute("href", "https://docs.example.com");
      expect(link).toHaveAttribute("target", "_blank");
      expect(link).toHaveAttribute("rel", "noopener noreferrer");
    });

    it("does not render standalone external links when callToAction is present", () => {
      const project = createProjectData({
        externalLinks: [
          { label: "Documentation", url: "https://docs.example.com" },
        ],
        callToAction: {
          title: "CTA",
          description: "Do something.",
          techStack: [],
          links: [{ label: "CTA Link", url: "https://cta.example.com" }],
        },
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.queryByText("Links")).not.toBeInTheDocument();
      expect(screen.queryByText("Documentation")).not.toBeInTheDocument();
    });

    it("does not render standalone external links section when not provided", () => {
      const project = createProjectData({ externalLinks: undefined });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(screen.queryByText("Links")).not.toBeInTheDocument();
    });
  });

  describe("Footer", () => {
    it("renders footer text when provided", () => {
      const project = createProjectData({
        footer: "Built with love and TypeScript.",
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      expect(
        screen.getByText("Built with love and TypeScript."),
      ).toBeInTheDocument();
    });

    it("does not render footer section when not provided", () => {
      const project = createProjectData({ footer: undefined });
      const { container } = render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      // Footer renders inside a div with border-t class. Without a footer, there should be none.
      const footerDivs = container.querySelectorAll(".border-t");
      expect(footerDivs.length).toBe(0);
    });

    it("renders footer with HTML content via dangerouslySetInnerHTML", () => {
      const project = createProjectData({
        footer: "Check <strong>this</strong> out",
      });
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      const footerElement = screen.getByText(/Check/);
      expect(footerElement.innerHTML).toContain("<strong>this</strong>");
    });
  });

  describe("Click Propagation", () => {
    it("does not call onClose when clicking inside the modal content", () => {
      const project = createProjectData();
      render(
        <ProjectModal
          project={project}
          isOpen={true}
          onClose={defaultOnClose}
        />,
      );
      // Click on the project title (inside the modal)
      fireEvent.click(screen.getByText("Test Project"));
      expect(defaultOnClose).not.toHaveBeenCalled();
    });
  });
});
