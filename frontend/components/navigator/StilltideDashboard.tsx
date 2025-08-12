'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface DashboardMetrics {
  total_equipment: number
  operational: number
  maintenance: number
  critical: number
  efficiency_average: number
  uptime_percentage: number
}

interface Trend {
  direction: 'up' | 'down' | 'stable'
  change: number
}

interface RecentEvent {
  timestamp: string
  equipment: string
  event: string
  severity: 'info' | 'warning' | 'error' | 'critical'
}

export default function StilltideDashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [trends, setTrends] = useState<Record<string, Trend>>({})
  const [events, setEvents] = useState<RecentEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
    const interval = setInterval(fetchDashboardData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [])

  const fetchDashboardData = async () => {
    try {
      const response = await fetch('/api/navigator-helm/stilltide/dashboard', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setMetrics(data.metrics)
        setTrends(data.trends)
        setEvents(data.recent_events)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTrendIcon = (trend: Trend) => {
    if (trend.direction === 'up') return '📈'
    if (trend.direction === 'down') return '📉'
    return '➡️'
  }

  const getTrendColor = (trend: Trend, metric: string) => {
    // For efficiency and uptime, up is good
    if (metric === 'efficiency' || metric === 'uptime') {
      return trend.direction === 'up' ? 'text-green-600' : trend.direction === 'down' ? 'text-red-600' : 'text-gray-600'
    }
    // For maintenance cost, down is good
    if (metric === 'maintenance_cost') {
      return trend.direction === 'down' ? 'text-green-600' : trend.direction === 'up' ? 'text-red-600' : 'text-gray-600'
    }
    return 'text-gray-600'
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-300'
      case 'error': return 'bg-orange-100 text-orange-800 border-orange-300'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-300'
      case 'info': return 'bg-blue-100 text-blue-800 border-blue-300'
      default: return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading Stilltide Analytics...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="text-4xl">🌊</span>
          <div>
            <h2 className="text-2xl font-bold">Stilltide Analytics Dashboard</h2>
            <p className="opacity-90">Deep Historical Analysis & Pattern Recognition</p>
          </div>
        </div>
      </div>

      {/* Key Metrics Grid */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Total Equipment</p>
            <p className="text-2xl font-bold text-gray-800">{metrics.total_equipment}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Operational</p>
            <p className="text-2xl font-bold text-green-600">{metrics.operational}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Maintenance</p>
            <p className="text-2xl font-bold text-yellow-600">{metrics.maintenance}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Critical</p>
            <p className="text-2xl font-bold text-red-600">{metrics.critical}</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Avg Efficiency</p>
            <p className="text-2xl font-bold text-blue-600">{metrics.efficiency_average}%</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white rounded-lg shadow-md p-4"
          >
            <p className="text-sm text-gray-600 mb-1">Uptime</p>
            <p className="text-2xl font-bold text-indigo-600">{metrics.uptime_percentage}%</p>
          </motion.div>
        </div>
      )}

      {/* Trends */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Performance Trends</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(trends).map(([key, trend]) => (
            <div key={key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <p className="text-sm text-gray-600 capitalize">{key.replace('_', ' ')}</p>
                <p className={`text-xl font-bold ${getTrendColor(trend, key)}`}>
                  {trend.change > 0 ? '+' : ''}{trend.change}%
                </p>
              </div>
              <span className="text-3xl">{getTrendIcon(trend)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Events */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-bold text-gray-800 mb-4">Recent Events</h3>
        <div className="space-y-2">
          {events.length > 0 ? (
            events.map((event, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`p-3 rounded-lg border ${getSeverityColor(event.severity)}`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{event.equipment}</p>
                    <p className="text-sm mt-1">{event.event}</p>
                  </div>
                  <p className="text-xs opacity-75">
                    {new Date(event.timestamp).toLocaleString()}
                  </p>
                </div>
              </motion.div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-4">No recent events</p>
          )}
        </div>
      </div>

      {/* Analytics Charts Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Efficiency Over Time</h3>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Equipment Status Distribution</h3>
          <div className="h-48 bg-gray-100 rounded flex items-center justify-center">
            <p className="text-gray-500">Chart visualization coming soon</p>
          </div>
        </div>
      </div>
    </div>
  )
}