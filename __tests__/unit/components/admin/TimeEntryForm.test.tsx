// __tests__/unit/components/admin/TimeEntryForm.test.tsx

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { TimeEntryForm } from "@/components/admin/TimeEntryForm";

// Mock lucide-react Loader2 icon
jest.mock("lucide-react", () => ({
  Loader2: (props: any) => <span data-testid="loader-icon" {...props} />,
}));

describe("TimeEntryForm", () => {
  const mockOnSubmit = jest.fn();
  const mockOnCancel = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockOnSubmit.mockResolvedValue(undefined);
  });

  // -------------------------------------------------------
  // Rendering
  // -------------------------------------------------------

  describe("Rendering", () => {
    test("renders all form fields when no projectId prop is provided", () => {
      render(<TimeEntryForm onSubmit={mockOnSubmit} />);

      expect(screen.getByLabelText(/Project ID/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Description/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Start Time/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/End Time/i)).toBeInTheDocument();
      expect(
        screen.getByLabelText(/Duration \(minutes\)/i),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /Log Time/i }),
      ).toBeInTheDocument();
    });

    test("hides projectId field when projectId prop is given", () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      expect(screen.queryByLabelText(/Project ID/i)).not.toBeInTheDocument();
    });

    test("sets initial projectId from prop", async () => {
      render(<TimeEntryForm projectId="proj-456" onSubmit={mockOnSubmit} />);

      // Fill required fields and submit to verify projectId is included
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Test work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "60" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({ projectId: "proj-456" }),
        );
      });
    });

    test("shows cancel button when onCancel is provided", () => {
      render(<TimeEntryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      expect(
        screen.getByRole("button", { name: /Cancel/i }),
      ).toBeInTheDocument();
    });

    test("hides cancel button when no onCancel is provided", () => {
      render(<TimeEntryForm onSubmit={mockOnSubmit} />);

      expect(
        screen.queryByRole("button", { name: /Cancel/i }),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------
  // Validation
  // -------------------------------------------------------

  describe("Validation", () => {
    test("validates required projectId when no projectId prop", async () => {
      render(<TimeEntryForm onSubmit={mockOnSubmit} />);

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(screen.getByText("Project is required")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates required description", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(screen.getByText("Description is required")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates required startedAt", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(screen.getByText("Start time is required")).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates that endedAt OR durationMinutes must be provided", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        const errorMessages = screen.getAllByText(
          "End time or duration is required",
        );
        expect(errorMessages.length).toBeGreaterThanOrEqual(1);
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("sets error on both endedAt and durationMinutes when neither provided", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        const errorMessages = screen.getAllByText(
          "End time or duration is required",
        );
        expect(errorMessages).toHaveLength(2);
      });
    });

    test("validates durationMinutes must be a positive number", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "-5" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Duration must be a positive number"),
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates durationMinutes rejects zero", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "0" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(
          screen.getByText("Duration must be a positive number"),
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates endedAt must be after startedAt", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T10:00" },
      });
      fireEvent.change(screen.getByLabelText(/End Time/i), {
        target: { name: "endedAt", value: "2026-02-26T09:00" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(
          screen.getByText("End time must be after start time"),
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    test("validates endedAt equal to startedAt is rejected", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Some work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T10:00" },
      });
      fireEvent.change(screen.getByLabelText(/End Time/i), {
        target: { name: "endedAt", value: "2026-02-26T10:00" },
      });

      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(
          screen.getByText("End time must be after start time"),
        ).toBeInTheDocument();
      });
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // Error Clearing
  // -------------------------------------------------------

  describe("Error Clearing", () => {
    test("clears error when user changes the field value", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      // Submit to trigger validation errors
      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(screen.getByText("Description is required")).toBeInTheDocument();
      });

      // Type in the description field to clear the error
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Now filling in" },
      });

      expect(
        screen.queryByText("Description is required"),
      ).not.toBeInTheDocument();
    });
  });

  // -------------------------------------------------------
  // Submission
  // -------------------------------------------------------

  describe("Submission", () => {
    test("calls onSubmit with form data on valid submission", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      // ARRANGE
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Implemented feature X" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "90" },
      });

      // ACT
      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledTimes(1);
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            projectId: "proj-123",
            description: "Implemented feature X",
            startedAt: "2026-02-26T09:00",
            durationMinutes: "90",
          }),
        );
      });
    });

    test("calculates duration from start and end times when durationMinutes is not provided", async () => {
      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      // ARRANGE: 2 hour gap = 120 minutes
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Meeting" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/End Time/i), {
        target: { name: "endedAt", value: "2026-02-26T11:00" },
      });

      // ACT
      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      // ASSERT
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            durationMinutes: "120",
            startedAt: "2026-02-26T09:00",
            endedAt: "2026-02-26T11:00",
          }),
        );
      });
    });

    test("shows loading state during submission", async () => {
      // Make onSubmit hang to keep loading state active
      let resolveSubmit: () => void;
      const pendingSubmit = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(pendingSubmit);

      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      // Fill valid data
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "30" },
      });

      // Submit
      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      // ASSERT: loading icon appears and submit button is disabled
      await waitFor(() => {
        expect(screen.getByTestId("loader-icon")).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Log Time/i }),
        ).toBeDisabled();
      });

      // Resolve the pending submission
      resolveSubmit!();

      // Loading state should clear
      await waitFor(() => {
        expect(screen.queryByTestId("loader-icon")).not.toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: /Log Time/i }),
        ).not.toBeDisabled();
      });
    });

    test("handles submit error gracefully and clears loading state", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      mockOnSubmit.mockRejectedValue(new Error("Network error"));

      render(<TimeEntryForm projectId="proj-123" onSubmit={mockOnSubmit} />);

      // Fill valid data
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "30" },
      });

      // ACT
      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      // ASSERT: loading clears after error
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Log Time/i }),
        ).not.toBeDisabled();
      });

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Form submission error:",
        expect.any(Error),
      );

      consoleErrorSpy.mockRestore();
    });
  });

  // -------------------------------------------------------
  // Cancel Button
  // -------------------------------------------------------

  describe("Cancel Button", () => {
    test("calls onCancel when cancel button is clicked", () => {
      render(<TimeEntryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));

      expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });
  });

  // -------------------------------------------------------
  // Disabled State During Loading
  // -------------------------------------------------------

  describe("Disabled State During Loading", () => {
    test("disables all inputs and buttons during submission", async () => {
      let resolveSubmit: () => void;
      const pendingSubmit = new Promise<void>((resolve) => {
        resolveSubmit = resolve;
      });
      mockOnSubmit.mockReturnValue(pendingSubmit);

      render(<TimeEntryForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />);

      // Fill valid data (no projectId prop so projectId field is visible)
      fireEvent.change(screen.getByLabelText(/Project ID/i), {
        target: { name: "projectId", value: "proj-789" },
      });
      fireEvent.change(screen.getByLabelText(/Description/i), {
        target: { name: "description", value: "Work" },
      });
      fireEvent.change(screen.getByLabelText(/Start Time/i), {
        target: { name: "startedAt", value: "2026-02-26T09:00" },
      });
      fireEvent.change(screen.getByLabelText(/Duration \(minutes\)/i), {
        target: { name: "durationMinutes", value: "30" },
      });

      // Submit
      fireEvent.submit(screen.getByRole("button", { name: /Log Time/i }));

      await waitFor(() => {
        expect(screen.getByLabelText(/Project ID/i)).toBeDisabled();
        expect(screen.getByLabelText(/Description/i)).toBeDisabled();
        expect(screen.getByLabelText(/Start Time/i)).toBeDisabled();
        expect(screen.getByLabelText(/End Time/i)).toBeDisabled();
        expect(screen.getByLabelText(/Duration \(minutes\)/i)).toBeDisabled();
        expect(screen.getByRole("button", { name: /Cancel/i })).toBeDisabled();
        expect(
          screen.getByRole("button", { name: /Log Time/i }),
        ).toBeDisabled();
      });

      // Clean up
      resolveSubmit!();
      await waitFor(() => {
        expect(
          screen.getByRole("button", { name: /Log Time/i }),
        ).not.toBeDisabled();
      });
    });
  });
});
