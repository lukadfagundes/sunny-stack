// __tests__/unit/components/ErrorBoundary.test.tsx

import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import "@testing-library/jest-dom";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { logError } from "@/lib/monitoring/rollbar";

// Mock rollbar logging
jest.mock("@/lib/monitoring/rollbar", () => ({
  logError: jest.fn(),
}));

// Component that throws on render to trigger error boundary
function ThrowingComponent(): never {
  throw new Error("Test error");
}

describe("ErrorBoundary", () => {
  // Suppress console.error for error boundary tests - React logs errors
  // to console when error boundaries catch them, which clutters output.
  beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    (console.error as jest.Mock).mockRestore();
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------
  // Normal rendering (no error)
  // -----------------------------------------------------------

  describe("when no error occurs", () => {
    test("renders children normally", () => {
      render(
        <ErrorBoundary>
          <div>Child content</div>
        </ErrorBoundary>,
      );

      expect(screen.getByText("Child content")).toBeInTheDocument();
    });

    test("does not show error UI when children render successfully", () => {
      render(
        <ErrorBoundary>
          <p>Everything is fine</p>
        </ErrorBoundary>,
      );

      expect(
        screen.queryByText("Something went wrong"),
      ).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Error caught - default fallback
  // -----------------------------------------------------------

  describe("when an error is caught (default fallback)", () => {
    test('shows "Something went wrong" message', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    });

    test("shows apology message", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(
        screen.getByText(/We apologize for the inconvenience/),
      ).toBeInTheDocument();
    });

    test('shows "Reload Page" button', () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      const reloadButton = screen.getByRole("button", {
        name: /Reload Page/i,
      });
      expect(reloadButton).toBeInTheDocument();
    });

    test("reload button is clickable without throwing", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      // Verify the button exists and can be clicked without error
      // (jsdom does not allow mocking window.location.reload directly)
      expect(() => {
        fireEvent.click(screen.getByRole("button", { name: /Reload Page/i }));
      }).not.toThrow();
    });

    test("does not render children after error", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(screen.queryByText("Child content")).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Error caught - custom fallback
  // -----------------------------------------------------------

  describe("when an error is caught (custom fallback)", () => {
    test("renders custom fallback instead of default UI", () => {
      const customFallback = <div>Custom error page</div>;

      render(
        <ErrorBoundary fallback={customFallback}>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(screen.getByText("Custom error page")).toBeInTheDocument();
      expect(
        screen.queryByText("Something went wrong"),
      ).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Error logging
  // -----------------------------------------------------------

  describe("error logging", () => {
    test("calls logError when an error is caught", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(logError).toHaveBeenCalledTimes(1);
      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          errorBoundary: "RootErrorBoundary",
        }),
      );
    });

    test("passes componentStack in error metadata", () => {
      render(
        <ErrorBoundary>
          <ThrowingComponent />
        </ErrorBoundary>,
      );

      expect(logError).toHaveBeenCalledWith(
        expect.any(Error),
        expect.objectContaining({
          componentStack: expect.any(String),
        }),
      );
    });
  });
});
