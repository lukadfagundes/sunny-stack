// __tests__/unit/components/admin/AnalyticsChart.test.tsx

import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { AnalyticsChart } from "@/components/admin/AnalyticsChart";

// Mock recharts - jsdom cannot render SVG-based chart components
jest.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: any) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: any) => (
    <div data-testid="line-chart">{children}</div>
  ),
  BarChart: ({ children }: any) => (
    <div data-testid="bar-chart">{children}</div>
  ),
  PieChart: ({ children }: any) => (
    <div data-testid="pie-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  Bar: () => <div data-testid="bar" />,
  Pie: ({ children }: any) => <div data-testid="pie">{children}</div>,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="xaxis" />,
  YAxis: () => <div data-testid="yaxis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
}));

// Mock chart configuration
jest.mock("@/lib/charts/chart-config", () => ({
  chartColors: ["#0088FE", "#00C49F"],
  chartColorsExtended: ["#0088FE", "#00C49F", "#FFBB28"],
  tooltipStyle: { background: "#fff" },
  axisStyle: { stroke: "#666" },
  gridStyle: { strokeDasharray: "3 3" },
  chartMargin: { top: 5, right: 30, left: 20, bottom: 5 },
  getColorByIndex: (i: number) =>
    ["#0088FE", "#00C49F", "#FFBB28"][i] || "#ccc",
}));

describe("AnalyticsChart", () => {
  const sampleData = [
    { name: "Jan", revenue: 4000, expenses: 2400 },
    { name: "Feb", revenue: 3000, expenses: 1398 },
    { name: "Mar", revenue: 2000, expenses: 9800 },
  ];

  const defaultProps = {
    type: "line" as const,
    data: sampleData,
    dataKeys: ["revenue", "expenses"],
  };

  // -----------------------------------------------------------
  // Empty data
  // -----------------------------------------------------------

  describe("empty data", () => {
    test('shows "No data available" when data array is empty', () => {
      render(<AnalyticsChart type="line" data={[]} dataKeys={["revenue"]} />);

      expect(screen.getByText("No data available")).toBeInTheDocument();
    });

    test("does not render a chart when data is empty", () => {
      render(<AnalyticsChart type="line" data={[]} dataKeys={["revenue"]} />);

      expect(
        screen.queryByTestId("responsive-container"),
      ).not.toBeInTheDocument();
      expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Title
  // -----------------------------------------------------------

  describe("title", () => {
    test("shows title when provided", () => {
      render(<AnalyticsChart {...defaultProps} title="Monthly Revenue" />);

      expect(screen.getByText("Monthly Revenue")).toBeInTheDocument();
    });

    test("does not render title element when title is not provided", () => {
      const { container } = render(<AnalyticsChart {...defaultProps} />);

      const headings = container.querySelectorAll("h3");
      expect(headings).toHaveLength(0);
    });

    test("shows title alongside empty state when data is empty", () => {
      render(
        <AnalyticsChart
          type="bar"
          data={[]}
          dataKeys={["revenue"]}
          title="Empty Chart"
        />,
      );

      expect(screen.getByText("Empty Chart")).toBeInTheDocument();
      expect(screen.getByText("No data available")).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Chart type rendering
  // -----------------------------------------------------------

  describe("chart types", () => {
    test('renders line chart for type="line"', () => {
      render(<AnalyticsChart {...defaultProps} type="line" />);

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    test('renders bar chart for type="bar"', () => {
      render(<AnalyticsChart {...defaultProps} type="bar" />);

      expect(screen.getByTestId("bar-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
      expect(screen.queryByTestId("pie-chart")).not.toBeInTheDocument();
    });

    test('renders pie chart for type="pie"', () => {
      render(<AnalyticsChart {...defaultProps} type="pie" />);

      expect(screen.getByTestId("pie-chart")).toBeInTheDocument();
      expect(screen.queryByTestId("line-chart")).not.toBeInTheDocument();
      expect(screen.queryByTestId("bar-chart")).not.toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // ResponsiveContainer
  // -----------------------------------------------------------

  describe("responsive container", () => {
    test("wraps chart in ResponsiveContainer when data is present", () => {
      render(<AnalyticsChart {...defaultProps} />);

      expect(screen.getByTestId("responsive-container")).toBeInTheDocument();
    });

    test("uses default height of 300", () => {
      render(<AnalyticsChart {...defaultProps} />);

      const container = screen.getByTestId("responsive-container");
      expect(container).toBeInTheDocument();
    });
  });

  // -----------------------------------------------------------
  // Chart sub-components
  // -----------------------------------------------------------

  describe("chart sub-components", () => {
    test("renders CartesianGrid, axes, Tooltip, and Legend for line chart", () => {
      render(<AnalyticsChart {...defaultProps} type="line" />);

      expect(screen.getByTestId("cartesian-grid")).toBeInTheDocument();
      expect(screen.getByTestId("xaxis")).toBeInTheDocument();
      expect(screen.getByTestId("yaxis")).toBeInTheDocument();
      expect(screen.getByTestId("tooltip")).toBeInTheDocument();
      expect(screen.getByTestId("legend")).toBeInTheDocument();
    });

    test("renders a Line element for each dataKey in line chart", () => {
      render(<AnalyticsChart {...defaultProps} type="line" />);

      const lines = screen.getAllByTestId("line");
      expect(lines).toHaveLength(2);
    });

    test("renders a Bar element for each dataKey in bar chart", () => {
      render(<AnalyticsChart {...defaultProps} type="bar" />);

      const bars = screen.getAllByTestId("bar");
      expect(bars).toHaveLength(2);
    });

    test("renders Cell elements for each data point in pie chart", () => {
      render(<AnalyticsChart {...defaultProps} type="pie" />);

      const cells = screen.getAllByTestId("cell");
      expect(cells).toHaveLength(sampleData.length);
    });
  });
});
