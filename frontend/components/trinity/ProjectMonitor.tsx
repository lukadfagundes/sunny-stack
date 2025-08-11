'use client'
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useProjectMetrics } from '@/hooks/useProjectMetrics'
import { 
  Activity, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Package,
  GitBranch,
  FileText,
  Zap
} from 'lucide-react'

interface ProjectMonitorProps {
  activeProject: string | null
  setActiveProject: (id: string | null) => void
}

export default function ProjectMonitor({ activeProject, setActiveProject }: ProjectMonitorProps) {
  const { projects, metrics, realTimeUpdates } = useProjectMetrics()
  const [selectedTab, setSelectedTab] = useState<'overview' | 'metrics' | 'timeline'>('overview')
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100'
      case 'pending': return 'text-yellow-600 bg-yellow-100'
      case 'completed': return 'text-blue-600 bg-blue-100'
      case 'error': return 'text-red-600 bg-red-100'
      default: return 'text-gray-600 bg-gray-100'
    }
  }
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />
      case 'pending': return <Clock className="w-4 h-4" />
      case 'completed': return <CheckCircle2 className="w-4 h-4" />
      case 'error': return <AlertCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }
  
  return (
    <div className="bg-white rounded-xl shadow-xl h-full flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-4">
        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5" />
          Project Monitor
        </h3>
        <p className="text-blue-100 text-sm mt-1">Real-time project tracking & metrics</p>
      </div>
      
      <div className="flex border-b border-gray-200 bg-gray-50">
        {['overview', 'metrics', 'timeline'].map((tab) => (
          <button
            key={tab}
            onClick={() => setSelectedTab(tab as any)}
            className={`flex-1 px-4 py-3 text-sm font-medium capitalize transition-all ${
              selectedTab === tab
                ? 'text-blue-600 border-b-2 border-blue-600 bg-white'
                : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <AnimatePresence mode="wait">
          {selectedTab === 'overview' && (
            <motion.div
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {projects.map((project) => (
                <motion.div
                  key={project.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  onClick={() => setActiveProject(project.id)}
                  className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                    activeProject === project.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-md'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-900">{project.name}</h4>
                      <p className="text-sm text-gray-600 mt-1">{project.client}</p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(project.status)}`}>
                      {getStatusIcon(project.status)}
                      {project.status}
                    </div>
                  </div>
                  
                  <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                    <div className="flex items-center gap-1 text-gray-600">
                      <GitBranch className="w-3 h-3" />
                      {project.commits || 0} commits
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <FileText className="w-3 h-3" />
                      {project.files || 0} files
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <Clock className="w-3 h-3" />
                      {project.duration || '0h'}
                    </div>
                  </div>
                  
                  {project.progress !== undefined && (
                    <div className="mt-3">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{project.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${project.progress}%` }}
                          transition={{ duration: 0.5 }}
                          className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full"
                        />
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </motion.div>
          )}
          
          {selectedTab === 'metrics' && (
            <motion.div
              key="metrics"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-2 gap-4"
            >
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-green-900">Build Success</span>
                  <CheckCircle2 className="w-4 h-4 text-green-600" />
                </div>
                <div className="text-2xl font-bold text-green-600">{metrics.buildSuccess}%</div>
                <div className="text-xs text-green-700 mt-1">Last 24 hours</div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-blue-900">Active Tasks</span>
                  <Activity className="w-4 h-4 text-blue-600" />
                </div>
                <div className="text-2xl font-bold text-blue-600">{metrics.activeTasks}</div>
                <div className="text-xs text-blue-700 mt-1">In progress</div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-purple-900">Code Quality</span>
                  <Zap className="w-4 h-4 text-purple-600" />
                </div>
                <div className="text-2xl font-bold text-purple-600">{metrics.codeQuality}/10</div>
                <div className="text-xs text-purple-700 mt-1">Average score</div>
              </div>
              
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-orange-900">Velocity</span>
                  <TrendingUp className="w-4 h-4 text-orange-600" />
                </div>
                <div className="text-2xl font-bold text-orange-600">{metrics.velocity}x</div>
                <div className="text-xs text-orange-700 mt-1">vs. traditional</div>
              </div>
            </motion.div>
          )}
          
          {selectedTab === 'timeline' && (
            <motion.div
              key="timeline"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {realTimeUpdates.map((update, index) => (
                <motion.div
                  key={update.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                      update.type === 'success' ? 'bg-green-100 text-green-600' :
                      update.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                      update.type === 'error' ? 'bg-red-100 text-red-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {update.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> :
                       update.type === 'warning' ? <AlertCircle className="w-4 h-4" /> :
                       update.type === 'error' ? <AlertCircle className="w-4 h-4" /> :
                       <Activity className="w-4 h-4" />}
                    </div>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-800">{update.message}</p>
                    <p className="text-xs text-gray-500 mt-1">{update.timestamp}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}