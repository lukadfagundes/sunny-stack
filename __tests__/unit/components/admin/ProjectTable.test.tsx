/**
 * Unit Tests for ProjectTable Component
 *
 * Tests cover: rendering, empty state, data formatting, sorting,
 * status colors, action links, and conditional delete button.
 */

import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProjectTable } from "@/components/admin/ProjectTable";

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

// Mock lucide-react icons as simple spans with data-testid
jest.mock("lucide-react", () => ({
  ArrowUpDown: (props: any) => (
    <span data-testid="icon-arrow-up-down" {...props} />
  ),
  Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
  Edit: (props: any) => <span data-testid="icon-edit" {...props} />,
  Trash2: (props: any) => <span data-testid="icon-trash" {...props} />,
}));

// -- Test Data Factories --

function createMockProject(overrides: Partial<any> = {}) {
  return {
    id: "proj-1",
    title: "Test Project",
    clientName: "Acme Corp",
    status: "PLANNING",
    budget: 5000,
    deadline: "2026-06-15T00:00:00.000Z",
    createdAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("ProjectTable", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -- Empty State --

  describe("Empty State", () => {
    test('should render "No projects found" when projects array is empty', () => {
      render(<ProjectTable projects={[]} />);

      expect(screen.getByText("No projects found")).toBeInTheDocument();
    });

    test("should render table headers even when empty", () => {
      render(<ProjectTable projects={[]} />);

      expect(screen.getByText("Title")).toBeInTheDocument();
      expect(screen.getByText("Client")).toBeInTheDocument();
      expect(screen.getByText("Status")).toBeInTheDocument();
      expect(screen.getByText("Budget")).toBeInTheDocument();
      expect(screen.getByText("Deadline")).toBeInTheDocument();
      expect(screen.getByText("Actions")).toBeInTheDocument();
    });
  });

  // -- Rendering Data --

  describe("Rendering Project Data", () => {
    test("should render project rows with correct data", () => {
      const projects = [
        createMockProject({
          id: "p1",
          title: "Alpha Project",
          clientName: "Client A",
        }),
        createMockProject({
          id: "p2",
          title: "Beta Project",
          clientName: "Client B",
        }),
      ];

      render(<ProjectTable projects={projects} />);

      expect(screen.getByText("Alpha Project")).toBeInTheDocument();
      expect(screen.getByText("Client A")).toBeInTheDocument();
      expect(screen.getByText("Beta Project")).toBeInTheDocument();
      expect(screen.getByText("Client B")).toBeInTheDocument();
    });

    test("should show _count info when present", () => {
      const project = createMockProject({
        _count: { quotes: 3, timeEntries: 7 },
      });

      render(<ProjectTable projects={[project]} />);

      expect(screen.getByText("3 quotes, 7 time entries")).toBeInTheDocument();
    });

    test("should not show _count info when absent", () => {
      const project = createMockProject();

      render(<ProjectTable projects={[project]} />);

      expect(screen.queryByText(/quotes,/)).not.toBeInTheDocument();
    });
  });

  // -- Budget Formatting --

  describe("Budget Formatting", () => {
    test("should format budget as dollar amount with two decimals", () => {
      const project = createMockProject({ budget: 5000 });

      render(<ProjectTable projects={[project]} />);

      expect(screen.getByText("$5,000.00")).toBeInTheDocument();
    });

    test('should show "-" when budget is null', () => {
      const project = createMockProject({ budget: null });

      render(<ProjectTable projects={[project]} />);

      // Find the cell that contains just "-" for budget
      const cells = screen.getAllByText("-");
      expect(cells.length).toBeGreaterThanOrEqual(1);
    });

    test("should format large budget values correctly", () => {
      const project = createMockProject({ budget: 125000.5 });

      render(<ProjectTable projects={[project]} />);

      expect(screen.getByText("$125,000.50")).toBeInTheDocument();
    });
  });

  // -- Deadline Formatting --

  describe("Deadline Formatting", () => {
    test("should format deadline as a localized date string", () => {
      const project = createMockProject({
        deadline: "2026-06-15T00:00:00.000Z",
      });

      render(<ProjectTable projects={[project]} />);

      // toLocaleDateString output varies by locale; just verify it is not "-"
      const deadlineDate = new Date(
        "2026-06-15T00:00:00.000Z",
      ).toLocaleDateString();
      expect(screen.getByText(deadlineDate)).toBeInTheDocument();
    });

    test('should show "-" when deadline is null', () => {
      const project = createMockProject({ deadline: null, budget: 5000 });

      render(<ProjectTable projects={[project]} />);

      const dashes = screen.getAllByText("-");
      expect(dashes.length).toBeGreaterThanOrEqual(1);
    });
  });

  // -- Status Badge Colors --

  describe("Status Badge", () => {
    test("should display status text with underscores replaced by spaces", () => {
      const project = createMockProject({ status: "IN_PROGRESS" });

      render(<ProjectTable projects={[project]} />);

      expect(screen.getByText("IN PROGRESS")).toBeInTheDocument();
    });

    test("should apply yellow classes for PLANNING status", () => {
      const project = createMockProject({ status: "PLANNING" });

      render(<ProjectTable projects={[project]} />);

      const badge = screen.getByText("PLANNING");
      expect(badge).toHaveClass("bg-yellow-100");
      expect(badge).toHaveClass("text-yellow-800");
    });

    test("should apply blue classes for IN_PROGRESS status", () => {
      const project = createMockProject({ status: "IN_PROGRESS" });

      render(<ProjectTable projects={[project]} />);

      const badge = screen.getByText("IN PROGRESS");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    test("should apply purple classes for REVIEW status", () => {
      const project = createMockProject({ status: "REVIEW" });

      render(<ProjectTable projects={[project]} />);

      const badge = screen.getByText("REVIEW");
      expect(badge).toHaveClass("bg-purple-100");
      expect(badge).toHaveClass("text-purple-800");
    });

    test("should apply green classes for COMPLETE status", () => {
      const project = createMockProject({ status: "COMPLETE" });

      render(<ProjectTable projects={[project]} />);

      const badge = screen.getByText("COMPLETE");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-800");
    });

    test("should apply gray classes for ARCHIVED status", () => {
      const project = createMockProject({ status: "ARCHIVED" });

      render(<ProjectTable projects={[project]} />);

      const badge = screen.getByText("ARCHIVED");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-800");
    });

    test("should apply default gray classes for unknown status", () => {
      const project = createMockProject({ status: "UNKNOWN_STATUS" });

      render(<ProjectTable projects={[project]} />);

      const badge = screen.getByText("UNKNOWN STATUS");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-800");
    });
  });

  // -- Sorting --

  describe("Sorting", () => {
    test("should toggle sort direction when clicking the same column header", () => {
      const projects = [
        createMockProject({ id: "p1", title: "Alpha" }),
        createMockProject({ id: "p2", title: "Beta" }),
      ];

      render(<ProjectTable projects={projects} />);

      const titleHeader = screen.getByText("Title").closest("th")!;

      // First click: sets sortField to title, direction desc (default for new field)
      fireEvent.click(titleHeader);

      let rows = screen.getAllByRole("row");
      // Row 0 is header, row 1 and 2 are data
      const firstClickFirst = rows[1].textContent;

      // Second click: toggles to asc
      fireEvent.click(titleHeader);

      rows = screen.getAllByRole("row");
      const secondClickFirst = rows[1].textContent;

      // The order should have reversed
      expect(firstClickFirst).not.toBe(secondClickFirst);
    });

    test("should reset sort direction to desc when clicking a different column header", () => {
      const projects = [
        createMockProject({ id: "p1", title: "Zebra", clientName: "Client A" }),
        createMockProject({ id: "p2", title: "Alpha", clientName: "Client Z" }),
      ];

      render(<ProjectTable projects={projects} />);

      // Click title header first (desc)
      const titleHeader = screen.getByText("Title").closest("th")!;
      fireEvent.click(titleHeader);

      // Click title again to toggle to asc
      fireEvent.click(titleHeader);

      // Now click client header - should reset to desc
      const clientHeader = screen.getByText("Client").closest("th")!;
      fireEvent.click(clientHeader);

      const rows = screen.getAllByRole("row");
      // desc sorting by clientName: Client Z should come first
      expect(rows[1]).toHaveTextContent("Client Z");
      expect(rows[2]).toHaveTextContent("Client A");
    });
  });

  // -- Action Links --

  describe("Action Links", () => {
    test("should render View link with correct href", () => {
      const project = createMockProject({ id: "proj-123" });

      render(<ProjectTable projects={[project]} />);

      const viewLink = screen.getByTitle("View details").closest("a");
      expect(viewLink).toHaveAttribute("href", "/admin/projects/proj-123");
    });

    test("should render Edit link with correct href", () => {
      const project = createMockProject({ id: "proj-456" });

      render(<ProjectTable projects={[project]} />);

      const editLink = screen.getByTitle("Edit project").closest("a");
      expect(editLink).toHaveAttribute("href", "/admin/projects/proj-456/edit");
    });
  });

  // -- Delete Button --

  describe("Delete Button", () => {
    test("should not render delete button when onDelete is not provided", () => {
      const project = createMockProject();

      render(<ProjectTable projects={[project]} />);

      expect(screen.queryByTitle("Delete project")).not.toBeInTheDocument();
    });

    test("should render delete button when onDelete is provided", () => {
      const project = createMockProject();
      const mockDelete = jest.fn();

      render(<ProjectTable projects={[project]} onDelete={mockDelete} />);

      expect(screen.getByTitle("Delete project")).toBeInTheDocument();
    });

    test("should call onDelete with the project id when delete button is clicked", () => {
      const project = createMockProject({ id: "proj-to-delete" });
      const mockDelete = jest.fn();

      render(<ProjectTable projects={[project]} onDelete={mockDelete} />);

      const deleteButton = screen.getByTitle("Delete project");
      fireEvent.click(deleteButton);

      expect(mockDelete).toHaveBeenCalledTimes(1);
      expect(mockDelete).toHaveBeenCalledWith("proj-to-delete");
    });
  });
});
