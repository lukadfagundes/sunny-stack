// __tests__/unit/components/admin/Skeletons.test.tsx

import { render } from "@testing-library/react";
import "@testing-library/jest-dom";
import {
  CardSkeleton,
  TableSkeleton,
  ChartSkeleton,
  ListSkeleton,
  FormSkeleton,
} from "@/components/admin/Skeletons";

describe("Skeleton Components", () => {
  // -------------------------------------------------------
  // CardSkeleton
  // -------------------------------------------------------

  describe("CardSkeleton", () => {
    test("renders the card skeleton", () => {
      const { container } = render(<CardSkeleton />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveClass("animate-pulse");
    });
  });

  // -------------------------------------------------------
  // TableSkeleton
  // -------------------------------------------------------

  describe("TableSkeleton", () => {
    test("renders default 5 rows", () => {
      const { container } = render(<TableSkeleton />);

      const rows = container.querySelectorAll(".border-b");
      expect(rows).toHaveLength(5);
    });

    test("renders custom row count", () => {
      const { container } = render(<TableSkeleton rows={3} />);

      const rows = container.querySelectorAll(".border-b");
      expect(rows).toHaveLength(3);
    });

    test("renders with animate-pulse class", () => {
      const { container } = render(<TableSkeleton />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("animate-pulse");
    });
  });

  // -------------------------------------------------------
  // ChartSkeleton
  // -------------------------------------------------------

  describe("ChartSkeleton", () => {
    test("renders with default height of 256px", () => {
      const { container } = render(<ChartSkeleton />);

      const chartArea = container.querySelector(
        ".bg-gray-100.rounded",
      ) as HTMLElement;
      expect(chartArea).toBeInTheDocument();
      expect(chartArea.style.height).toBe("256px");
    });

    test("renders with custom height", () => {
      const { container } = render(<ChartSkeleton height={400} />);

      const chartArea = container.querySelector(
        ".bg-gray-100.rounded",
      ) as HTMLElement;
      expect(chartArea.style.height).toBe("400px");
    });
  });

  // -------------------------------------------------------
  // ListSkeleton
  // -------------------------------------------------------

  describe("ListSkeleton", () => {
    test("renders default 3 items", () => {
      const { container } = render(<ListSkeleton />);

      const items = container.querySelectorAll(".flex.items-center");
      expect(items).toHaveLength(3);
    });

    test("renders custom item count", () => {
      const { container } = render(<ListSkeleton items={7} />);

      const items = container.querySelectorAll(".flex.items-center");
      expect(items).toHaveLength(7);
    });
  });

  // -------------------------------------------------------
  // FormSkeleton
  // -------------------------------------------------------

  describe("FormSkeleton", () => {
    test("renders default 4 fields", () => {
      const { container } = render(<FormSkeleton />);

      // Each field has a label placeholder (.h-3) and input placeholder (.h-10)
      const fieldInputs = container.querySelectorAll(".h-10");
      expect(fieldInputs).toHaveLength(4);
    });

    test("renders custom field count", () => {
      const { container } = render(<FormSkeleton fields={6} />);

      const fieldInputs = container.querySelectorAll(".h-10");
      expect(fieldInputs).toHaveLength(6);
    });

    test("renders with animate-pulse class", () => {
      const { container } = render(<FormSkeleton />);

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("animate-pulse");
    });
  });
});
