'use client'
import { useEffect, useState } from 'react'
import { Activity, TrendingUp, Clock, Zap } from 'lucide-react'

interface ProjectMetricsProps {
  project: string
}

export default function ProjectMetrics({ project }: ProjectMetricsProps) {
  const [metrics, setMetrics] = useState({
    tasksCompleted: 0,
    activeTime: '0h',
    linesWritten: 0,
    efficiency: 0
  })
  
  useEffect(() => {
    console.log('📊 [METRICS] Loading metrics for:', project)
    
    // Mock metrics data
    const projectMetrics = {
      navigator: {
        tasksCompleted: 12,
        activeTime: '24h',
        linesWritten: 3450,
        efficiency: 87
      },
      rinoa: {
        tasksCompleted: 3,
        activeTime: '6h',
        linesWritten: 450,
        efficiency: 72
      },
      onepiece: {
        tasksCompleted: 1,
        activeTime: '2h',
        linesWritten: 120,
        efficiency: 65
      }
    }
    
    setMetrics(projectMetrics[project as keyof typeof projectMetrics] || {
      tasksCompleted: 0,
      activeTime: '0h',
      linesWritten: 0,
      efficiency: 0
    })
  }, [project])
  
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
        <Activity className="w-5 h-5 text-purple-400" />
        <span>Project Metrics</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Tasks Done</span>
          </div>
          <div className="text-2xl font-bold text-green-400">
            {metrics.tasksCompleted}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Clock className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Active Time</span>
          </div>
          <div className="text-2xl font-bold text-blue-400">
            {metrics.activeTime}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Zap className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">Lines Written</span>
          </div>
          <div className="text-2xl font-bold text-yellow-400">
            {metrics.linesWritten.toLocaleString()}
          </div>
        </div>
        
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="flex items-center space-x-2 mb-1">
            <Activity className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Efficiency</span>
          </div>
          <div className="text-2xl font-bold text-purple-400">
            {metrics.efficiency}%
          </div>
        </div>
      </div>
      
      <div className="mt-3 bg-gray-700 rounded-lg p-3">
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-gray-400">Overall Progress</span>
          <span className="text-xs text-purple-400">{metrics.efficiency}%</span>
        </div>
        <div className="w-full bg-gray-600 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-purple-500 to-purple-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${metrics.efficiency}%` }}
          />
        </div>
      </div>
    </div>
  )
}