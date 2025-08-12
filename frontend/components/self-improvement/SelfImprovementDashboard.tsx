'use client'
import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Brain, Zap, TrendingUp, Code, AlertCircle, CheckCircle, RefreshCw, Clock, Activity } from 'lucide-react'

interface SelfImprovementStatus {
  improvement_active: boolean
  scheduled_improvements: number
  analysis_history: number
  last_analysis: string | null
}

interface AnalysisResult {
  timestamp: string
  analysis_id: string
  codebase_health: {
    total_files: number
    python_files: number
    typescript_files: number
    technical_debt_score: number
    code_quality_issues: any[]
  }
  improvement_opportunities: any[]
  claude_code_prompts: string[]
}

export default function SelfImprovementDashboard() {
  const [status, setStatus] = useState<SelfImprovementStatus | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isImproving, setIsImproving] = useState(false)
  const [latestAnalysis, setLatestAnalysis] = useState<AnalysisResult | null>(null)
  const [isExecuting, setIsExecuting] = useState(false)

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(fetchStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchStatus = async () => {
    try {
      const response = await fetch('/api/self-improvement/status')
      const data = await response.json()
      setStatus(data)
    } catch (error) {
      console.error('Failed to fetch self-improvement status:', error)
    }
  }

  const triggerAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const response = await fetch('/api/self-improvement/analyze', { method: 'POST' })
      const data = await response.json()
      setLatestAnalysis(data)
      await fetchStatus()
    } catch (error) {
      console.error('Failed to trigger analysis:', error)
    } finally {
      setIsAnalyzing(false)
    }
  }

  const triggerImprovement = async () => {
    setIsImproving(true)
    try {
      await fetch('/api/self-improvement/improve', { method: 'POST' })
      await fetchStatus()
    } catch (error) {
      console.error('Failed to trigger improvement:', error)
    } finally {
      setIsImproving(false)
    }
  }

  const executeNext = async () => {
    setIsExecuting(true)
    try {
      await fetch('/api/self-improvement/execute-next', { method: 'POST' })
      await fetchStatus()
    } catch (error) {
      console.error('Failed to execute next improvement:', error)
    } finally {
      setIsExecuting(false)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-gradient-to-br from-purple-50 to-blue-50 min-h-screen">
      <div className="bg-white rounded-xl shadow-lg p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Brain className="w-10 h-10 text-purple-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Sunny Self-Improvement Engine</h1>
            <p className="text-gray-600">Autonomous evolution and optimization system</p>
          </div>
        </div>

        {status && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <motion.div 
              className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Activity className="w-5 h-5 text-purple-700" />
                <span className="font-medium text-purple-700">System Status</span>
              </div>
              <div className={`text-xl font-bold ${status.improvement_active ? 'text-purple-800' : 'text-purple-600'}`}>
                {status.improvement_active ? '🧬 Evolving...' : '✨ Ready'}
              </div>
              {status.improvement_active && (
                <div className="mt-2">
                  <div className="animate-pulse bg-purple-300 h-1 rounded-full"></div>
                </div>
              )}
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Code className="w-5 h-5 text-blue-700" />
                <span className="font-medium text-blue-700">Scheduled</span>
              </div>
              <div className="text-xl font-bold text-blue-800">
                {status.scheduled_improvements}
              </div>
              <div className="text-sm text-blue-600 mt-1">improvements</div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-700" />
                <span className="font-medium text-green-700">Analyses</span>
              </div>
              <div className="text-xl font-bold text-green-800">
                {status.analysis_history}
              </div>
              <div className="text-sm text-green-600 mt-1">completed</div>
            </motion.div>

            <motion.div 
              className="bg-gradient-to-br from-orange-100 to-orange-200 p-4 rounded-lg"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-orange-700" />
                <span className="font-medium text-orange-700">Last Analysis</span>
              </div>
              <div className="text-sm text-orange-800 font-medium">
                {status.last_analysis 
                  ? new Date(status.last_analysis).toLocaleString()
                  : 'Never'
                }
              </div>
            </motion.div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <motion.button
            onClick={triggerAnalysis}
            disabled={isAnalyzing || status?.improvement_active}
            className="bg-gradient-to-r from-purple-600 to-purple-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 hover:from-purple-700 hover:to-purple-800 disabled:opacity-50 transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isAnalyzing ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Brain className="w-5 h-5" />
            )}
            <span className="font-medium">{isAnalyzing ? 'Analyzing...' : 'Analyze Codebase'}</span>
          </motion.button>

          <motion.button
            onClick={triggerImprovement}
            disabled={isImproving || status?.improvement_active}
            className="bg-gradient-to-r from-blue-600 to-blue-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isImproving ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Zap className="w-5 h-5" />
            )}
            <span className="font-medium">{isImproving ? 'Evolving...' : 'Start Evolution'}</span>
          </motion.button>

          <motion.button
            onClick={executeNext}
            disabled={!status?.scheduled_improvements || isExecuting}
            className="bg-gradient-to-r from-green-600 to-green-700 text-white p-4 rounded-lg flex items-center justify-center space-x-2 hover:from-green-700 hover:to-green-800 disabled:opacity-50 transition-all shadow-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isExecuting ? (
              <RefreshCw className="w-5 h-5 animate-spin" />
            ) : (
              <Code className="w-5 h-5" />
            )}
            <span className="font-medium">{isExecuting ? 'Executing...' : 'Execute Next'}</span>
          </motion.button>
        </div>

        {latestAnalysis && (
          <motion.div 
            className="bg-gradient-to-r from-purple-100 via-blue-100 to-green-100 p-6 rounded-lg mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-lg font-bold text-gray-800 mb-4">📊 Latest Analysis Results</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-3 rounded">
                <span className="text-sm text-gray-600">Total Files</span>
                <div className="text-xl font-bold text-gray-800">{latestAnalysis.codebase_health.total_files}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <span className="text-sm text-gray-600">Python Files</span>
                <div className="text-xl font-bold text-purple-600">{latestAnalysis.codebase_health.python_files}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <span className="text-sm text-gray-600">TypeScript Files</span>
                <div className="text-xl font-bold text-blue-600">{latestAnalysis.codebase_health.typescript_files}</div>
              </div>
              <div className="bg-white p-3 rounded">
                <span className="text-sm text-gray-600">Tech Debt Score</span>
                <div className={`text-xl font-bold ${
                  latestAnalysis.codebase_health.technical_debt_score > 50 ? 'text-red-600' :
                  latestAnalysis.codebase_health.technical_debt_score > 30 ? 'text-orange-600' :
                  'text-green-600'
                }`}>
                  {latestAnalysis.codebase_health.technical_debt_score}/100
                </div>
              </div>
            </div>
            
            {latestAnalysis.improvement_opportunities.length > 0 && (
              <div className="mt-4">
                <h3 className="font-medium text-gray-700 mb-2">🎯 Improvement Opportunities Found: {latestAnalysis.improvement_opportunities.length}</h3>
              </div>
            )}
            
            {latestAnalysis.claude_code_prompts.length > 0 && (
              <div className="mt-2">
                <h3 className="font-medium text-gray-700">🤖 AI Improvements Generated: {latestAnalysis.claude_code_prompts.length}</h3>
              </div>
            )}
          </motion.div>
        )}

        <div className="bg-gradient-to-r from-indigo-100 to-purple-100 p-6 rounded-lg">
          <h2 className="text-xl font-bold text-gray-800 mb-3 flex items-center">
            <TrendingUp className="w-6 h-6 mr-2 text-indigo-600" />
            Evolution Capabilities
          </h2>
          <div className="space-y-2 text-gray-700">
            <p className="flex items-start">
              <span className="mr-2">🧬</span>
              <span>Autonomous code analysis and quality assessment</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">🔧</span>
              <span>Automatic refactoring of high-complexity functions</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">⚡</span>
              <span>Performance optimization and bottleneck detection</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">🤖</span>
              <span>Automated code improvements and optimization</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">📈</span>
              <span>Continuous technical debt reduction</span>
            </p>
            <p className="flex items-start">
              <span className="mr-2">🔄</span>
              <span>Daily automatic evolution cycles at 3 AM</span>
            </p>
          </div>
          
          {status?.improvement_active && (
            <motion.div 
              className="mt-4 p-3 bg-purple-200 rounded text-purple-800 font-medium"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              🧬 Sunny is currently evolving... New capabilities are being synthesized!
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}