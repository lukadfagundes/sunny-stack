'use client';

/**
 * @file HealthIndicator Component
 * @description Component showing Discord channel health status
 * @module components/admin/HealthIndicator
 */

import React from 'react';
import { Activity, AlertCircle, Clock } from 'lucide-react';

interface HealthIndicatorProps {
  status?: 'online' | 'offline' | 'pending';
}

/**
 * HealthIndicator Component
 *
 * Displays Discord channel health status
 * Currently shows "Pending Phase 3" message until Discord integration is implemented
 *
 * @param props - Component props
 * @param props.status - Health status ('online', 'offline', or 'pending')
 * @returns Health indicator component
 *
 * @example
 * <HealthIndicator status="pending" />
 */
export function HealthIndicator({ status = 'pending' }: HealthIndicatorProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'online':
        return {
          icon: Activity,
          color: 'text-green-600',
          bgColor: 'bg-green-100',
          borderColor: 'border-green-200',
          label: 'Discord: Online',
          message: 'Discord channel is operational',
        };
      case 'offline':
        return {
          icon: AlertCircle,
          color: 'text-red-600',
          bgColor: 'bg-red-100',
          borderColor: 'border-red-200',
          label: 'Discord: Offline',
          message: 'Discord channel is currently unavailable',
        };
      case 'pending':
      default:
        return {
          icon: Clock,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-100',
          borderColor: 'border-yellow-200',
          label: 'Discord Integration',
          message: 'Discord integration pending Phase 3 implementation',
        };
    }
  };

  const config = getStatusConfig(status);
  const Icon = config.icon;

  return (
    <div
      className={`border ${config.borderColor} ${config.bgColor} rounded-lg p-4`}
    >
      <div className="flex items-center gap-3">
        <div className={`${config.color}`}>
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <h4 className={`text-sm font-semibold ${config.color}`}>
            {config.label}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{config.message}</p>
        </div>
        {status === 'online' && (
          <div className="flex items-center gap-1">
            <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-xs text-gray-600">Active</span>
          </div>
        )}
      </div>
    </div>
  );
}
