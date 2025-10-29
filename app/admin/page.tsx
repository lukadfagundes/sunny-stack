'use client';
export const dynamic = 'force-dynamic';

/**
 * Admin Dashboard Home Page
 *
 * Main dashboard page displaying key metrics, recent activity, and system status.
 * This is the landing page for admin users after authentication.
 *
 * @module app/admin/page
 */

import { useState, useEffect } from 'react';
import { DashboardCard } from '@/components/admin/DashboardCard';
import { CardSkeleton } from '@/components/admin/Skeletons';
import { HealthIndicator } from '@/components/admin/HealthIndicator';
import { FolderKanban, MessageSquare, DollarSign, Clock } from 'lucide-react';

interface AnalyticsData {
  activeProjects: number;
  pendingQuotes: number;
  totalRevenue: number;
  hoursTracked: number;
  recentActivity: Array<{
    type: 'project' | 'quote';
    id: string;
    title: string;
    status: string;
    timestamp: string;
  }>;
}

export default function AdminDashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const response = await fetch('/api/admin/analytics');
        if (!response.ok) {
          throw new Error('Failed to fetch analytics');
        }
        const data = await response.json();
        setAnalytics(data);
      } catch (err) {
        console.error('Error fetching analytics:', err);
        setError(err instanceof Error ? err.message : 'Failed to load analytics');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to the Sunny Stack admin panel
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">
            Welcome to the Sunny Stack admin panel
          </p>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">
          Welcome to the Sunny Stack admin panel
        </p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <DashboardCard
          title="Active Projects"
          value={analytics?.activeProjects || 0}
          icon={<FolderKanban className="h-6 w-6" />}
        />
        <DashboardCard
          title="Pending Quotes"
          value={analytics?.pendingQuotes || 0}
          icon={<MessageSquare className="h-6 w-6" />}
        />
        <DashboardCard
          title="Total Revenue"
          value={`$${(analytics?.totalRevenue || 0).toLocaleString()}`}
          icon={<DollarSign className="h-6 w-6" />}
        />
        <DashboardCard
          title="Hours (This Week)"
          value={analytics?.hoursTracked || 0}
          icon={<Clock className="h-6 w-6" />}
        />
      </div>

      {/* Health Indicator */}
      <HealthIndicator status="pending" />

      {/* Recent Activity */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
        </div>
        <div className="p-6">
          {analytics?.recentActivity && analytics.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {analytics.recentActivity.map((activity) => (
                <div
                  key={`${activity.type}-${activity.id}`}
                  className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {activity.type === 'project' ? '📁' : '💬'} {activity.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {activity.type === 'project' ? 'Project' : 'Quote'} •{' '}
                      <span
                        className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                          activity.status === 'PENDING'
                            ? 'bg-yellow-100 text-yellow-800'
                            : activity.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800'
                              : activity.status === 'COMPLETE'
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {activity.status}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-gray-500 ml-4">
                    {new Date(activity.timestamp).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-8">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );
}
