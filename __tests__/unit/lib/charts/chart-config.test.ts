/**
 * @jest-environment node
 */

// __tests__/unit/lib/charts/chart-config.test.ts

import {
  chartColors,
  chartColorsExtended,
  chartTheme,
  tooltipStyle,
  axisStyle,
  gridStyle,
  legendStyle,
  responsiveConfig,
  animationConfig,
  chartMargin,
  getColorByIndex,
  formatChartNumber,
  formatChartCurrency,
  formatChartPercentage,
} from "@/lib/charts/chart-config";

describe("chart-config", () => {
  describe("chartColors", () => {
    test("contains all expected color keys", () => {
      expect(chartColors).toHaveProperty("primary");
      expect(chartColors).toHaveProperty("secondary");
      expect(chartColors).toHaveProperty("success");
      expect(chartColors).toHaveProperty("warning");
      expect(chartColors).toHaveProperty("danger");
      expect(chartColors).toHaveProperty("gray");
    });

    test("all values are valid hex color strings", () => {
      Object.values(chartColors).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe("chartColorsExtended", () => {
    test("extends base chartColors", () => {
      expect(chartColorsExtended.primary).toBe(chartColors.primary);
      expect(chartColorsExtended.secondary).toBe(chartColors.secondary);
    });

    test("contains additional colors", () => {
      expect(chartColorsExtended).toHaveProperty("indigo");
      expect(chartColorsExtended).toHaveProperty("violet");
      expect(chartColorsExtended).toHaveProperty("teal");
      expect(chartColorsExtended).toHaveProperty("cyan");
      expect(chartColorsExtended).toHaveProperty("sky");
    });

    test("all extended values are valid hex color strings", () => {
      Object.values(chartColorsExtended).forEach((color) => {
        expect(color).toMatch(/^#[0-9a-f]{6}$/i);
      });
    });
  });

  describe("chartTheme", () => {
    test("has fontSize and fontFamily", () => {
      expect(chartTheme.fontSize).toBe(12);
      expect(chartTheme.fontFamily).toBe("Inter, sans-serif");
    });
  });

  describe("tooltipStyle", () => {
    test("has expected CSS properties", () => {
      expect(tooltipStyle).toHaveProperty("backgroundColor");
      expect(tooltipStyle).toHaveProperty("border");
      expect(tooltipStyle).toHaveProperty("borderRadius");
      expect(tooltipStyle).toHaveProperty("padding");
      expect(tooltipStyle).toHaveProperty("fontSize");
      expect(tooltipStyle).toHaveProperty("boxShadow");
    });
  });

  describe("axisStyle", () => {
    test("has stroke and font properties", () => {
      expect(axisStyle.stroke).toBe("#9ca3af");
      expect(axisStyle.fontSize).toBe(12);
      expect(axisStyle.fontFamily).toBe("Inter, sans-serif");
    });
  });

  describe("gridStyle", () => {
    test("has stroke and dasharray", () => {
      expect(gridStyle.stroke).toBe("#e5e7eb");
      expect(gridStyle.strokeDasharray).toBe("3 3");
    });
  });

  describe("legendStyle", () => {
    test("has font properties", () => {
      expect(legendStyle.fontSize).toBe(12);
      expect(legendStyle.fontFamily).toBe("Inter, sans-serif");
    });
  });

  describe("responsiveConfig", () => {
    test("has mobile, tablet, and desktop breakpoints", () => {
      expect(responsiveConfig.mobile).toBeDefined();
      expect(responsiveConfig.tablet).toBeDefined();
      expect(responsiveConfig.desktop).toBeDefined();
    });

    test("has correct mobile dimensions", () => {
      expect(responsiveConfig.mobile.minWidth).toBe(320);
      expect(responsiveConfig.mobile.maxWidth).toBe(640);
      expect(responsiveConfig.mobile.height).toBe(250);
    });

    test("desktop has no maxWidth", () => {
      expect(responsiveConfig.desktop.minWidth).toBe(1025);
      expect(responsiveConfig.desktop.height).toBe(400);
    });
  });

  describe("animationConfig", () => {
    test("has duration and easing", () => {
      expect(animationConfig.duration).toBe(800);
      expect(animationConfig.easing).toBe("ease-in-out");
    });
  });

  describe("chartMargin", () => {
    test("has all margin values", () => {
      expect(chartMargin.top).toBe(20);
      expect(chartMargin.right).toBe(30);
      expect(chartMargin.bottom).toBe(20);
      expect(chartMargin.left).toBe(20);
    });
  });

  describe("getColorByIndex", () => {
    const extendedColors = Object.values(chartColorsExtended);

    test("returns first color for index 0", () => {
      expect(getColorByIndex(0)).toBe(extendedColors[0]);
    });

    test("returns correct color for valid index", () => {
      expect(getColorByIndex(1)).toBe(extendedColors[1]);
      expect(getColorByIndex(5)).toBe(extendedColors[5]);
    });

    test("wraps around when index exceeds array length", () => {
      const len = extendedColors.length;
      expect(getColorByIndex(len)).toBe(extendedColors[0]);
      expect(getColorByIndex(len + 1)).toBe(extendedColors[1]);
      expect(getColorByIndex(len * 3 + 2)).toBe(extendedColors[2]);
    });

    test("returns a valid hex color string for any index", () => {
      for (let i = 0; i < 30; i++) {
        expect(getColorByIndex(i)).toMatch(/^#[0-9a-f]{6}$/i);
      }
    });
  });

  describe("formatChartNumber", () => {
    test("formats integer with no options", () => {
      expect(formatChartNumber(1234)).toBe("1,234");
    });

    test("formats with decimal places", () => {
      expect(formatChartNumber(1234.567, { decimals: 2 })).toBe("1,234.57");
    });

    test("formats with prefix", () => {
      expect(formatChartNumber(1234, { prefix: "$" })).toBe("$1,234");
    });

    test("formats with suffix", () => {
      expect(formatChartNumber(75, { suffix: "%" })).toBe("75%");
    });

    test("formats with all options combined", () => {
      expect(
        formatChartNumber(1234.56, {
          decimals: 2,
          prefix: "$",
          suffix: " USD",
        }),
      ).toBe("$1,234.56 USD");
    });

    test("handles zero", () => {
      expect(formatChartNumber(0)).toBe("0");
    });

    test("handles negative numbers", () => {
      expect(formatChartNumber(-500, { prefix: "$" })).toBe("$-500");
    });

    test("defaults to 0 decimals when not specified", () => {
      expect(formatChartNumber(99.99)).toBe("100");
    });
  });

  describe("formatChartCurrency", () => {
    test("formats USD currency by default", () => {
      expect(formatChartCurrency(1234.56)).toBe("$1,234.56");
    });

    test("formats zero", () => {
      expect(formatChartCurrency(0)).toBe("$0.00");
    });

    test("formats large amounts", () => {
      expect(formatChartCurrency(1000000)).toBe("$1,000,000.00");
    });

    test("formats negative amounts", () => {
      const result = formatChartCurrency(-99.99);
      expect(result).toContain("99.99");
    });

    test("formats EUR currency", () => {
      const result = formatChartCurrency(1234.56, "EUR");
      expect(result).toContain("1,234.56");
    });

    test("formats GBP currency", () => {
      const result = formatChartCurrency(500, "GBP");
      expect(result).toContain("500.00");
    });
  });

  describe("formatChartPercentage", () => {
    test("formats with default 1 decimal place", () => {
      expect(formatChartPercentage(12.345)).toBe("12.3%");
    });

    test("formats with custom decimal places", () => {
      expect(formatChartPercentage(12.345, 2)).toBe("12.35%");
      expect(formatChartPercentage(12.345, 0)).toBe("12%");
    });

    test("handles zero", () => {
      expect(formatChartPercentage(0)).toBe("0.0%");
    });

    test("handles 100%", () => {
      expect(formatChartPercentage(100)).toBe("100.0%");
    });

    test("handles values over 100", () => {
      expect(formatChartPercentage(150.5, 1)).toBe("150.5%");
    });

    test("handles negative percentages", () => {
      expect(formatChartPercentage(-5.5, 1)).toBe("-5.5%");
    });
  });
});
