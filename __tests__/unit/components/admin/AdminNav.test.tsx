/**
 * Unit Tests for AdminNav Component
 *
 * Tests navigation rendering, active state logic, sign out behavior,
 * and responsive mobile menu toggle functionality.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import AdminNav from "@/components/admin/AdminNav";

// Mock Next.js Link component
jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => {
    return (
      <a href={href} {...props}>
        {children}
      </a>
    );
  };
});

// Mock Next.js navigation hooks
const mockPush = jest.fn();
const mockUsePathname = jest.fn();

jest.mock("next/navigation", () => ({
  usePathname: () => mockUsePathname(),
  useRouter: () => ({ push: mockPush }),
}));

// Mock lucide-react icons as simple spans
jest.mock("lucide-react", () => ({
  LayoutDashboard: (props: any) => (
    <span data-testid="icon-layout-dashboard" {...props} />
  ),
  FolderKanban: (props: any) => (
    <span data-testid="icon-folder-kanban" {...props} />
  ),
  FileText: (props: any) => <span data-testid="icon-file-text" {...props} />,
  FileOutput: (props: any) => (
    <span data-testid="icon-file-output" {...props} />
  ),
  BarChart3: (props: any) => <span data-testid="icon-bar-chart-3" {...props} />,
  LogOut: (props: any) => <span data-testid="icon-log-out" {...props} />,
  Menu: (props: any) => <span data-testid="icon-menu" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
}));

describe("AdminNav", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePathname.mockReturnValue("/admin");
  });

  // -----------------------------------------------------------
  // Rendering
  // -----------------------------------------------------------

  describe("Rendering", () => {
    test("should render all five navigation items", () => {
      render(<AdminNav />);

      expect(screen.getByText("Dashboard")).toBeInTheDocument();
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(screen.getByText("Quotes")).toBeInTheDocument();
      expect(screen.getByText("Proposals")).toBeInTheDocument();
      expect(screen.getByText("Reports")).toBeInTheDocument();
    });

    test('should render "Sunny Stack" header and "Admin Dashboard" subtext', () => {
      render(<AdminNav />);

      expect(screen.getByText("Sunny Stack")).toBeInTheDocument();
      expect(screen.getByText("Admin Dashboard")).toBeInTheDocument();
    });

    test("should render Sign Out button", () => {
      render(<AdminNav />);

      expect(screen.getByText("Sign Out")).toBeInTheDocument();
    });

    test("should render navigation links with correct hrefs", () => {
      render(<AdminNav />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      const projectsLink = screen.getByText("Projects").closest("a");
      const quotesLink = screen.getByText("Quotes").closest("a");
      const proposalsLink = screen.getByText("Proposals").closest("a");
      const reportsLink = screen.getByText("Reports").closest("a");

      expect(dashboardLink).toHaveAttribute("href", "/admin");
      expect(projectsLink).toHaveAttribute("href", "/admin/projects");
      expect(quotesLink).toHaveAttribute("href", "/admin/quotes");
      expect(proposalsLink).toHaveAttribute("href", "/admin/proposals");
      expect(reportsLink).toHaveAttribute("href", "/admin/reports");
    });
  });

  // -----------------------------------------------------------
  // Active State Logic
  // -----------------------------------------------------------

  describe("Active State Logic", () => {
    test("should mark Dashboard as active only when pathname is exactly /admin", () => {
      mockUsePathname.mockReturnValue("/admin");
      render(<AdminNav />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink).toHaveAttribute("aria-current", "page");
    });

    test("should not mark Dashboard as active when pathname is /admin/projects", () => {
      mockUsePathname.mockReturnValue("/admin/projects");
      render(<AdminNav />);

      const dashboardLink = screen.getByText("Dashboard").closest("a");
      expect(dashboardLink).not.toHaveAttribute("aria-current", "page");
    });

    test("should mark Projects as active when pathname starts with /admin/projects", () => {
      mockUsePathname.mockReturnValue("/admin/projects/123");
      render(<AdminNav />);

      const projectsLink = screen.getByText("Projects").closest("a");
      expect(projectsLink).toHaveAttribute("aria-current", "page");
    });

    test("should mark Quotes as active when pathname starts with /admin/quotes", () => {
      mockUsePathname.mockReturnValue("/admin/quotes");
      render(<AdminNav />);

      const quotesLink = screen.getByText("Quotes").closest("a");
      expect(quotesLink).toHaveAttribute("aria-current", "page");
    });
  });

  // -----------------------------------------------------------
  // Sign Out
  // -----------------------------------------------------------

  describe("Sign Out", () => {
    test("should call router.push with /api/auth/signout when Sign Out is clicked", () => {
      render(<AdminNav />);

      fireEvent.click(screen.getByText("Sign Out"));

      expect(mockPush).toHaveBeenCalledTimes(1);
      expect(mockPush).toHaveBeenCalledWith("/api/auth/signout");
    });
  });

  // -----------------------------------------------------------
  // Mobile Menu
  // -----------------------------------------------------------

  describe("Mobile Menu", () => {
    test("should toggle mobile menu when toggle button is clicked", () => {
      const { container } = render(<AdminNav />);

      // Menu overlay should not be present initially
      // The overlay is a div with bg-black class that only renders when isMobileMenuOpen is true
      const getOverlay = () =>
        container.querySelector(".bg-black.bg-opacity-50");
      expect(getOverlay()).not.toBeInTheDocument();

      // Click the toggle button to open
      fireEvent.click(screen.getByLabelText("Toggle menu"));

      // Overlay should now be visible
      expect(getOverlay()).toBeInTheDocument();

      // Click the toggle button again to close
      fireEvent.click(screen.getByLabelText("Toggle menu"));

      // Overlay should be removed
      expect(getOverlay()).not.toBeInTheDocument();
    });

    test("should close mobile menu when overlay is clicked", () => {
      const { container } = render(<AdminNav />);

      // Open the menu
      fireEvent.click(screen.getByLabelText("Toggle menu"));

      const overlay = container.querySelector(".bg-black.bg-opacity-50");
      expect(overlay).toBeInTheDocument();

      // Click overlay to close
      fireEvent.click(overlay!);

      // Overlay should be removed
      expect(
        container.querySelector(".bg-black.bg-opacity-50"),
      ).not.toBeInTheDocument();
    });
  });
});
