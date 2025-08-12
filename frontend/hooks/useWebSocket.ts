import { useEffect, useState, useCallback } from 'react'
import { wsManager } from '@/lib/websocket-manager'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])

  useEffect(() => {
    // Initialize WebSocket connection
    const socket = wsManager.getSocket()
    setIsConnected(wsManager.isConnected())

    const handleConnect = () => {
      console.log('✅ WebSocket connected')
      setIsConnected(true)
    }

    const handleDisconnect = () => {
      console.log('❌ WebSocket disconnected')
      setIsConnected(false)
    }

    const handleConnectionStatus = (data: any) => {
      console.log('📡 Connection status:', data)
    }

    const handleClaudeProgress = (data: any) => {
      setMessages(prev => [...prev, {
        type: 'claude_code_progress',
        data,
        timestamp: new Date().toISOString()
      }])
    }

    const handleClaudeStatus = (data: any) => {
      setMessages(prev => [...prev, {
        type: 'claude_code_status',
        data,
        timestamp: new Date().toISOString()
      }])
    }

    const handleProjectUpdate = (data: any) => {
      setMessages(prev => [...prev, {
        type: 'project_update',
        data,
        timestamp: new Date().toISOString()
      }])
    }

    // Register event listeners
    wsManager.on('ws:connected', handleConnect)
    wsManager.on('ws:disconnected', handleDisconnect)
    wsManager.on('connection_status', handleConnectionStatus)
    wsManager.on('claude_code_progress', handleClaudeProgress)
    wsManager.on('claude_code_status', handleClaudeStatus)
    wsManager.on('project_update', handleProjectUpdate)
    
    return () => {
      // Cleanup event listeners
      wsManager.off('ws:connected', handleConnect)
      wsManager.off('ws:disconnected', handleDisconnect)
      wsManager.off('connection_status', handleConnectionStatus)
      wsManager.off('claude_code_progress', handleClaudeProgress)
      wsManager.off('claude_code_status', handleClaudeStatus)
      wsManager.off('project_update', handleProjectUpdate)
    }
  }, [])

  const sendMessage = useCallback((event: string, data: any) => {
    wsManager.send(event, data)
  }, [])

  const executeClaudeCode = useCallback((prompt: string, projectId: string = 'default') => {
    sendMessage('claude_code_execute', {
      prompt,
      project_id: projectId
    })
  }, [sendMessage])

  const clearMessages = useCallback(() => {
    setMessages([])
  }, [])

  return {
    socket: wsManager.getSocket(),
    isConnected,
    messages,
    sendMessage,
    executeClaudeCode,
    clearMessages
  }
}