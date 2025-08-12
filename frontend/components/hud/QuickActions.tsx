'use client'
import { useState } from 'react'
import { PlayCircle, StopCircle, RefreshCw, GitCommit, AlertTriangle, Save } from 'lucide-react'

interface QuickActionsProps {
  project: string
}

export default function QuickActions({ project }: QuickActionsProps) {
  const [isRunning, setIsRunning] = useState(false)
  
  const handleAction = (action: string) => {
    console.log(`⚡ [QUICK_ACTIONS] Executing: ${action} for project: ${project}`)
    
    switch(action) {
      case 'start':
        setIsRunning(true)
        break
      case 'stop':
        setIsRunning(false)
        break
      case 'restart':
        setIsRunning(false)
        setTimeout(() => setIsRunning(true), 500)
        break
      case 'commit':
        console.log('📝 [QUICK_ACTIONS] Opening commit dialog...')
        break
      case 'emergency':
        console.log('🚨 [QUICK_ACTIONS] EMERGENCY STOP ACTIVATED!')
        setIsRunning(false)
        break
      case 'save':
        console.log('💾 [QUICK_ACTIONS] Saving project state...')
        break
    }
  }
  
  return (
    <div>
      <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
        <PlayCircle className="w-5 h-5 text-purple-400" />
        <span>Quick Actions</span>
      </h3>
      
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleAction(isRunning ? 'stop' : 'start')}
          className={`p-3 rounded-lg transition-all flex flex-col items-center space-y-1 ${
            isRunning 
              ? 'bg-red-900 hover:bg-red-800 text-red-300' 
              : 'bg-green-900 hover:bg-green-800 text-green-300'
          }`}
        >
          {isRunning ? (
            <>
              <StopCircle className="w-6 h-6" />
              <span className="text-xs">Stop</span>
            </>
          ) : (
            <>
              <PlayCircle className="w-6 h-6" />
              <span className="text-xs">Start</span>
            </>
          )}
        </button>
        
        <button
          onClick={() => handleAction('restart')}
          className="bg-blue-900 hover:bg-blue-800 p-3 rounded-lg text-blue-300 transition-all flex flex-col items-center space-y-1"
        >
          <RefreshCw className="w-6 h-6" />
          <span className="text-xs">Restart</span>
        </button>
        
        <button
          onClick={() => handleAction('commit')}
          className="bg-purple-900 hover:bg-purple-800 p-3 rounded-lg text-purple-300 transition-all flex flex-col items-center space-y-1"
        >
          <GitCommit className="w-6 h-6" />
          <span className="text-xs">Commit</span>
        </button>
        
        <button
          onClick={() => handleAction('save')}
          className="bg-gray-700 hover:bg-gray-600 p-3 rounded-lg text-gray-300 transition-all flex flex-col items-center space-y-1"
        >
          <Save className="w-6 h-6" />
          <span className="text-xs">Save</span>
        </button>
      </div>
      
      <button
        onClick={() => handleAction('emergency')}
        className="w-full mt-3 bg-red-600 hover:bg-red-700 p-3 rounded-lg text-white transition-all flex items-center justify-center space-x-2"
      >
        <AlertTriangle className="w-5 h-5" />
        <span className="font-bold">EMERGENCY STOP</span>
      </button>
      
      <div className="mt-3 p-2 bg-gray-700 rounded text-xs text-gray-400">
        <div className="flex justify-between">
          <span>Status:</span>
          <span className={isRunning ? 'text-green-400' : 'text-gray-500'}>
            {isRunning ? 'Running' : 'Stopped'}
          </span>
        </div>
        <div className="flex justify-between mt-1">
          <span>Mode:</span>
          <span className="text-purple-400">Development</span>
        </div>
      </div>
    </div>
  )
}