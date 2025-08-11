'use client'
import { useState, useCallback, useRef } from 'react'

interface OutputLine {
  timestamp: string
  content: string
  type: 'info' | 'error' | 'success' | 'warning'
}

export function useClaudeCode() {
  const [output, setOutput] = useState<OutputLine[]>([])
  const [isRunning, setIsRunning] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  
  const executePrompt = useCallback(async (prompt: string, projectId: string | null) => {
    setIsRunning(true)
    setOutput([])
    
    abortControllerRef.current = new AbortController()
    
    try {
      const response = await fetch('/api/claude-code/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          prompt,
          projectId: projectId || 'default'
        }),
        signal: abortControllerRef.current.signal
      })
      
      if (!response.body) {
        throw new Error('No response body')
      }
      
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n').filter(Boolean)
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.substring(6))
              
              setOutput(prev => [...prev, {
                timestamp: new Date().toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit'
                }),
                content: data.output,
                type: data.type || 'info'
              }])
              
              if (data.completed) {
                setOutput(prev => [...prev, {
                  timestamp: new Date().toLocaleTimeString('en-US', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                  }),
                  content: '✓ Build completed successfully',
                  type: 'success'
                }])
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e)
            }
          }
        }
      }
      
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        setOutput(prev => [...prev, {
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          }),
          content: `Error: ${error.message || 'Unknown error occurred'}`,
          type: 'error'
        }])
      }
    } finally {
      setIsRunning(false)
      abortControllerRef.current = null
    }
  }, [])
  
  const stopExecution = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      
      try {
        await fetch('/api/claude-code/stop', { method: 'POST' })
      } catch (error) {
        console.error('Error stopping execution:', error)
      }
      
      setOutput(prev => [...prev, {
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        }),
        content: '⚠ Execution stopped by user',
        type: 'warning'
      }])
      
      setIsRunning(false)
    }
  }, [])
  
  const clearOutput = useCallback(() => {
    setOutput([])
  }, [])
  
  return {
    output,
    isRunning,
    executePrompt,
    stopExecution,
    clearOutput
  }
}