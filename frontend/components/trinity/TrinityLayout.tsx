'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useSessionManager } from '@/hooks/useSessionManager'
import { useAuth } from '@/contexts/AuthContext'
import UserMenu from '@/components/auth/UserMenu'
import ClaudeWebPanel from './ClaudeWebPanel'
import ProjectMonitor from './ProjectMonitor'
import ClaudeCodeTerminal from './ClaudeCodeTerminal'

export default function TrinityLayout() {
  const { session, startSession, endSession } = useSessionManager()
  const { isAuthenticated } = useAuth()
  const [activeProject, setActiveProject] = useState<string | null>(null)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 to-orange-50">
      <header className="bg-gradient-to-r from-yellow-400 to-orange-400 p-4 shadow-lg">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-amber-900 flex items-center gap-2">
            <span className="text-3xl">☀️</span> Sunny Trinity
          </h1>
          <div className="flex items-center gap-4">
            {/* User Menu - Shows when authenticated */}
            {isAuthenticated && <UserMenu />}
            
            {/* Session Management */}
            {(session && session.active) ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center gap-2 text-amber-900"
              >
                <span className="text-lg">🌤️ Development Session Active</span>
                <span className="px-3 py-1 bg-amber-100 rounded-full text-sm">
                  {session.duration || '00:00:00'}
                </span>
                <button 
                  onClick={endSession}
                  className="px-4 py-2 bg-amber-900 text-yellow-100 rounded-lg hover:bg-amber-800 transition-colors"
                >
                  End Session
                </button>
              </motion.div>
            ) : (
              <button 
                onClick={() => startSession()}
                className="px-6 py-2 bg-amber-900 text-yellow-100 rounded-lg hover:bg-amber-800 transition-colors shadow-md"
              >
                Start Development Session
              </button>
            )}
          </div>
        </div>
      </header>
      
      {/* Authentication Status Bar */}
      {isAuthenticated ? (
        <div className="bg-green-600 text-white px-4 py-2 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <span className="text-lg">🔐</span>
            <span className="font-medium">Secure Session Active</span>
            <span className="text-sm opacity-90">| JWT Authentication Enabled</span>
          </div>
        </div>
      ) : (
        <div className="bg-yellow-600 text-white px-4 py-2 shadow-lg">
          <div className="max-w-7xl mx-auto flex items-center justify-center gap-3">
            <span className="text-lg">⚠️</span>
            <span className="font-medium">Not Authenticated</span>
            <span className="text-sm opacity-90">| Please sign in to access all features</span>
          </div>
        </div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6 h-[calc(100vh-80px)]">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <ClaudeWebPanel />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <ProjectMonitor activeProject={activeProject} setActiveProject={setActiveProject} />
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
        >
          <ClaudeCodeTerminal projectId={activeProject} />
        </motion.div>
      </div>
    </div>
  )
}