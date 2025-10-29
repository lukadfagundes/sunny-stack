/**
 * @file Recharts configuration and theme
 * @description Default configuration, colors, and styles for all charts in the admin dashboard
 * @module lib/charts/chart-config
 */

import { CSSProperties } from 'react';

/**
 * Chart color palette
 * Using Tailwind CSS color values for consistency
 */
export const chartColors = {
  primary: '#3b82f6', // blue-500
  secondary: '#8b5cf6', // violet-500
  success: '#10b981', // green-500
  warning: '#f59e0b', // amber-500
  danger: '#ef4444', // red-500
  gray: '#6b7280', // gray-500
} as const;

/**
 * Extended chart colors for multi-series charts
 * Provides additional color options for complex visualizations
 */
export const chartColorsExtended = {
  ...chartColors,
  blue: '#3b82f6', // blue-500
  indigo: '#6366f1', // indigo-500
  violet: '#8b5cf6', // violet-500
  purple: '#a855f7', // purple-500
  pink: '#ec4899', // pink-500
  rose: '#f43f5e', // rose-500
  orange: '#f97316', // orange-500
  yellow: '#eab308', // yellow-500
  lime: '#84cc16', // lime-500
  green: '#22c55e', // green-500
  emerald: '#10b981', // emerald-500
  teal: '#14b8a6', // teal-500
  cyan: '#06b6d4', // cyan-500
  sky: '#0ea5e9', // sky-500
} as const;

/**
 * Chart theme configuration
 * Global typography and styling settings
 */
export const chartTheme = {
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
} as const;

/**
 * Tooltip styling
 * Consistent tooltip appearance across all charts
 */
export const tooltipStyle: CSSProperties = {
  backgroundColor: '#ffffff',
  border: '1px solid #e5e7eb',
  borderRadius: '0.375rem',
  padding: '8px 12px',
  fontSize: '14px',
  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
};

/**
 * Axis styling
 * Configuration for chart axes (X and Y)
 */
export const axisStyle = {
  stroke: '#9ca3af', // gray-400
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
} as const;

/**
 * Grid styling
 * Configuration for chart grid lines
 */
export const gridStyle = {
  stroke: '#e5e7eb', // gray-200
  strokeDasharray: '3 3',
} as const;

/**
 * Legend styling
 * Configuration for chart legends
 */
export const legendStyle = {
  fontSize: 12,
  fontFamily: 'Inter, sans-serif',
} as const;

/**
 * Responsive chart configuration
 * Breakpoints and dimensions for responsive charts
 */
export const responsiveConfig = {
  mobile: {
    minWidth: 320,
    maxWidth: 640,
    height: 250,
  },
  tablet: {
    minWidth: 641,
    maxWidth: 1024,
    height: 300,
  },
  desktop: {
    minWidth: 1025,
    height: 400,
  },
} as const;

/**
 * Animation configuration
 * Settings for chart animations
 */
export const animationConfig = {
  duration: 800,
  easing: 'ease-in-out',
} as const;

/**
 * Default margin for charts
 * Consistent spacing around chart content
 */
export const chartMargin = {
  top: 20,
  right: 30,
  bottom: 20,
  left: 20,
} as const;

/**
 * Get color by index for multi-series charts
 *
 * @param {number} index - Series index
 * @returns {string} Color hex value
 *
 * @example
 * const color = getColorByIndex(0); // Returns '#3b82f6' (blue)
 */
export function getColorByIndex(index: number): string {
  const colors = Object.values(chartColorsExtended);
  return colors[index % colors.length];
}

/**
 * Format number for chart display
 *
 * @param {number} value - Number to format
 * @param {Object} [options] - Formatting options
 * @param {number} [options.decimals=0] - Number of decimal places
 * @param {string} [options.prefix=''] - Prefix (e.g., '$')
 * @param {string} [options.suffix=''] - Suffix (e.g., '%')
 * @returns {string} Formatted number
 *
 * @example
 * formatChartNumber(1234.56, { decimals: 2, prefix: '$' }); // Returns '$1,234.56'
 */
export function formatChartNumber(
  value: number,
  options: {
    decimals?: number;
    prefix?: string;
    suffix?: string;
  } = {}
): string {
  const { decimals = 0, prefix = '', suffix = '' } = options;

  const formatted = value.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });

  return `${prefix}${formatted}${suffix}`;
}

/**
 * Format currency for chart display
 *
 * @param {number} value - Currency value
 * @param {string} [currency='USD'] - Currency code
 * @returns {string} Formatted currency
 *
 * @example
 * formatChartCurrency(1234.56); // Returns '$1,234.56'
 */
export function formatChartCurrency(
  value: number,
  currency: string = 'USD'
): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

/**
 * Format percentage for chart display
 *
 * @param {number} value - Percentage value (0-100)
 * @param {number} [decimals=1] - Number of decimal places
 * @returns {string} Formatted percentage
 *
 * @example
 * formatChartPercentage(12.345, 2); // Returns '12.35%'
 */
export function formatChartPercentage(
  value: number,
  decimals: number = 1
): string {
  return `${value.toFixed(decimals)}%`;
}
