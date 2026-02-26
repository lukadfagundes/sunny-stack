/**
 * @file ProjectsListPage Unit Tests
 * @description Tests for the admin projects list page component
 *
 * Covers: loading state, data rendering, error handling, retry,
 * New Project link, empty state, handleDelete with confirm/cancel.
 */

import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";

// Override the global next/navigation mock from jest.setup.js
const mockPush = jest.fn();
jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    replace: jest.fn(),
    back: jest.fn(),
    prefetch: jest.fn(),
    reload: jest.fn(),
    pathname: "/admin/projects",
    query: {},
    asPath: "/admin/projects",
  }),
  useSearchParams: () => ({ get: jest.fn() }),
  usePathname: () => "/admin/projects",
}));

jest.mock("next/link", () => {
  return ({ children, href, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

jest.mock("@/components/admin/ProjectTable", () => ({
  ProjectTable: ({ projects, onDelete }: any) => (
    <div data-testid="project-table">
      {projects.map((p: any) => (
        <div key={p.id} data-testid={`project-${p.id}`}>
          <span>{p.title}</span>
          <button onClick={() => onDelete?.(p.id)}>delete-{p.id}</button>
        </div>
      ))}
    </div>
  ),
}));

jest.mock("@/components/admin/Skeletons", () => ({
  TableSkeleton: () => <div data-testid="table-skeleton" />,
}));

jest.mock("lucide-react", () => ({
  Plus: () => <span data-testid="plus-icon" />,
}));

import ProjectsListPage from "@/app/admin/projects/page";

// ---------------------------------------------------------------------------
// Test data
// ---------------------------------------------------------------------------

const mockProjects = [
  {
    id: "p1",
    title: "Client Portal",
    clientName: "Acme Inc",
    status: "ACTIVE",
    budget: 50000,
    deadline: "2026-06-01",
    createdAt: "2026-01-01",
  },
  {
    id: "p2",
    title: "Mobile App",
    clientName: "Beta Corp",
    status: "PLANNING",
    budget: 30000,
    deadline: "2026-09-01",
    createdAt: "2026-02-01",
  },
  {
    id: "p3",
    title: "Dashboard Redesign",
    clientName: "Gamma Ltd",
    status: "COMPLETE",
    budget: null,
    deadline: null,
    createdAt: "2026-01-15",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockFetchSuccess(data: any) {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    json: async () => data,
  });
}

function mockFetchFailure() {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: false,
    json: async () => ({ error: "Server error" }),
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("ProjectsListPage", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    mockPush.mockClear();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(window, "alert").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  it("shows table skeleton while loading", () => {
    // Fetch never resolves during this assertion
    (global.fetch as jest.Mock).mockReturnValue(new Promise(() => {}));

    render(<ProjectsListPage />);

    expect(screen.getByTestId("table-skeleton")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Successful data fetch
  // -----------------------------------------------------------------------

  it("renders projects after successful fetch", async () => {
    mockFetchSuccess({ projects: mockProjects });

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("project-table")).toBeInTheDocument();
    });

    expect(screen.getByTestId("project-p1")).toBeInTheDocument();
    expect(screen.getByTestId("project-p2")).toBeInTheDocument();
    expect(screen.getByTestId("project-p3")).toBeInTheDocument();
    expect(screen.getByText("Client Portal")).toBeInTheDocument();
    expect(screen.getByText("Mobile App")).toBeInTheDocument();
    expect(screen.getByText("Dashboard Redesign")).toBeInTheDocument();
  });

  // -----------------------------------------------------------------------
  // Error state
  // -----------------------------------------------------------------------

  it("shows error state on fetch failure", async () => {
    mockFetchFailure();

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText(/Error:/)).toBeInTheDocument();
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------------------
  // Retry
  // -----------------------------------------------------------------------

  it("retry button re-fetches projects", async () => {
    // First call fails
    mockFetchFailure();

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Retry")).toBeInTheDocument();
    });

    // Second call succeeds
    mockFetchSuccess({ projects: mockProjects });

    await act(async () => {
      fireEvent.click(screen.getByText("Retry"));
    });

    // Verify fetch was called a second time (retry triggered the re-fetch)
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });

    // Both calls should target the projects endpoint
    expect(global.fetch).toHaveBeenNthCalledWith(1, "/api/admin/projects");
    expect(global.fetch).toHaveBeenNthCalledWith(2, "/api/admin/projects");
  });

  // -----------------------------------------------------------------------
  // New Project link
  // -----------------------------------------------------------------------

  it("renders New Project link in the header", async () => {
    mockFetchSuccess({ projects: mockProjects });

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("project-table")).toBeInTheDocument();
    });

    const newProjectLink = screen.getByText("New Project");
    expect(newProjectLink.closest("a")).toHaveAttribute(
      "href",
      "/admin/projects/new",
    );
  });

  // -----------------------------------------------------------------------
  // Empty state
  // -----------------------------------------------------------------------

  it("shows empty state when no projects exist", async () => {
    mockFetchSuccess({ projects: [] });

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("No projects yet")).toBeInTheDocument();
    });

    // Empty state should have a link to create first project
    const createLink = screen.getByText("Create Your First Project");
    expect(createLink.closest("a")).toHaveAttribute(
      "href",
      "/admin/projects/new",
    );
  });

  // -----------------------------------------------------------------------
  // handleDelete (confirm accepted)
  // -----------------------------------------------------------------------

  it("deletes project from state when confirm is accepted", async () => {
    mockFetchSuccess({ projects: mockProjects });

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("project-p1")).toBeInTheDocument();
    });

    // Mock window.confirm to return true
    jest.spyOn(window, "confirm").mockReturnValueOnce(true);

    // Mock DELETE response
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });

    await act(async () => {
      fireEvent.click(screen.getByText("delete-p1"));
    });

    await waitFor(() => {
      expect(screen.queryByTestId("project-p1")).not.toBeInTheDocument();
    });

    // Other projects should still be visible
    expect(screen.getByTestId("project-p2")).toBeInTheDocument();
    expect(screen.getByTestId("project-p3")).toBeInTheDocument();

    // Verify DELETE was called
    expect(global.fetch).toHaveBeenCalledWith(
      "/api/admin/projects/p1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });

  // -----------------------------------------------------------------------
  // handleDelete (confirm cancelled)
  // -----------------------------------------------------------------------

  it("does not delete project when confirm is cancelled", async () => {
    mockFetchSuccess({ projects: mockProjects });

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByTestId("project-p1")).toBeInTheDocument();
    });

    // Mock window.confirm to return false
    jest.spyOn(window, "confirm").mockReturnValueOnce(false);

    await act(async () => {
      fireEvent.click(screen.getByText("delete-p1"));
    });

    // Project should still be in the DOM
    expect(screen.getByTestId("project-p1")).toBeInTheDocument();

    // Fetch should NOT have been called again (only the initial GET)
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });

  // -----------------------------------------------------------------------
  // Page heading
  // -----------------------------------------------------------------------

  it("renders page heading and description", async () => {
    mockFetchSuccess({ projects: [] });

    await act(async () => {
      render(<ProjectsListPage />);
    });

    await waitFor(() => {
      expect(screen.getByText("Projects")).toBeInTheDocument();
      expect(
        screen.getByText("Manage all your client projects"),
      ).toBeInTheDocument();
    });
  });
});
