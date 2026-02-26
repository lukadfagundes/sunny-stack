/**
 * Unit Tests for QuoteCard Component
 *
 * Tests rendering of quote data, conditional action buttons,
 * status color mapping, and handler invocations.
 */

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { QuoteCard } from "@/components/admin/QuoteCard";

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

// Mock lucide-react icons as simple spans
jest.mock("lucide-react", () => ({
  Eye: (props: any) => <span data-testid="icon-eye" {...props} />,
  Check: (props: any) => <span data-testid="icon-check" {...props} />,
  X: (props: any) => <span data-testid="icon-x" {...props} />,
  FileText: (props: any) => <span data-testid="icon-file-text" {...props} />,
}));

describe("QuoteCard", () => {
  const baseQuote = {
    id: "quote-123",
    projectType: "Web Application",
    status: "PENDING",
    createdAt: "2026-01-15T10:30:00.000Z",
  };

  const fullQuote = {
    ...baseQuote,
    contactEmail: "client@example.com",
    estimatedBudget: "5,000",
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Rendering", () => {
    test("should render quote projectType as title", () => {
      render(<QuoteCard quote={baseQuote} />);

      expect(screen.getByText("Web Application")).toBeInTheDocument();
    });

    test("should render status badge with status text", () => {
      render(<QuoteCard quote={baseQuote} />);

      expect(screen.getByText("PENDING")).toBeInTheDocument();
    });

    test("should show contactEmail when present", () => {
      render(<QuoteCard quote={fullQuote} />);

      expect(screen.getByText("client@example.com")).toBeInTheDocument();
    });

    test("should not show contactEmail when not present", () => {
      render(<QuoteCard quote={baseQuote} />);

      expect(screen.queryByText("client@example.com")).not.toBeInTheDocument();
    });

    test("should show estimatedBudget with dollar prefix when present", () => {
      render(<QuoteCard quote={fullQuote} />);

      expect(screen.getByText(/\$5,000/)).toBeInTheDocument();
    });

    test("should not show budget section when estimatedBudget is not present", () => {
      render(<QuoteCard quote={baseQuote} />);

      expect(screen.queryByText("Budget:")).not.toBeInTheDocument();
    });

    test("should show createdAt as localized date", () => {
      render(<QuoteCard quote={baseQuote} />);

      const expectedDate = new Date(
        "2026-01-15T10:30:00.000Z",
      ).toLocaleDateString();
      expect(screen.getByText(expectedDate)).toBeInTheDocument();
    });

    test("should always render View link with correct href", () => {
      render(<QuoteCard quote={baseQuote} />);

      const viewLink = screen.getByText("View").closest("a");
      expect(viewLink).toHaveAttribute("href", "/admin/quotes/quote-123");
    });
  });

  describe("Status Color Mapping", () => {
    test("should apply yellow colors for PENDING status", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "PENDING" }} />);

      const badge = screen.getByText("PENDING");
      expect(badge).toHaveClass("bg-yellow-100");
      expect(badge).toHaveClass("text-yellow-800");
    });

    test("should apply green colors for APPROVED status", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "APPROVED" }} />);

      const badge = screen.getByText("APPROVED");
      expect(badge).toHaveClass("bg-green-100");
      expect(badge).toHaveClass("text-green-800");
    });

    test("should apply red colors for DECLINED status", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "DECLINED" }} />);

      const badge = screen.getByText("DECLINED");
      expect(badge).toHaveClass("bg-red-100");
      expect(badge).toHaveClass("text-red-800");
    });

    test("should apply blue colors for CONVERTED status", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "CONVERTED" }} />);

      const badge = screen.getByText("CONVERTED");
      expect(badge).toHaveClass("bg-blue-100");
      expect(badge).toHaveClass("text-blue-800");
    });

    test("should apply gray colors for unknown status", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "UNKNOWN" }} />);

      const badge = screen.getByText("UNKNOWN");
      expect(badge).toHaveClass("bg-gray-100");
      expect(badge).toHaveClass("text-gray-800");
    });
  });

  describe("Approve Button", () => {
    test("should show Approve button when status is PENDING and onApprove is provided", () => {
      const onApprove = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "PENDING" }}
          onApprove={onApprove}
        />,
      );

      expect(screen.getByText("Approve")).toBeInTheDocument();
    });

    test("should not show Approve button when status is not PENDING", () => {
      const onApprove = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "APPROVED" }}
          onApprove={onApprove}
        />,
      );

      expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    });

    test("should not show Approve button when onApprove is not provided", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "PENDING" }} />);

      expect(screen.queryByText("Approve")).not.toBeInTheDocument();
    });

    test("should call onApprove with quote id when clicked", () => {
      const onApprove = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "PENDING" }}
          onApprove={onApprove}
        />,
      );

      fireEvent.click(screen.getByText("Approve"));

      expect(onApprove).toHaveBeenCalledTimes(1);
      expect(onApprove).toHaveBeenCalledWith("quote-123");
    });
  });

  describe("Decline Button", () => {
    test("should show Decline button when status is PENDING and onDecline is provided", () => {
      const onDecline = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "PENDING" }}
          onDecline={onDecline}
        />,
      );

      expect(screen.getByText("Decline")).toBeInTheDocument();
    });

    test("should not show Decline button when status is not PENDING", () => {
      const onDecline = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "DECLINED" }}
          onDecline={onDecline}
        />,
      );

      expect(screen.queryByText("Decline")).not.toBeInTheDocument();
    });

    test("should not show Decline button when onDecline is not provided", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "PENDING" }} />);

      expect(screen.queryByText("Decline")).not.toBeInTheDocument();
    });

    test("should call onDecline with quote id when clicked", () => {
      const onDecline = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "PENDING" }}
          onDecline={onDecline}
        />,
      );

      fireEvent.click(screen.getByText("Decline"));

      expect(onDecline).toHaveBeenCalledTimes(1);
      expect(onDecline).toHaveBeenCalledWith("quote-123");
    });
  });

  describe("Convert Button", () => {
    test("should show Convert button when status is APPROVED and onConvert is provided", () => {
      const onConvert = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "APPROVED" }}
          onConvert={onConvert}
        />,
      );

      expect(screen.getByText("Convert")).toBeInTheDocument();
    });

    test("should not show Convert button when status is not APPROVED", () => {
      const onConvert = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "PENDING" }}
          onConvert={onConvert}
        />,
      );

      expect(screen.queryByText("Convert")).not.toBeInTheDocument();
    });

    test("should not show Convert button when onConvert is not provided", () => {
      render(<QuoteCard quote={{ ...baseQuote, status: "APPROVED" }} />);

      expect(screen.queryByText("Convert")).not.toBeInTheDocument();
    });

    test("should call onConvert with quote id when clicked", () => {
      const onConvert = jest.fn();
      render(
        <QuoteCard
          quote={{ ...baseQuote, status: "APPROVED" }}
          onConvert={onConvert}
        />,
      );

      fireEvent.click(screen.getByText("Convert"));

      expect(onConvert).toHaveBeenCalledTimes(1);
      expect(onConvert).toHaveBeenCalledWith("quote-123");
    });
  });
});
