import { useEffect, useState, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface WebSocketMessage {
  type: string
  data: any
  timestamp: string
}

export function useWebSocket() {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [messages, setMessages] = useState<WebSocketMessage[]>([])
  const socketRef = useRef<Socket | null>(null)

  useEffect(() => {
    // Connect to backend WebSocket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    const newSocket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true
    })

    newSocket.on('connect', () => {
      console.log('✅ WebSocket connected:', newSocket.id)
      setIsConnected(true)
    })

    newSocket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      setIsConnected(false)
    })

    newSocket.on('connection_status', (data) => {
      console.log('📡 Connection status:', data)
    })

    newSocket.on('claude_code_progress', (data) => {
      setMessages(prev => [...prev, {
        type: 'claude_code_progress',
        data,
        timestamp: new Date().toISOString()
      }])
    })

    newSocket.on('claude_code_status', (data) => {
      setMessages(prev => [...prev, {
        type: 'claude_code_status',
        data,
        timestamp: new Date().toISOString()
      }])
    })

    newSocket.on('project_update', (data) => {
      setMessages(prev => [...prev, {
        type: 'project_update',
        data,
        timestamp: new Date().toISOString()
      }])
    })

    socketRef.current = newSocket
    setSocket(newSocket)
    
    return () => {
      newSocket.close()
    }
  }, [])

  const sendMessage = useCallback((event: string, data: any) => {
    if (socketRef.current && isConnected) {
      socketRef.current.emit(event, data)
    }
  }, [isConnected])

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
    socket,
    isConnected,
    messages,
    sendMessage,
    executeClaudeCode,
    clearMessages
  }
}