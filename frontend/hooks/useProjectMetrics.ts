'use client'
import { useState, useEffect } from 'react'
import { io, Socket } from 'socket.io-client'

interface Project {
  id: string
  name: string
  client: string
  status: 'active' | 'pending' | 'completed' | 'error'
  progress: number
  commits: number
  files: number
  duration: string
}

interface Metrics {
  buildSuccess: number
  activeTasks: number
  codeQuality: number
  velocity: number
}

interface RealTimeUpdate {
  id: string
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  timestamp: string
}

export function useProjectMetrics() {
  const [projects, setProjects] = useState<Project[]>([
    {
      id: 'nav-core-001',
      name: 'NavigatorCore Migration',
      client: 'Internal - First Client',
      status: 'active',
      progress: 45,
      commits: 23,
      files: 156,
      duration: '12h'
    }
  ])
  
  const [metrics, setMetrics] = useState<Metrics>({
    buildSuccess: 98,
    activeTasks: 7,
    codeQuality: 9.2,
    velocity: 10
  })
  
  const [realTimeUpdates, setRealTimeUpdates] = useState<RealTimeUpdate[]>([])
  const [socket, setSocket] = useState<Socket | null>(null)
  
  useEffect(() => {
    const socketInstance = io(process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'http://localhost:8000', {
      transports: ['websocket']
    })
    
    socketInstance.on('connect', () => {
      console.log('Connected to real-time updates')
    })
    
    socketInstance.on('project-update', (data: Partial<Project>) => {
      setProjects(prev => prev.map(p => 
        p.id === data.id ? { ...p, ...data } : p
      ))
    })
    
    socketInstance.on('metrics-update', (data: Partial<Metrics>) => {
      setMetrics(prev => ({ ...prev, ...data }))
    })
    
    socketInstance.on('real-time-update', (update: RealTimeUpdate) => {
      setRealTimeUpdates(prev => [
        {
          ...update,
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        },
        ...prev
      ].slice(0, 50))
    })
    
    setSocket(socketInstance)
    
    return () => {
      socketInstance.disconnect()
    }
  }, [])
  
  useEffect(() => {
    const mockUpdates = setInterval(() => {
      const updates: RealTimeUpdate[] = [
        { 
          id: Date.now().toString(), 
          type: 'success', 
          message: 'Build completed successfully',
          timestamp: ''
        },
        { 
          id: Date.now().toString(), 
          type: 'info', 
          message: 'Running tests...',
          timestamp: ''
        },
        { 
          id: Date.now().toString(), 
          type: 'warning', 
          message: 'Deprecation warning in module',
          timestamp: ''
        },
        { 
          id: Date.now().toString(), 
          type: 'success', 
          message: 'All tests passed',
          timestamp: ''
        }
      ]
      
      const randomUpdate = updates[Math.floor(Math.random() * updates.length)]
      
      setRealTimeUpdates(prev => [
        {
          ...randomUpdate,
          id: Date.now().toString(),
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          })
        },
        ...prev
      ].slice(0, 50))
      
      setProjects(prev => prev.map(p => {
        if (p.status === 'active' && p.progress < 100) {
          return { ...p, progress: Math.min(100, p.progress + Math.random() * 5) }
        }
        return p
      }))
      
    }, 5000)
    
    return () => clearInterval(mockUpdates)
  }, [])
  
  return {
    projects,
    metrics,
    realTimeUpdates
  }
}