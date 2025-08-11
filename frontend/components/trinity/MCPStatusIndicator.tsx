'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, Activity, AlertCircle, CheckCircle, Database, Zap } from 'lucide-react'
import { mcpApi } from '@/lib/api'

interface MCPStatus {
  service: string
  status: 'operational' | 'degraded' | 'offline'
  connection: {
    protocol: string
    version: string
    enabled: boolean
  }
  health: {
    health: string
    metrics: {
      cpu_percent: number
      memory_percent: number
      disk_percent: number
      active_connections: number
      debug_logs_count: number
      recent_errors: number
    }
    debug_activity: {
      total_logs: number
      recent_activity: number
    }
  }
  capabilities: string[]
}

export default function MCPStatusIndicator() {
  const [mcpStatus, setMcpStatus] = useState<MCPStatus | null>(null)
  const [isExpanded, setIsExpanded] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch MCP status
  const fetchMCPStatus = async () => {
    try {
      const data = await mcpApi.getStatus()
      setMcpStatus(data)
      setError(null)
    } catch (err) {
      console.error('MCP status error:', err)
      setError(err instanceof Error ? err.message : 'MCP connection failed')
      setMcpStatus(null)
    } finally {
      setIsLoading(false)
    }
  }

  // Auto-refresh every 30 seconds
  useEffect(() => {
    fetchMCPStatus()
    const interval = setInterval(fetchMCPStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = () => {
    if (error || !mcpStatus) return 'text-red-500'
    if (mcpStatus.status === 'operational') return 'text-green-500'
    if (mcpStatus.status === 'degraded') return 'text-yellow-500'
    return 'text-red-500'
  }

  const getStatusIcon = () => {
    if (error || !mcpStatus) return <WifiOff className="w-4 h-4" />
    if (mcpStatus.status === 'operational') return <Wifi className="w-4 h-4" />
    return <AlertCircle className="w-4 h-4" />
  }

  const getHealthIndicator = (value: number, threshold: number = 80) => {
    if (value > threshold) return 'text-red-400'
    if (value > threshold * 0.75) return 'text-yellow-400'
    return 'text-green-400'
  }

  if (isLoading) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-3 animate-pulse">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-600 rounded-full" />
            <div className="w-24 h-4 bg-gray-600 rounded" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="absolute bottom-full right-0 mb-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-xl overflow-hidden"
          >
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-3">
              <h3 className="text-white font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                MCP Connector Details
              </h3>
            </div>
            
            {mcpStatus ? (
              <div className="p-4 space-y-3">
                {/* Connection Info */}
                <div className="text-sm">
                  <div className="flex justify-between text-gray-400">
                    <span>Protocol:</span>
                    <span className="text-gray-200">{mcpStatus.connection.protocol}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Version:</span>
                    <span className="text-gray-200">{mcpStatus.connection.version}</span>
                  </div>
                  <div className="flex justify-between text-gray-400">
                    <span>Status:</span>
                    <span className={getStatusColor()}>{mcpStatus.status}</span>
                  </div>
                </div>

                {/* System Metrics */}
                <div className="border-t border-gray-700 pt-3">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">System Metrics</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">CPU:</span>
                      <span className={getHealthIndicator(mcpStatus.health.metrics.cpu_percent)}>
                        {mcpStatus.health.metrics.cpu_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Memory:</span>
                      <span className={getHealthIndicator(mcpStatus.health.metrics.memory_percent)}>
                        {mcpStatus.health.metrics.memory_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Disk:</span>
                      <span className={getHealthIndicator(mcpStatus.health.metrics.disk_percent)}>
                        {mcpStatus.health.metrics.disk_percent.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                {/* Debug Activity */}
                <div className="border-t border-gray-700 pt-3">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Debug Activity</h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total Logs:</span>
                      <span className="text-gray-300">{mcpStatus.health.debug_activity.total_logs}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recent Activity:</span>
                      <span className="text-gray-300">{mcpStatus.health.debug_activity.recent_activity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Recent Errors:</span>
                      <span className={mcpStatus.health.metrics.recent_errors > 0 ? 'text-red-400' : 'text-green-400'}>
                        {mcpStatus.health.metrics.recent_errors}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Capabilities */}
                <div className="border-t border-gray-700 pt-3">
                  <h4 className="text-xs font-semibold text-gray-400 mb-2">Enabled Capabilities</h4>
                  <div className="flex flex-wrap gap-1">
                    {mcpStatus.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="px-2 py-1 bg-gray-800 text-gray-300 text-xs rounded"
                      >
                        {cap.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <div className="text-red-400 text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  {error || 'MCP service unavailable'}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Status Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsExpanded(!isExpanded)}
        className={`
          bg-gray-800 border border-gray-700 rounded-lg p-3
          hover:bg-gray-750 transition-colors cursor-pointer
          ${isExpanded ? 'ring-2 ring-purple-500' : ''}
        `}
      >
        <div className="flex items-center gap-2">
          <div className={`${getStatusColor()} flex items-center`}>
            {getStatusIcon()}
          </div>
          <div className="text-left">
            <div className="text-xs font-medium text-gray-200">MCP</div>
            <div className={`text-xs ${getStatusColor()}`}>
              {error ? 'Offline' : mcpStatus?.status || 'Unknown'}
            </div>
          </div>
          {mcpStatus && mcpStatus.health.metrics.recent_errors > 0 && (
            <div className="ml-2">
              <span className="inline-flex items-center justify-center w-5 h-5 bg-red-500 text-white text-xs rounded-full">
                {mcpStatus.health.metrics.recent_errors}
              </span>
            </div>
          )}
        </div>
      </motion.button>
    </div>
  )
}