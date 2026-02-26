/**
 * Unit Tests for ProjectForm Component
 *
 * Tests cover: rendering, default/custom labels, initialData population,
 * field validation (required + format), error clearing, submit flow,
 * loading state, and error handling.
 */

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ProjectForm } from "@/components/admin/ProjectForm";

// Mock lucide-react icons as simple spans with data-testid
jest.mock("lucide-react", () => ({
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

describe("ProjectForm", () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockReset();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -- Rendering --

  describe("Rendering", () => {
    test("should render all form fields", () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Title/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Name/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Client Email/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Status/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Budget/)).toBeInTheDocument();
      expect(screen.getByLabelText(/Deadline/)).toBeInTheDocument();
    });

    test('should show default submit label "Create Project"', () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      expect(
        screen.getByRole("button", { name: /Create Project/ }),
      ).toBeInTheDocument();
    });

    test("should show custom submit label when provided", () => {
      render(
        <ProjectForm onSubmit={mockOnSubmit} submitLabel="Update Project" />,
      );

      expect(
        screen.getByRole("button", { name: /Update Project/ }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /Create Project/ }),
      ).not.toBeInTheDocument();
    });

    test("should show required field indicator text", () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      expect(screen.getByText("* Required fields")).toBeInTheDocument();
    });
  });

  // -- Initial Data --

  describe("Initial Data", () => {
    test("should populate form fields with initialData values", () => {
      const initialData = {
        title: "My Project",
        clientName: "Acme Corp",
        clientEmail: "contact@acme.com",
        description: "A project description",
        status: "IN_PROGRESS",
        budget: "15000",
        deadline: "2026-12-31",
      };

      render(<ProjectForm onSubmit={mockOnSubmit} initialData={initialData} />);

      expect(screen.getByLabelText(/Title/)).toHaveValue("My Project");
      expect(screen.getByLabelText(/Client Name/)).toHaveValue("Acme Corp");
      expect(screen.getByLabelText(/Client Email/)).toHaveValue(
        "contact@acme.com",
      );
      expect(screen.getByLabelText(/Description/)).toHaveValue(
        "A project description",
      );
      expect(screen.getByLabelText(/Status/)).toHaveValue("IN_PROGRESS");
      expect(screen.getByLabelText(/Budget/)).toHaveValue(15000);
      expect(screen.getByLabelText(/Deadline/)).toHaveValue("2026-12-31");
    });

    test("should default status to PLANNING when no initialData is provided", () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Status/)).toHaveValue("PLANNING");
    });

    test("should default empty fields when initialData is partial", () => {
      render(
        <ProjectForm
          onSubmit={mockOnSubmit}
          initialData={{ title: "Partial" }}
        />,
      );

      expect(screen.getByLabelText(/Title/)).toHaveValue("Partial");
      expect(screen.getByLabelText(/Client Name/)).toHaveValue("");
      expect(screen.getByLabelText(/Client Email/)).toHaveValue("");
    });
  });

  // -- Validation: Required Fields --

  describe("Validation - Required Fields", () => {
    test("should show error when title is empty on submit", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("should show error when client name is empty on submit", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      // Fill title but leave clientName empty
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Project" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(screen.getByText("Client name is required")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("should show error when client email is empty on submit", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      // Fill title and clientName but leave email empty
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Project" },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/), {
        target: { value: "Client" },
      });
      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(
          screen.getByText("Client email is required"),
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // -- Validation: Format --

  describe("Validation - Format", () => {
    test("should show error for invalid email format", async () => {
      // Use initialData to set values directly, bypassing fireEvent.change state propagation issues
      const { container } = render(
        <ProjectForm
          onSubmit={mockOnSubmit}
          initialData={{
            title: "Project",
            clientName: "Client",
            clientEmail: "not-an-email",
          }}
        />,
      );

      // Use fireEvent.submit to bypass HTML5 native email validation in jsdom
      fireEvent.submit(container.querySelector("form")!);

      await waitFor(() => {
        expect(screen.getByText("Invalid email format")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("should show error when budget is not a valid number", async () => {
      // Use initialData to set budget to non-numeric string (type="number" inputs
      // sanitize non-numeric values in jsdom, so we must set via initialData)
      render(
        <ProjectForm
          onSubmit={mockOnSubmit}
          initialData={{
            title: "Project",
            clientName: "Client",
            clientEmail: "client@example.com",
            budget: "abc",
          }}
        />,
      );

      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(
          screen.getByText("Budget must be a valid number"),
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("should not show budget error when budget is empty", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Project" },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/), {
        target: { value: "Client" },
      });
      fireEvent.change(screen.getByLabelText(/Client Email/), {
        target: { value: "client@example.com" },
      });
      // Leave budget empty - should be valid
      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalled();
      });
      expect(
        screen.queryByText("Budget must be a valid number"),
      ).not.toBeInTheDocument();
    });
  });

  // -- Error Clearing --

  describe("Error Clearing", () => {
    test("should clear field error when user types in the field", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      // Trigger validation errors
      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
      });

      // Type in the title field to clear its error
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "New Title" },
      });

      expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    });
  });

  // -- Successful Submit --

  describe("Successful Submission", () => {
    test("should call onSubmit with form data when all fields are valid", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      // Fill in all required fields
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "New Project" },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/), {
        target: { value: "Acme Corp" },
      });
      fireEvent.change(screen.getByLabelText(/Client Email/), {
        target: { value: "acme@example.com" },
      });
      fireEvent.change(screen.getByLabelText(/Description/), {
        target: { value: "Project description here" },
      });
      fireEvent.change(screen.getByLabelText(/Budget/), {
        target: { value: "10000" },
      });
      fireEvent.change(screen.getByLabelText(/Deadline/), {
        target: { value: "2026-12-01" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith({
          title: "New Project",
          clientName: "Acme Corp",
          clientEmail: "acme@example.com",
          description: "Project description here",
          status: "PLANNING",
          budget: "10000",
          deadline: "2026-12-01",
        });
      });
    });
  });

  // -- Loading State --

  describe("Loading State", () => {
    test("should show loading spinner during submission", async () => {
      // Create a promise that we control to keep the form in loading state
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const slowSubmit = jest.fn().mockReturnValue(submitPromise);

      render(<ProjectForm onSubmit={slowSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Project" },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/), {
        target: { value: "Client" },
      });
      fireEvent.change(screen.getByLabelText(/Client Email/), {
        target: { value: "client@example.com" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      // While submitting, the loader icon should appear
      await waitFor(() => {
        expect(screen.getByTestId("icon-loader")).toBeInTheDocument();
      });

      // The submit button should be disabled during loading
      expect(
        screen.getByRole("button", { name: /Create Project/ }),
      ).toBeDisabled();

      // Resolve the submission
      resolveSubmit!();

      // After resolution, loader should disappear
      await waitFor(() => {
        expect(screen.queryByTestId("icon-loader")).not.toBeInTheDocument();
      });
    });

    test("should disable form inputs during loading", async () => {
      let resolveSubmit: () => void;
      const submitPromise = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      const slowSubmit = jest.fn().mockReturnValue(submitPromise);

      render(<ProjectForm onSubmit={slowSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Project" },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/), {
        target: { value: "Client" },
      });
      fireEvent.change(screen.getByLabelText(/Client Email/), {
        target: { value: "client@example.com" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).toBeDisabled();
        expect(screen.getByLabelText(/Client Name/)).toBeDisabled();
        expect(screen.getByLabelText(/Client Email/)).toBeDisabled();
        expect(screen.getByLabelText(/Description/)).toBeDisabled();
        expect(screen.getByLabelText(/Status/)).toBeDisabled();
        expect(screen.getByLabelText(/Budget/)).toBeDisabled();
        expect(screen.getByLabelText(/Deadline/)).toBeDisabled();
      });

      // Resolve to clean up
      resolveSubmit!();
      await waitFor(() => {
        expect(screen.getByLabelText(/Title/)).not.toBeDisabled();
      });
    });
  });

  // -- Error Handling --

  describe("Error Handling", () => {
    test("should handle submit error gracefully and re-enable form", async () => {
      const consoleSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const failingSubmit = jest
        .fn()
        .mockRejectedValue(new Error("Server error"));

      render(<ProjectForm onSubmit={failingSubmit} />);

      // Fill required fields
      fireEvent.change(screen.getByLabelText(/Title/), {
        target: { value: "Project" },
      });
      fireEvent.change(screen.getByLabelText(/Client Name/), {
        target: { value: "Client" },
      });
      fireEvent.change(screen.getByLabelText(/Client Email/), {
        target: { value: "client@example.com" },
      });

      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      // Wait for the error to be handled and loading to finish
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Create Project/ }),
        ).not.toBeDisabled();
      });

      // The form should not crash - loader should be gone
      expect(screen.queryByTestId("icon-loader")).not.toBeInTheDocument();

      // The error was logged to console
      expect(consoleSpy).toHaveBeenCalledWith(
        "Form submission error:",
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  // -- Multiple Validation Errors --

  describe("Multiple Validation Errors", () => {
    test("should show all validation errors at once when multiple fields are invalid", async () => {
      render(<ProjectForm onSubmit={mockOnSubmit} />);

      // Submit without filling anything
      fireEvent.click(screen.getByRole("button", { name: /Create Project/ }));

      await waitFor(() => {
        expect(screen.getByText("Title is required")).toBeInTheDocument();
        expect(screen.getByText("Client name is required")).toBeInTheDocument();
        expect(
          screen.getByText("Client email is required"),
        ).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });
});
