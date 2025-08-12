import { io, Socket } from 'socket.io-client'

class WebSocketManager {
  private static instance: WebSocketManager | null = null
  private socket: Socket | null = null
  private isConnecting: boolean = false
  private listeners: Map<string, Set<Function>> = new Map()
  private maxRetries: number = 10
  private retryDelay: number = 2000
  private currentRetries: number = 0
  private backendCheckInterval: NodeJS.Timeout | null = null

  private constructor() {}

  static getInstance(): WebSocketManager {
    if (!WebSocketManager.instance) {
      WebSocketManager.instance = new WebSocketManager()
    }
    return WebSocketManager.instance
  }

  getSocket(): Socket | null {
    if (!this.socket && !this.isConnecting) {
      this.connectWithRetry()
    }
    return this.socket
  }

  private async waitForBackend(): Promise<boolean> {
    console.log('🔧 WebSocket: Checking backend availability...')
    
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    for (let i = 0; i < this.maxRetries; i++) {
      try {
        const response = await fetch(`${backendUrl}/health`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        
        if (response.ok) {
          console.log('✅ WebSocket: Backend is ready')
          return true
        }
      } catch (error) {
        console.log(`⏱️ WebSocket: Backend not ready, retry ${i + 1}/${this.maxRetries}`)
        await new Promise(resolve => setTimeout(resolve, this.retryDelay))
      }
    }
    
    console.error('❌ WebSocket: Backend not available after retries')
    return false
  }

  private async connectWithRetry() {
    if (this.socket?.connected || this.isConnecting) {
      return
    }

    this.isConnecting = true
    
    // First check if backend is available
    const backendReady = await this.waitForBackend()
    
    if (!backendReady) {
      console.error('❌ WebSocket: Cannot connect - backend not available')
      this.isConnecting = false
      // Retry after delay
      setTimeout(() => this.connectWithRetry(), this.retryDelay * 2)
      return
    }

    this.connect()
  }

  private connect() {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'
    
    console.log('🔧 WebSocket: Attempting connection to', socketUrl)
    
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 10000
    })

    this.socket.on('connect', () => {
      console.log('✅ WebSocket connected:', this.socket?.id)
      this.isConnecting = false
      this.currentRetries = 0
      this.emit('ws:connected', { id: this.socket?.id })
    })

    this.socket.on('disconnect', () => {
      console.log('❌ WebSocket disconnected')
      this.emit('ws:disconnected', {})
    })

    this.socket.on('connect_error', (error) => {
      console.error('⚠️ WebSocket connection error:', error.message)
      this.isConnecting = false
      this.currentRetries++
      
      if (this.currentRetries < this.maxRetries) {
        console.log(`🔄 WebSocket: Retry ${this.currentRetries}/${this.maxRetries} in ${this.retryDelay}ms`)
        setTimeout(() => this.connectWithRetry(), this.retryDelay)
      } else {
        console.error('❌ WebSocket: Max retries exceeded')
        this.enableFallbackMode()
      }
    })

    // Forward all events to listeners
    const eventTypes = [
      'connection_status',
      'claude_code_progress',
      'claude_code_status',
      'project_update',
      'project-update',
      'metrics-update',
      'real-time-update'
    ]

    eventTypes.forEach(eventType => {
      this.socket?.on(eventType, (data) => {
        this.emit(eventType, data)
      })
    })
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)?.add(callback)
    
    // If socket exists, also register with socket.io
    if (this.socket && !event.startsWith('ws:')) {
      this.socket.on(event, callback as any)
    }
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback)
    
    // If socket exists, also unregister from socket.io
    if (this.socket && !event.startsWith('ws:')) {
      this.socket.off(event, callback as any)
    }
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data))
  }

  send(event: string, data: any) {
    if (this.socket?.connected) {
      this.socket.emit(event, data)
    } else {
      console.warn('WebSocket not connected, queuing message:', event)
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect()
      this.socket = null
    }
  }

  isConnected(): boolean {
    return this.socket?.connected || false
  }

  private enableFallbackMode(): void {
    console.log('⚡ WebSocket: Enabling fallback mode (polling only)')
    // Emit event to notify components about fallback mode
    this.emit('ws:fallback', { mode: 'polling' })
    // Could implement polling-based updates here if needed
  }
}

export const wsManager = WebSocketManager.getInstance()