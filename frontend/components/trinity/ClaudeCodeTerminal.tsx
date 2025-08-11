'use client'
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useWebSocket } from '@/hooks/useWebSocket'
import { Play, Square, FileText, Wifi, WifiOff, Trash2 } from 'lucide-react'

interface ClaudeCodeTerminalProps {
  projectId: string | null
}

export default function ClaudeCodeTerminal({ projectId }: ClaudeCodeTerminalProps) {
  const [prompt, setPrompt] = useState('')
  const { isConnected, messages, executeClaudeCode, clearMessages } = useWebSocket()
  const [isRunning, setIsRunning] = useState(false)
  const outputRef = useRef<HTMLDivElement>(null)
  
  // Auto-scroll to bottom
  useEffect(() => {
    if (outputRef.current) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight
    }
  }, [messages])

  // Listen for prompt from Claude Web panel
  useEffect(() => {
    const handleClaudeCodePrompt = (event: CustomEvent) => {
      setPrompt(event.detail.prompt)
    }
    
    window.addEventListener('claude-code-prompt', handleClaudeCodePrompt as EventListener)
    return () => window.removeEventListener('claude-code-prompt', handleClaudeCodePrompt as EventListener)
  }, [])

  const handleExecute = () => {
    if (!prompt.trim() || !isConnected || isRunning) return
    
    setIsRunning(true)
    executeClaudeCode(prompt, projectId || 'default')
    
    // Auto-stop after completion
    setTimeout(() => {
      const hasComplete = messages.some(m => 
        m.type === 'claude_code_progress' && 
        m.data.stage === 'complete'
      )
      if (hasComplete) {
        setIsRunning(false)
      }
    }, 1000)
  }

  // Stop running when build completes
  useEffect(() => {
    const completeMessage = messages.find(m => 
      m.type === 'claude_code_progress' && 
      m.data.stage === 'complete'
    )
    if (completeMessage) {
      setIsRunning(false)
    }
  }, [messages])

  const getMessageColor = (message: any) => {
    if (message.data.stage === 'complete') return 'text-green-400'
    if (message.data.stage === 'error') return 'text-red-400'
    if (message.data.progress === 100) return 'text-blue-400'
    return 'text-yellow-400'
  }

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="bg-gray-900 rounded-xl shadow-xl h-full flex flex-col text-green-400 overflow-hidden"
    >
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              ⚡ Claude Code Terminal
            </h3>
            <p className="text-green-100 text-sm mt-1">Execute development prompts</p>
          </div>
          <div className="flex items-center gap-3">
            {projectId && (
              <span className="text-xs text-green-100 bg-green-700 px-2 py-1 rounded">
                {projectId}
              </span>
            )}
            {isConnected ? (
              <div className="flex items-center gap-1 text-green-100 text-xs">
                <Wifi size={14} />
                Live
              </div>
            ) : (
              <div className="flex items-center gap-1 text-red-300 text-xs">
                <WifiOff size={14} />
                Offline
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        {/* Terminal Output */}
        <div 
          ref={outputRef}
          className="flex-1 bg-black p-4 overflow-y-auto font-mono text-sm"
        >
          {messages.length === 0 ? (
            <div className="text-gray-500">
              <div>$ Ready for Claude Code execution...</div>
              {!isConnected && (
                <div className="text-orange-400 mt-2">
                  ⚠ WebSocket disconnected - check backend server
                </div>
              )}
            </div>
          ) : (
            messages.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="mb-1"
              >
                {message.type === 'claude_code_progress' && (
                  <div className={getMessageColor(message)}>
                    <span className="text-gray-600">
                      [{new Date(message.timestamp).toLocaleTimeString()}]
                    </span>{' '}
                    {message.data.message}
                    {message.data.progress && (
                      <span className="ml-2 text-gray-500">
                        [{message.data.progress}%]
                      </span>
                    )}
                  </div>
                )}
                {message.type === 'claude_code_status' && (
                  <div className="text-cyan-400">
                    <span className="text-gray-600">
                      [{new Date(message.timestamp).toLocaleTimeString()}]
                    </span>{' '}
                    📦 {message.data.message}
                  </div>
                )}
              </motion.div>
            ))
          )}
          {isRunning && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-green-400 mt-2"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="w-3 h-3 border-2 border-green-400 border-t-transparent rounded-full"
              />
              <span className="animate-pulse">Processing...</span>
            </motion.div>
          )}
        </div>

        {/* Prompt Input */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-green-400 flex items-center gap-2">
              <FileText size={16} /> Comprehensive Prompt
            </h4>
            {messages.length > 0 && (
              <button
                onClick={clearMessages}
                className="text-xs text-gray-400 hover:text-gray-300 flex items-center gap-1"
              >
                <Trash2 size={12} />
                Clear
              </button>
            )}
          </div>
          
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Paste Claude Code prompt here or receive from Claude Web Assistant..."
            className="w-full h-24 p-3 bg-gray-900 text-green-400 border border-gray-600 rounded-lg resize-none font-mono text-xs focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none placeholder-gray-600"
            disabled={isRunning}
          />
          
          <div className="flex gap-2 mt-3">
            <button
              onClick={handleExecute}
              disabled={isRunning || !prompt.trim() || !isConnected}
              className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-lg hover:from-green-700 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Building...
                </>
              ) : (
                <>
                  <Play size={16} /> Execute Build
                </>
              )}
            </button>
            
            {isRunning && (
              <button
                onClick={() => setIsRunning(false)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
              >
                <Square size={16} /> Stop
              </button>
            )}
          </div>
          
          {!isConnected && (
            <div className="mt-2 text-xs text-orange-400">
              ⚠ WebSocket not connected. Restart backend with: ./venv/Scripts/python -m uvicorn app.main:asgi_app --reload
            </div>
          )}
        </div>
      </div>
    </motion.div>
  )
}