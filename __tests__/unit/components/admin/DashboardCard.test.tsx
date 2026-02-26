/**
 * Unit Tests for DashboardCard Component
 *
 * Tests metric card rendering including title, value, icon display,
 * and optional change indicator with positive/negative directions.
 */

import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { DashboardCard } from "@/components/admin/DashboardCard";

describe("DashboardCard", () => {
  const defaultProps = {
    title: "Active Projects",
    value: 12,
    icon: <span data-testid="mock-icon">icon</span>,
  };

  afterEach(() => {
    jest.clearAllMocks();
  });

  // -----------------------------------------------------------
  // Basic Rendering
  // -----------------------------------------------------------

  describe("Basic Rendering", () => {
    test("should render title and value", () => {
      render(<DashboardCard {...defaultProps} />);

      expect(screen.getByText("Active Projects")).toBeInTheDocument();
      expect(screen.getByText("12")).toBeInTheDocument();
    });

    test("should render string value correctly", () => {
      render(<DashboardCard {...defaultProps} value="$5,000" />);

      expect(screen.getByText("$5,000")).toBeInTheDocument();
    });

    test("should render the icon element", () => {
      render(<DashboardCard {...defaultProps} />);

      expect(screen.getByTestId("mock-icon")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Change Indicator
  // -----------------------------------------------------------

  describe("Change Indicator", () => {
    test('should show positive change with up arrow and "vs last period" text', () => {
      render(
        <DashboardCard
          {...defaultProps}
          change={{ value: 15, isPositive: true }}
        />,
      );

      const changeText = screen.getByText(/vs last period/);
      expect(changeText).toBeInTheDocument();

      // The parent element should contain the up arrow and percentage
      const changeContainer = changeText.closest("p");
      expect(changeContainer).toHaveTextContent(/↑/);
      expect(changeContainer).toHaveTextContent(/15%/);
      expect(changeContainer).toHaveClass("text-green-600");
    });

    test('should show negative change with down arrow and "vs last period" text', () => {
      render(
        <DashboardCard
          {...defaultProps}
          change={{ value: 8, isPositive: false }}
        />,
      );

      const changeText = screen.getByText(/vs last period/);
      expect(changeText).toBeInTheDocument();

      const changeContainer = changeText.closest("p");
      expect(changeContainer).toHaveTextContent(/↓/);
      expect(changeContainer).toHaveTextContent(/8%/);
      expect(changeContainer).toHaveClass("text-red-600");
    });

    test("should not render change indicator when change prop is not provided", () => {
      render(<DashboardCard {...defaultProps} />);

      expect(screen.queryByText(/vs last period/)).not.toBeInTheDocument();
      expect(screen.queryByText(/↑/)).not.toBeInTheDocument();
      expect(screen.queryByText(/↓/)).not.toBeInTheDocument();
    });
  });
});
