/**
 * Unit Tests for QuoteReviewModal Component
 *
 * Tests modal visibility, quote detail rendering, optional fields,
 * close behavior, and async action handlers (approve/decline/convert).
 */

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QuoteReviewModal } from "@/components/admin/QuoteReviewModal";

// Mock lucide-react icons as simple spans
jest.mock("lucide-react", () => ({
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  Check: (props: any) => <span data-testid="icon-check" {...props} />,
  XCircle: (props: any) => <span data-testid="icon-x-circle" {...props} />,
  FileText: (props: any) => <span data-testid="icon-file-text" {...props} />,
  Loader2: (props: any) => <span data-testid="icon-loader" {...props} />,
}));

describe("QuoteReviewModal", () => {
  const baseQuote = {
    id: "quote-456",
    projectType: "E-Commerce Platform",
    status: "PENDING",
    contactEmail: "client@example.com",
    createdAt: "2026-02-10T14:00:00.000Z",
  };

  const fullQuote = {
    ...baseQuote,
    contactName: "Jane Doe",
    contactPhone: "+1-555-0123",
    description: "Need a full e-commerce solution with payment processing.",
    budget: "25,000",
    timeline: "3 months",
    features: ["Shopping cart", "Payment gateway", "Admin dashboard"],
  };

  const defaultProps = {
    quote: baseQuote,
    isOpen: true,
    onClose: jest.fn(),
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Visibility", () => {
    test("should return null when isOpen is false", () => {
      const { container } = render(
        <QuoteReviewModal
          quote={baseQuote}
          isOpen={false}
          onClose={jest.fn()}
        />,
      );

      expect(container.innerHTML).toBe("");
    });

    test("should render modal when isOpen is true", () => {
      render(<QuoteReviewModal {...defaultProps} />);

      expect(screen.getByText("Quote Review")).toBeInTheDocument();
    });
  });

  describe("Quote Details Rendering", () => {
    test("should show projectType", () => {
      render(<QuoteReviewModal {...defaultProps} />);

      expect(screen.getByText("E-Commerce Platform")).toBeInTheDocument();
    });

    test("should show status badge", () => {
      render(<QuoteReviewModal {...defaultProps} />);

      expect(screen.getByText("PENDING")).toBeInTheDocument();
    });

    test("should show contactEmail", () => {
      render(<QuoteReviewModal {...defaultProps} />);

      expect(screen.getByText("client@example.com")).toBeInTheDocument();
    });

    test("should show contactName when present", () => {
      render(<QuoteReviewModal {...defaultProps} quote={fullQuote} />);

      expect(screen.getByText("Jane Doe")).toBeInTheDocument();
    });

    test("should show contactPhone when present", () => {
      render(<QuoteReviewModal {...defaultProps} quote={fullQuote} />);

      expect(screen.getByText("+1-555-0123")).toBeInTheDocument();
    });

    test("should show description when present", () => {
      render(<QuoteReviewModal {...defaultProps} quote={fullQuote} />);

      expect(
        screen.getByText(
          "Need a full e-commerce solution with payment processing.",
        ),
      ).toBeInTheDocument();
    });

    test("should show budget with dollar prefix when present", () => {
      render(<QuoteReviewModal {...defaultProps} quote={fullQuote} />);

      expect(screen.getByText(/\$25,000/)).toBeInTheDocument();
    });

    test("should show timeline when present", () => {
      render(<QuoteReviewModal {...defaultProps} quote={fullQuote} />);

      expect(screen.getByText("3 months")).toBeInTheDocument();
    });

    test("should show features list when present", () => {
      render(<QuoteReviewModal {...defaultProps} quote={fullQuote} />);

      expect(screen.getByText("Shopping cart")).toBeInTheDocument();
      expect(screen.getByText("Payment gateway")).toBeInTheDocument();
      expect(screen.getByText("Admin dashboard")).toBeInTheDocument();
    });

    test("should show createdAt as localized date string", () => {
      render(<QuoteReviewModal {...defaultProps} />);

      const expectedDate = new Date(
        "2026-02-10T14:00:00.000Z",
      ).toLocaleString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    test("should not show optional fields when absent", () => {
      render(<QuoteReviewModal {...defaultProps} quote={baseQuote} />);

      expect(screen.queryByText("Name:")).not.toBeInTheDocument();
      expect(screen.queryByText("Phone:")).not.toBeInTheDocument();
      expect(screen.queryByText("Requested Features")).not.toBeInTheDocument();
    });
  });

  describe("Close Behavior", () => {
    test("should call onClose when close button is clicked", () => {
      const onClose = jest.fn();
      render(
        <QuoteReviewModal quote={baseQuote} isOpen={true} onClose={onClose} />,
      );

      // The Close text button in the footer
      fireEvent.click(screen.getByText("Close"));

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("should call onClose when backdrop is clicked", () => {
      const onClose = jest.fn();
      const { container } = render(
        <QuoteReviewModal quote={baseQuote} isOpen={true} onClose={onClose} />,
      );

      // Backdrop is the first div with fixed inset-0 bg-black
      const backdrop = container.querySelector(".bg-black.bg-opacity-50");
      expect(backdrop).toBeInTheDocument();
      fireEvent.click(backdrop!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("should call onClose when X icon button is clicked", () => {
      const onClose = jest.fn();
      render(
        <QuoteReviewModal quote={baseQuote} isOpen={true} onClose={onClose} />,
      );

      // The X icon button in the header (distinct from the footer Close button)
      const xIconButton = screen.getByTestId("icon-x").closest("button");
      expect(xIconButton).toBeInTheDocument();
      fireEvent.click(xIconButton!);

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe("Action Buttons Visibility", () => {
    test("should show Approve button when status is PENDING and onApprove is provided", () => {
      const onApprove = jest.fn().mockResolvedValue(undefined);
      render(
        <QuoteReviewModal
          {...defaultProps}
          quote={{ ...baseQuote, status: "PENDING" }}
          onApprove={onApprove}
        />,
      );

      expect(screen.getByText("Approve")).toBeInTheDocument();
    });

    test("should show Decline button when status is PENDING and onDecline is provided", () => {
      const onDecline = jest.fn().mockResolvedValue(undefined);
      render(
        <QuoteReviewModal
          {...defaultProps}
          quote={{ ...baseQuote, status: "PENDING" }}
          onDecline={onDecline}
        />,
      );

      expect(screen.getByText("Decline")).toBeInTheDocument();
    });

    test("should show Convert to Project button when status is APPROVED and onConvert is provided", () => {
      const onConvert = jest.fn().mockResolvedValue(undefined);
      render(
        <QuoteReviewModal
          {...defaultProps}
          quote={{ ...baseQuote, status: "APPROVED" }}
          onConvert={onConvert}
        />,
      );

      expect(screen.getByText("Convert to Project")).toBeInTheDocument();
    });

    test("should not show Approve or Decline buttons when status is APPROVED", () => {
      const onApprove = jest.fn().mockResolvedValue(undefined);
      const onDecline = jest.fn().mockResolvedValue(undefined);
      render(
        <QuoteReviewModal
          {...defaultProps}
          quote={{ ...baseQuote, status: "APPROVED" }}
          onApprove={onApprove}
          onDecline={onDecline}
        />,
      );

      expect(screen.queryByText("Approve")).not.toBeInTheDocument();
      expect(screen.queryByText("Decline")).not.toBeInTheDocument();
    });

    test("should not show Convert button when status is PENDING", () => {
      const onConvert = jest.fn().mockResolvedValue(undefined);
      render(
        <QuoteReviewModal
          {...defaultProps}
          quote={{ ...baseQuote, status: "PENDING" }}
          onConvert={onConvert}
        />,
      );

      expect(screen.queryByText("Convert to Project")).not.toBeInTheDocument();
    });

    test("should not show action buttons when handlers are not provided", () => {
      render(
        <QuoteReviewModal
          quote={{ ...baseQuote, status: "PENDING" }}
          isOpen={true}
          onClose={jest.fn()}
        />,
      );

      expect(screen.queryByText("Approve")).not.toBeInTheDocument();
      expect(screen.queryByText("Decline")).not.toBeInTheDocument();
      expect(screen.queryByText("Convert to Project")).not.toBeInTheDocument();
    });
  });

  describe("Action Handlers", () => {
    test("should call onApprove with quote id and then close on success", async () => {
      const onApprove = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      render(
        <QuoteReviewModal
          quote={{ ...baseQuote, status: "PENDING" }}
          isOpen={true}
          onClose={onClose}
          onApprove={onApprove}
        />,
      );

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(onApprove).toHaveBeenCalledWith("quote-456");
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    test("should call onDecline with quote id and then close on success", async () => {
      const onDecline = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      render(
        <QuoteReviewModal
          quote={{ ...baseQuote, status: "PENDING" }}
          isOpen={true}
          onClose={onClose}
          onDecline={onDecline}
        />,
      );

      fireEvent.click(screen.getByText("Decline"));

      await waitFor(() => {
        expect(onDecline).toHaveBeenCalledTimes(1);
        expect(onDecline).toHaveBeenCalledWith("quote-456");
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    test("should call onConvert with quote id and then close on success", async () => {
      const onConvert = jest.fn().mockResolvedValue(undefined);
      const onClose = jest.fn();
      render(
        <QuoteReviewModal
          quote={{ ...baseQuote, status: "APPROVED" }}
          isOpen={true}
          onClose={onClose}
          onConvert={onConvert}
        />,
      );

      fireEvent.click(screen.getByText("Convert to Project"));

      await waitFor(() => {
        expect(onConvert).toHaveBeenCalledTimes(1);
        expect(onConvert).toHaveBeenCalledWith("quote-456");
        expect(onClose).toHaveBeenCalledTimes(1);
      });
    });

    test("should handle action error gracefully without closing modal", async () => {
      const consoleErrorSpy = jest
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const error = new Error("Network failure");
      const onApprove = jest.fn().mockRejectedValue(error);
      const onClose = jest.fn();
      render(
        <QuoteReviewModal
          quote={{ ...baseQuote, status: "PENDING" }}
          isOpen={true}
          onClose={onClose}
          onApprove={onApprove}
        />,
      );

      fireEvent.click(screen.getByText("Approve"));

      await waitFor(() => {
        expect(onApprove).toHaveBeenCalledTimes(1);
        expect(consoleErrorSpy).toHaveBeenCalledWith("Action failed:", error);
        // onClose should NOT have been called since the action failed
        expect(onClose).not.toHaveBeenCalled();
      });

      consoleErrorSpy.mockRestore();
    });

    test("should disable buttons while action is loading", async () => {
      let resolveAction: () => void;
      const onApprove = jest.fn().mockImplementation(
        () =>
          new Promise<void>((resolve) => {
            resolveAction = resolve;
          }),
      );
      render(
        <QuoteReviewModal
          quote={{ ...baseQuote, status: "PENDING" }}
          isOpen={true}
          onClose={jest.fn()}
          onApprove={onApprove}
        />,
      );

      fireEvent.click(screen.getByText("Approve"));

      // While the promise is pending, buttons should be disabled
      await waitFor(() => {
        const closeButton = screen.getByText("Close");
        expect(closeButton).toBeDisabled();
      });

      // Resolve the action to clean up
      resolveAction!();

      await waitFor(() => {
        expect(screen.getByText("Close")).not.toBeDisabled();
      });
    });
  });
});
