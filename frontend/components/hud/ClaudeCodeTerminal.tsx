'use client'
import { useState, useEffect, useRef } from 'react'
import { Terminal, Send, ChevronRight, Circle, Square } from 'lucide-react'

interface ClaudeCodeTerminalProps {
  project: string
}

interface LogEntry {
  timestamp: string
  level: 'info' | 'success' | 'warning' | 'error' | 'command'
  message: string
}

export default function ClaudeCodeTerminal({ project }: ClaudeCodeTerminalProps) {
  const [input, setInput] = useState('')
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [commandHistory, setCommandHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  const terminalRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  
  useEffect(() => {
    console.log('🔧 [TERMINAL] Initialized for project:', project)
    addLog('info', `Terminal connected to project: ${project}`)
    addLog('info', 'Ready for Claude Code commands')
  }, [project])
  
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight
    }
  }, [logs])
  
  const addLog = (level: LogEntry['level'], message: string) => {
    const timestamp = new Date().toLocaleTimeString('en-US', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    })
    setLogs(prev => [...prev, { timestamp, level, message }])
  }
  
  const handleSubmit = async () => {
    if (!input.trim() || isProcessing) return
    
    const command = input.trim()
    addLog('command', command)
    setCommandHistory(prev => [...prev, command])
    setHistoryIndex(-1)
    setInput('')
    setIsProcessing(true)
    
    try {
      console.log('📊 [TERMINAL] Executing:', command)
      
      // Simulate Claude Code processing
      setTimeout(() => {
        addLog('info', 'Analyzing request...')
        setTimeout(() => {
          addLog('success', 'Request parsed successfully')
          addLog('info', 'Generating implementation plan...')
          setTimeout(() => {
            addLog('info', 'Files to be modified:')
            addLog('info', '  • /src/components/Dashboard.tsx')
            addLog('info', '  • /src/api/routes.ts')
            addLog('info', '  • /src/utils/helpers.ts')
            addLog('success', 'Ready to implement. Type "proceed" to continue.')
            setIsProcessing(false)
          }, 800)
        }, 600)
      }, 400)
      
    } catch (error) {
      console.error('🚨 [TERMINAL] Error:', error)
      addLog('error', `Error: ${error}`)
      setIsProcessing(false)
    }
  }
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSubmit()
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1
        setHistoryIndex(newIndex)
        setInput(commandHistory[commandHistory.length - 1 - newIndex])
      } else if (historyIndex === 0) {
        setHistoryIndex(-1)
        setInput('')
      }
    }
  }
  
  const getLevelColor = (level: LogEntry['level']) => {
    switch(level) {
      case 'success': return 'text-[#3fb950]'
      case 'error': return 'text-[#f85149]'
      case 'warning': return 'text-[#d29922]'
      case 'command': return 'text-[#58a6ff]'
      default: return 'text-[#8b949e]'
    }
  }
  
  const getLevelIcon = (level: LogEntry['level']) => {
    switch(level) {
      case 'success': return '✓'
      case 'error': return '✗'
      case 'warning': return '!'
      case 'command': return '>'
      default: return '•'
    }
  }
  
  return (
    <div className="h-full flex flex-col bg-[#0d1117]">
      {/* Terminal header */}
      <div className="bg-[#161b22] border-b border-[#30363d] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-[#8b949e]" />
          <span className="text-sm text-[#f0f6fc] font-medium">Terminal</span>
          <span className="text-xs text-[#8b949e]">- Claude Code</span>
        </div>
        <div className="flex items-center space-x-2">
          {isProcessing ? (
            <Circle className="w-2 h-2 text-[#d29922] fill-current animate-pulse" />
          ) : (
            <Circle className="w-2 h-2 text-[#3fb950] fill-current" />
          )}
          <button className="text-[#8b949e] hover:text-[#f0f6fc] transition-colors">
            <Square className="w-3 h-3" />
          </button>
        </div>
      </div>
      
      {/* Terminal output */}
      <div 
        ref={terminalRef}
        className="flex-1 overflow-y-auto p-3 font-mono text-xs bg-[#0d1117]"
      >
        {logs.map((log, index) => (
          <div key={index} className="flex items-start space-x-2 py-0.5 hover:bg-[#161b22] px-2 -mx-2 rounded">
            <span className="text-[#484f58] select-none">{log.timestamp}</span>
            <span className={`${getLevelColor(log.level)} select-none`}>
              {getLevelIcon(log.level)}
            </span>
            <span className={getLevelColor(log.level)}>{log.message}</span>
          </div>
        ))}
        {isProcessing && (
          <div className="flex items-center space-x-2 py-0.5 px-2 -mx-2">
            <span className="text-[#484f58] select-none">
              {new Date().toLocaleTimeString('en-US', { 
                hour12: false, 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit' 
              })}
            </span>
            <span className="text-[#d29922] animate-pulse">◌</span>
            <span className="text-[#8b949e]">Processing...</span>
          </div>
        )}
      </div>
      
      {/* Terminal input */}
      <div className="bg-[#161b22] border-t border-[#30363d] px-3 py-2">
        <div className="flex items-center space-x-2">
          <ChevronRight className="w-4 h-4 text-[#3fb950]" />
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Enter command..."
            className="flex-1 bg-transparent text-[#f0f6fc] placeholder-[#484f58] outline-none font-mono text-sm"
            disabled={isProcessing}
          />
        </div>
      </div>
    </div>
  )
}