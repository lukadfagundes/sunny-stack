'use client'
import { useState, useEffect } from 'react'
import { FileText, GitBranch, Clock, CheckCircle } from 'lucide-react'

interface ProjectContextProps {
  project: string
}

export default function ProjectContext({ project }: ProjectContextProps) {
  const [todos, setTodos] = useState<any[]>([])
  const [recentFiles, setRecentFiles] = useState<string[]>([])
  
  useEffect(() => {
    console.log('📋 [PROJECT_CONTEXT] Loading context for:', project)
    
    // Mock data - in real app, fetch from backend
    const mockTodos = {
      navigator: [
        { id: 1, text: 'Complete Node.js conversion', status: 'in-progress' },
        { id: 2, text: 'Implement WebSocket connections', status: 'pending' },
        { id: 3, text: 'Setup monitoring dashboard', status: 'pending' }
      ],
      rinoa: [
        { id: 1, text: 'Define system architecture', status: 'pending' },
        { id: 2, text: 'Create user stories', status: 'pending' }
      ],
      onepiece: [
        { id: 1, text: 'Character creation system', status: 'concept' },
        { id: 2, text: 'World map design', status: 'concept' }
      ]
    }
    
    const mockFiles = {
      navigator: [
        '/src/index.js',
        '/src/services/equipment.js',
        '/src/api/routes.js'
      ],
      rinoa: [
        '/docs/architecture.md',
        '/docs/requirements.md'
      ],
      onepiece: [
        '/concepts/gameplay.md',
        '/concepts/characters.md'
      ]
    }
    
    setTodos(mockTodos[project as keyof typeof mockTodos] || [])
    setRecentFiles(mockFiles[project as keyof typeof mockFiles] || [])
  }, [project])
  
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'completed': return 'text-green-400'
      case 'in-progress': return 'text-yellow-400'
      case 'pending': return 'text-gray-400'
      case 'concept': return 'text-purple-400'
      default: return 'text-gray-400'
    }
  }
  
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
          <CheckCircle className="w-5 h-5 text-purple-400" />
          <span>Active Todos</span>
        </h3>
        <div className="space-y-2">
          {todos.map(todo => (
            <div key={todo.id} className="bg-gray-700 rounded-lg p-3">
              <div className="flex items-start space-x-2">
                <div className={`w-2 h-2 rounded-full mt-1.5 ${
                  todo.status === 'in-progress' ? 'bg-yellow-400 animate-pulse' :
                  todo.status === 'completed' ? 'bg-green-400' :
                  'bg-gray-500'
                }`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-200">{todo.text}</p>
                  <span className={`text-xs ${getStatusColor(todo.status)}`}>
                    {todo.status}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
          <FileText className="w-5 h-5 text-purple-400" />
          <span>Recent Files</span>
        </h3>
        <div className="space-y-1">
          {recentFiles.map((file, index) => (
            <div key={index} className="bg-gray-700 rounded px-3 py-2 text-sm text-gray-300 hover:bg-gray-600 cursor-pointer transition-colors">
              {file}
            </div>
          ))}
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-bold mb-3 flex items-center space-x-2">
          <GitBranch className="w-5 h-5 text-purple-400" />
          <span>Git Status</span>
        </h3>
        <div className="bg-gray-700 rounded-lg p-3 space-y-1 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Branch:</span>
            <span className="text-green-400">main</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Changes:</span>
            <span className="text-yellow-400">3 modified</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Last commit:</span>
            <span className="text-gray-300">2 hours ago</span>
          </div>
        </div>
      </div>
    </div>
  )
}