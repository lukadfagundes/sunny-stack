'use client'
import { useState, useEffect, useCallback } from 'react'

interface Session {
  active: boolean
  startTime: Date | null
  duration: string
  projectId: string | null
  metrics: {
    filesChanged: number
    linesAdded: number
    linesRemoved: number
    testsRun: number
    testsPassed: number
  }
}

export function useSessionManager() {
  const [session, setSession] = useState<Session>({
    active: false,
    startTime: null,
    duration: '00:00:00',
    projectId: null,
    metrics: {
      filesChanged: 0,
      linesAdded: 0,
      linesRemoved: 0,
      testsRun: 0,
      testsPassed: 0
    }
  })
  
  useEffect(() => {
    let interval: NodeJS.Timeout
    
    if (session.active && session.startTime) {
      interval = setInterval(() => {
        const now = new Date()
        const diff = now.getTime() - session.startTime!.getTime()
        
        const hours = Math.floor(diff / (1000 * 60 * 60))
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        
        const duration = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
        
        setSession(prev => ({ ...prev, duration }))
      }, 1000)
    }
    
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [session.active, session.startTime])
  
  const startSession = useCallback(async (projectId?: string) => {
    const startTime = new Date()
    
    setSession({
      active: true,
      startTime,
      duration: '00:00:00',
      projectId: projectId || null,
      metrics: {
        filesChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
        testsRun: 0,
        testsPassed: 0
      }
    })
    
    try {
      await fetch('/api/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId,
          startTime: startTime.toISOString()
        })
      })
    } catch (error) {
      console.error('Error starting session:', error)
    }
  }, [])
  
  const endSession = useCallback(async () => {
    if (!session.active) return
    
    try {
      await fetch('/api/session/end', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: session.projectId,
          duration: session.duration,
          metrics: session.metrics
        })
      })
    } catch (error) {
      console.error('Error ending session:', error)
    }
    
    setSession({
      active: false,
      startTime: null,
      duration: '00:00:00',
      projectId: null,
      metrics: {
        filesChanged: 0,
        linesAdded: 0,
        linesRemoved: 0,
        testsRun: 0,
        testsPassed: 0
      }
    })
  }, [session])
  
  const updateMetrics = useCallback((updates: Partial<Session['metrics']>) => {
    setSession(prev => ({
      ...prev,
      metrics: {
        ...prev.metrics,
        ...updates
      }
    }))
  }, [])
  
  return {
    session,
    startSession,
    endSession,
    updateMetrics
  }
}