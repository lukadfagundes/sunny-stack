/**
 * Unit Tests for HealthIndicator Component
 *
 * Tests status rendering for online, offline, and pending states,
 * including correct labels, messages, and the pulse dot indicator.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { HealthIndicator } from "@/components/admin/HealthIndicator";

// Mock lucide-react icons as simple spans
jest.mock("lucide-react", () => ({
  Activity: (props: any) => <span data-testid="icon-activity" {...props} />,
  AlertCircle: (props: any) => (
    <span data-testid="icon-alert-circle" {...props} />
  ),
  Clock: (props: any) => <span data-testid="icon-clock" {...props} />,
}));

describe("HealthIndicator", () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------
  // Default (Pending) Status
  // -----------------------------------------------------------

  describe("Default Status", () => {
    test("should render pending status by default when no status prop is provided", () => {
      render(<HealthIndicator />);

      expect(screen.getByText("Discord Integration")).toBeInTheDocument();
      expect(
        screen.getByText("Discord integration pending Phase 3 implementation"),
      ).toBeInTheDocument();
    });

    test("should render Clock icon for pending status", () => {
      render(<HealthIndicator />);

      expect(screen.getByTestId("icon-clock")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Online Status
  // -----------------------------------------------------------

  describe("Online Status", () => {
    test("should render correct label and message for online status", () => {
      render(<HealthIndicator status="online" />);

      expect(screen.getByText("Discord: Online")).toBeInTheDocument();
      expect(
        screen.getByText("Discord channel is operational"),
      ).toBeInTheDocument();
    });

    test("should render Activity icon for online status", () => {
      render(<HealthIndicator status="online" />);

      expect(screen.getByTestId("icon-activity")).toBeInTheDocument();
    });

    test('should show pulse dot and "Active" text when online', () => {
      const { container } = render(<HealthIndicator status="online" />);

      const pulseDot = container.querySelector(".animate-pulse");
      expect(pulseDot).toBeInTheDocument();
      expect(screen.getByText("Active")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Offline Status
  // -----------------------------------------------------------

  describe("Offline Status", () => {
    test("should render correct label and message for offline status", () => {
      render(<HealthIndicator status="offline" />);

      expect(screen.getByText("Discord: Offline")).toBeInTheDocument();
      expect(
        screen.getByText("Discord channel is currently unavailable"),
      ).toBeInTheDocument();
    });

    test("should render AlertCircle icon for offline status", () => {
      render(<HealthIndicator status="offline" />);

      expect(screen.getByTestId("icon-alert-circle")).toBeInTheDocument();
    });

    test("should not show pulse dot when offline", () => {
      const { container } = render(<HealthIndicator status="offline" />);

      const pulseDot = container.querySelector(".animate-pulse");
      expect(pulseDot).not.toBeInTheDocument();
      expect(screen.queryByText("Active")).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Pending Status (Explicit)
  // -----------------------------------------------------------

  describe("Pending Status (Explicit)", () => {
    test("should render correct label and message for explicit pending status", () => {
      render(<HealthIndicator status="pending" />);

      expect(screen.getByText("Discord Integration")).toBeInTheDocument();
      expect(
        screen.getByText("Discord integration pending Phase 3 implementation"),
      ).toBeInTheDocument();
    });

    test("should not show pulse dot when pending", () => {
      const { container } = render(<HealthIndicator status="pending" />);

      const pulseDot = container.querySelector(".animate-pulse");
      expect(pulseDot).not.toBeInTheDocument();
      expect(screen.queryByText("Active")).not.toBeInTheDocument();
    });
  });
});
