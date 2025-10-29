'use client';

/**
 * @file AnalyticsChart Component
 * @description Wrapper component for Recharts using config from chart-config.ts
 * @module components/admin/AnalyticsChart
 */

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  BarChart,
  PieChart,
  Line,
  Bar,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import {
  chartColors,
  chartColorsExtended,
  tooltipStyle,
  axisStyle,
  gridStyle,
  chartMargin,
  getColorByIndex,
} from '@/lib/charts/chart-config';

interface ChartData {
  [key: string]: string | number;
}

interface AnalyticsChartProps {
  type: 'line' | 'bar' | 'pie';
  data: ChartData[];
  dataKeys: string[];
  xAxisKey?: string;
  title?: string;
  height?: number;
  colors?: string[];
}

/**
 * AnalyticsChart Component
 *
 * Unified chart component supporting LineChart, BarChart, and PieChart
 *
 * @param props - Component props
 * @param props.type - Chart type ('line', 'bar', or 'pie')
 * @param props.data - Array of data objects
 * @param props.dataKeys - Keys to plot (e.g., ['revenue', 'expenses'])
 * @param props.xAxisKey - Key for X axis (default: 'name')
 * @param props.title - Optional chart title
 * @param props.height - Chart height in pixels (default: 300)
 * @param props.colors - Optional custom colors array
 * @returns Analytics chart component
 *
 * @example
 * <AnalyticsChart
 *   type="line"
 *   data={revenueData}
 *   dataKeys={['revenue', 'profit']}
 *   xAxisKey="month"
 *   title="Monthly Revenue"
 * />
 */
export function AnalyticsChart({
  type,
  data,
  dataKeys,
  xAxisKey = 'name',
  title,
  height = 300,
  colors,
}: AnalyticsChartProps) {
  const chartColors_ = colors || dataKeys.map((_, index) => getColorByIndex(index));

  if (data.length === 0) {
    return (
      <div
        className="bg-white shadow rounded-lg p-6"
        style={{ height: `${height + 100}px` }}
      >
        {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
        <div className="flex items-center justify-center h-full text-gray-500">
          No data available
        </div>
      </div>
    );
  }

  const renderChart = () => {
    switch (type) {
      case 'line':
        return (
          <LineChart data={data} margin={chartMargin}>
            <CartesianGrid {...gridStyle} />
            <XAxis
              dataKey={xAxisKey}
              {...axisStyle}
              tick={{ fill: axisStyle.stroke }}
            />
            <YAxis {...axisStyle} tick={{ fill: axisStyle.stroke }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={chartColors_[index]}
                strokeWidth={2}
                dot={{ fill: chartColors_[index], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'bar':
        return (
          <BarChart data={data} margin={chartMargin}>
            <CartesianGrid {...gridStyle} />
            <XAxis
              dataKey={xAxisKey}
              {...axisStyle}
              tick={{ fill: axisStyle.stroke }}
            />
            <YAxis {...axisStyle} tick={{ fill: axisStyle.stroke }} />
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
            {dataKeys.map((key, index) => (
              <Bar key={key} dataKey={key} fill={chartColors_[index]} />
            ))}
          </BarChart>
        );

      case 'pie':
        return (
          <PieChart>
            <Pie
              data={data}
              dataKey={dataKeys[0]}
              nameKey={xAxisKey}
              cx="50%"
              cy="50%"
              outerRadius={80}
              label
            >
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={chartColors_[index]} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend />
          </PieChart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white shadow rounded-lg p-6">
      {title && <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
}
