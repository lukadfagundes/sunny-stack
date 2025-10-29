'use client';
export const dynamic = 'force-dynamic';

/**
 * Reports & Analytics Page
 *
 * Displays various charts and analytics using AnalyticsChart component
 *
 * @module app/admin/reports/page
 */

import { useState, useEffect } from 'react';
import { AnalyticsChart } from '@/components/admin/AnalyticsChart';
import { ChartSkeleton } from '@/components/admin/Skeletons';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Calendar } from 'lucide-react';

interface AnalyticsData {
  monthlyRevenue: Array<{ month: string; revenue: number; profit: number }>;
  projectStatus: Array<{ status: string; count: number }>;
  timeByProject: Array<{ project: string; hours: number }>;
  projectTimeline: Array<{ project: string; startDate: string; endDate: string }>;
}

export default function ReportsAnalyticsPage() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('/api/admin/analytics');
      if (!response.ok) {
        throw new Error('Failed to fetch analytics');
      }
      const data = await response.json();

      // Transform data for charts
      // Note: In production, this transformation would happen in the API
      const transformedData: AnalyticsData = {
        monthlyRevenue: [
          { month: 'Jan', revenue: 12500, profit: 4200 },
          { month: 'Feb', revenue: 15800, profit: 5100 },
          { month: 'Mar', revenue: 18200, profit: 6300 },
          { month: 'Apr', revenue: 21500, profit: 7800 },
          { month: 'May', revenue: 19800, profit: 6900 },
          { month: 'Jun', revenue: 24300, profit: 9200 },
        ],
        projectStatus: [
          { status: 'Planning', count: 3 },
          { status: 'In Progress', count: 5 },
          { status: 'Review', count: 2 },
          { status: 'Complete', count: 12 },
        ],
        timeByProject: [
          { project: 'E-Commerce Site', hours: 124 },
          { project: 'Mobile App', hours: 89 },
          { project: 'Dashboard', hours: 67 },
          { project: 'API Integration', hours: 45 },
          { project: 'Consulting', hours: 32 },
        ],
        projectTimeline: [
          { project: 'Project A', startDate: '2024-01-01', endDate: '2024-03-15' },
          { project: 'Project B', startDate: '2024-02-01', endDate: '2024-05-30' },
          { project: 'Project C', startDate: '2024-03-01', endDate: '2024-06-15' },
        ],
      };

      setAnalytics(transformedData);
    } catch (err) {
      console.error('Error fetching analytics:', err);
      setError(err instanceof Error ? err.message : 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Reports & Analytics</h1>
        <p className="text-gray-600 mt-2">
          Visualize your business metrics and project data
        </p>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Error: {error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-2 text-sm text-red-700 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_, i) => (
            <ChartSkeleton key={i} height={300} />
          ))}
        </div>
      )}

      {/* Charts */}
      {!loading && !error && analytics && (
        <>
          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">
                    $
                    {analytics.monthlyRevenue
                      .reduce((sum, m) => sum + m.revenue, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <BarChart3 className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Profit</p>
                  <p className="text-2xl font-bold text-gray-900">
                    $
                    {analytics.monthlyRevenue
                      .reduce((sum, m) => sum + m.profit, 0)
                      .toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <PieChartIcon className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Active Projects</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.projectStatus.reduce((sum, s) => sum + s.count, 0)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Calendar className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Hours</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analytics.timeByProject.reduce((sum, p) => sum + p.hours, 0)}h
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Revenue Chart */}
          <AnalyticsChart
            type="line"
            data={analytics.monthlyRevenue}
            dataKeys={['revenue', 'profit']}
            xAxisKey="month"
            title="Monthly Revenue & Profit"
            height={350}
          />

          {/* Grid of Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Project Status Distribution */}
            <AnalyticsChart
              type="pie"
              data={analytics.projectStatus.map((item) => ({
                name: item.status,
                value: item.count,
              }))}
              dataKeys={['value']}
              xAxisKey="name"
              title="Project Status Distribution"
              height={300}
            />

            {/* Time Tracking by Project */}
            <AnalyticsChart
              type="bar"
              data={analytics.timeByProject}
              dataKeys={['hours']}
              xAxisKey="project"
              title="Time Tracked by Project"
              height={300}
            />
          </div>

          {/* Export Section */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Export Reports</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Download your analytics data in various formats
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
                >
                  Export CSV
                </button>
                <button
                  disabled
                  className="px-4 py-2 text-sm font-medium text-gray-400 bg-gray-100 rounded-md cursor-not-allowed"
                >
                  Export PDF
                </button>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-4">
              Export functionality will be available in Group 5 (PDF Generation)
            </p>
          </div>

          {/* Info Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              <strong>Note:</strong> The charts above use sample data for demonstration purposes.
              Real analytics will be calculated from your actual project and time tracking data.
            </p>
          </div>
        </>
      )}
    </div>
  );
}
