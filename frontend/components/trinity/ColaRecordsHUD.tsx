'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'

interface Project {
  id: string
  name: string
  icon: string
  status: 'active' | 'planning' | 'concept'
  description: string
  color: string
}

interface ColaRecordsHUDProps {
  onProjectSwitch: (projectId: string) => void
  currentProject: string | null
}

export default function ColaRecordsHUD({ onProjectSwitch, currentProject }: ColaRecordsHUDProps) {
  const { isAuthenticated } = useAuth()
  const [isExpanded, setIsExpanded] = useState(false)
  const [logs, setLogs] = useState<string[]>([])
  const [emergencyPrompt, setEmergencyPrompt] = useState('')

  const projects: Project[] = [
    {
      id: 'navigator-helm',
      name: "Navigator's Helm",
      icon: '⚓',
      status: 'active',
      description: 'Industrial Equipment Intelligence',
      color: 'from-blue-500 to-indigo-600'
    },
    {
      id: 'rinoa',
      name: 'Rinoa',
      icon: '🌟',
      status: 'planning',
      description: 'Single-User Equipment Platform',
      color: 'from-purple-500 to-pink-600'
    },
    {
      id: 'one-piece-dnd',
      name: 'One Piece D&D',
      icon: '🏴‍☠️',
      status: 'concept',
      description: 'Gaming/Entertainment Project',
      color: 'from-orange-500 to-red-600'
    }
  ]

  // Simulate real-time logs
  useEffect(() => {
    if (currentProject) {
      const interval = setInterval(() => {
        const timestamp = new Date().toLocaleTimeString()
        const sampleLogs = [
          `[${timestamp}] 🔧 System check completed`,
          `[${timestamp}] 📊 Metrics updated`,
          `[${timestamp}] ✅ Health check passed`,
          `[${timestamp}] 🌐 API request processed`
        ]
        setLogs(prev => [...prev.slice(-9), sampleLogs[Math.floor(Math.random() * sampleLogs.length)]])
      }, 5000)
      return () => clearInterval(interval)
    }
  }, [currentProject])

  const handleEmergencySubmit = () => {
    if (emergencyPrompt.trim()) {
      console.log('🚨 Emergency prompt:', emergencyPrompt)
      setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] 🚨 EMERGENCY: ${emergencyPrompt}`])
      setEmergencyPrompt('')
      // Here you would send this to Claude Code or backend
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* HUD Control Bar */}
      <div className="bg-gradient-to-r from-gray-900 to-black text-white p-2 border-t border-yellow-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="flex items-center gap-2 px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors"
            >
              <span className="text-xl">📀</span>
              <span className="font-bold">Cola Records HUD</span>
              <span className="text-sm">{isExpanded ? '▼' : '▲'}</span>
            </button>

            {/* Project Switcher */}
            <div className="flex items-center gap-2">
              <span className="text-sm opacity-75">Active Project:</span>
              <select
                value={currentProject || ''}
                onChange={(e) => onProjectSwitch(e.target.value)}
                className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 focus:border-yellow-500 focus:outline-none"
              >
                <option value="">Select Project</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.icon} {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Project Status */}
            {currentProject && (
              <div className="flex items-center gap-2">
                {projects.find(p => p.id === currentProject) && (
                  <>
                    <span className="text-2xl">
                      {projects.find(p => p.id === currentProject)?.icon}
                    </span>
                    <span className="font-medium">
                      {projects.find(p => p.id === currentProject)?.name}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-xs ${
                      projects.find(p => p.id === currentProject)?.status === 'active' 
                        ? 'bg-green-600' 
                        : projects.find(p => p.id === currentProject)?.status === 'planning'
                        ? 'bg-yellow-600'
                        : 'bg-gray-600'
                    }`}>
                      {projects.find(p => p.id === currentProject)?.status}
                    </span>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Emergency Prompt */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={emergencyPrompt}
              onChange={(e) => setEmergencyPrompt(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleEmergencySubmit()}
              placeholder="Emergency prompt for Claude..."
              className="bg-gray-800 text-white px-3 py-1 rounded border border-gray-600 focus:border-red-500 focus:outline-none w-64"
            />
            <button
              onClick={handleEmergencySubmit}
              className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded transition-colors"
            >
              🚨 Send
            </button>
          </div>
        </div>
      </div>

      {/* Expanded HUD Panel */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="bg-gray-900 text-white border-t border-yellow-500 overflow-hidden"
          >
            <div className="p-4">
              <div className="grid grid-cols-3 gap-4">
                {/* Projects Overview */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                    <span>📁</span> Projects
                  </h3>
                  <div className="space-y-2">
                    {projects.map(project => (
                      <motion.div
                        key={project.id}
                        whileHover={{ scale: 1.02 }}
                        onClick={() => onProjectSwitch(project.id)}
                        className={`p-3 rounded-lg cursor-pointer transition-all ${
                          currentProject === project.id 
                            ? `bg-gradient-to-r ${project.color} text-white` 
                            : 'bg-gray-700 hover:bg-gray-600'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{project.icon}</span>
                            <div>
                              <div className="font-medium">{project.name}</div>
                              <div className="text-xs opacity-75">{project.description}</div>
                            </div>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-xs ${
                            project.status === 'active' 
                              ? 'bg-green-600' 
                              : project.status === 'planning'
                              ? 'bg-yellow-600'
                              : 'bg-gray-600'
                          }`}>
                            {project.status}
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Real-time Logs */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                    <span>📜</span> Live Logs
                  </h3>
                  <div className="bg-black rounded p-2 h-48 overflow-y-auto font-mono text-xs">
                    {logs.length === 0 ? (
                      <div className="text-gray-500">No logs yet. Select a project to start monitoring.</div>
                    ) : (
                      logs.map((log, index) => (
                        <div key={index} className="text-green-400 mb-1">
                          {log}
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="text-yellow-400 font-bold mb-3 flex items-center gap-2">
                    <span>⚡</span> Quick Actions
                  </h3>
                  <div className="space-y-2">
                    <button className="w-full px-3 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors text-left">
                      🔄 Restart Services
                    </button>
                    <button className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 rounded transition-colors text-left">
                      📊 View Metrics
                    </button>
                    <button className="w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 rounded transition-colors text-left">
                      🧪 Run Tests
                    </button>
                    <button className="w-full px-3 py-2 bg-yellow-600 hover:bg-yellow-700 rounded transition-colors text-left">
                      📝 Generate Report
                    </button>
                    <button className="w-full px-3 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors text-left">
                      🚨 Emergency Stop
                    </button>
                  </div>
                </div>
              </div>

              {/* Project-specific content */}
              {currentProject === 'navigator-helm' && (
                <div className="mt-4 p-4 bg-gray-800 rounded-lg">
                  <h3 className="text-yellow-400 font-bold mb-2">Navigator's Helm Controls</h3>
                  <div className="grid grid-cols-4 gap-2">
                    <button className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                      ⚓ Stilltide Dashboard
                    </button>
                    <button className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 rounded text-sm">
                      🌊 Tempest Predictions
                    </button>
                    <button className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded text-sm">
                      🔥 Firebird Alerts
                    </button>
                    <button className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm">
                      📈 Equipment Status
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}