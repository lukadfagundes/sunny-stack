'use client';

/**
 * @file DashboardCard Component
 * @description Card component for displaying dashboard metrics
 * @module components/admin/DashboardCard
 */

import React from 'react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  change?: { value: number; isPositive: boolean };
  icon: React.ReactNode;
}

/**
 * DashboardCard Component
 *
 * Displays a metric card with title, value, optional change indicator, and icon
 *
 * @param props - Component props
 * @param props.title - Card title (e.g., "Active Projects")
 * @param props.value - Main metric value (string or number)
 * @param props.change - Optional change indicator with value and direction
 * @param props.icon - Icon element to display
 * @returns Dashboard card component
 *
 * @example
 * <DashboardCard
 *   title="Active Projects"
 *   value={12}
 *   change={{ value: 5, isPositive: true }}
 *   icon={<FolderIcon className="h-6 w-6" />}
 * />
 */
export function DashboardCard({
  title,
  value,
  change,
  icon,
}: DashboardCardProps) {
  return (
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-600 font-medium">{title}</p>
          <p className="text-2xl font-bold mt-2 text-gray-900">{value}</p>
          {change && (
            <p
              className={`text-sm mt-1 font-medium ${
                change.isPositive ? 'text-green-600' : 'text-red-600'
              }`}
            >
              {change.isPositive ? '↑' : '↓'} {Math.abs(change.value)}%
              <span className="text-gray-500 font-normal ml-1">
                vs last period
              </span>
            </p>
          )}
        </div>
        <div className="text-blue-500 ml-4">{icon}</div>
      </div>
    </div>
  );
}
