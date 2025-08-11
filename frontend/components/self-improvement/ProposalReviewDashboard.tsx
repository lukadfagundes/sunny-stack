'use client'
import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Clock, 
  TrendingUp, 
  Shield,
  Zap,
  FileText,
  RefreshCw,
  ChevronRight,
  Brain,
  AlertCircle,
  Package,
  Activity
} from 'lucide-react'

interface Proposal {
  id: string
  title: string
  description: string
  category: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  risk_level: 'critical' | 'high' | 'medium' | 'low'
  estimated_time: string
  created_at: string
  benefits: string[]
  risks: string[]
  files_affected: string[]
  testing_requirements: string[]
  rollback_plan: string
}

interface DashboardData {
  pending_count: number
  approved_count: number
  rejected_count: number
  critical_pending: number
  high_priority_pending: number
  last_analysis: string | null
  requires_attention: boolean
}

export default function ProposalReviewDashboard() {
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [selectedProposal, setSelectedProposal] = useState<Proposal | null>(null)
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [showApprovalDialog, setShowApprovalDialog] = useState(false)
  const [showRejectDialog, setShowRejectDialog] = useState(false)
  const [rejectReason, setRejectReason] = useState('')

  useEffect(() => {
    fetchProposals()
    fetchDashboardData()
  }, [])

  const fetchProposals = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/self-improvement/proposals', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setProposals(data.proposals || [])
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    }
  }

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch('/api/self-improvement/dashboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      setDashboardData(data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    }
  }

  const runAnalysis = async () => {
    setIsAnalyzing(true)
    try {
      const token = localStorage.getItem('access_token')
      await fetch('/api/self-improvement/analyze', { 
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      // Wait a bit for analysis to complete
      setTimeout(() => {
        fetchProposals()
        fetchDashboardData()
        setIsAnalyzing(false)
      }, 3000)
    } catch (error) {
      console.error('Failed to run analysis:', error)
      setIsAnalyzing(false)
    }
  }

  const approveProposal = async () => {
    if (!selectedProposal) return
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/self-improvement/proposals/${selectedProposal.id}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      
      if (response.ok) {
        const result = await response.json()
        alert(`✅ Proposal approved!\n\nClaude Code prompt has been generated.\nTesting requirements and rollback plan are available.`)
        setShowApprovalDialog(false)
        fetchProposals()
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to approve proposal:', error)
    }
  }

  const rejectProposal = async () => {
    if (!selectedProposal || !rejectReason) return
    
    try {
      const token = localStorage.getItem('access_token')
      const response = await fetch(`/api/self-improvement/proposals/${selectedProposal.id}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason: rejectReason })
      })
      
      if (response.ok) {
        setShowRejectDialog(false)
        setRejectReason('')
        fetchProposals()
        fetchDashboardData()
      }
    } catch (error) {
      console.error('Failed to reject proposal:', error)
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 border-green-200'
      default: return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-green-600 bg-green-50 border-green-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Brain className="w-10 h-10 text-purple-600" />
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Safe Self-Improvement System</h1>
                <p className="text-gray-600">Review and approve improvement proposals before implementation</p>
              </div>
            </div>
            
            <motion.button
              onClick={runAnalysis}
              disabled={isAnalyzing}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`px-6 py-3 rounded-lg flex items-center space-x-2 text-white font-medium
                ${isAnalyzing 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700'}`}
            >
              {isAnalyzing ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  <span>Analyzing...</span>
                </>
              ) : (
                <>
                  <Activity className="w-5 h-5" />
                  <span>Run Analysis</span>
                </>
              )}
            </motion.button>
          </div>
        </div>

        {/* Dashboard Summary */}
        {dashboardData && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <motion.div 
              className="bg-white p-4 rounded-lg border shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <Clock className="w-5 h-5 text-blue-600" />
                <span className="font-medium text-gray-700">Pending</span>
              </div>
              <div className="text-3xl font-bold text-blue-600">{dashboardData.pending_count}</div>
            </motion.div>

            {dashboardData.requires_attention && (
              <motion.div 
                className="bg-red-50 p-4 rounded-lg border-2 border-red-300 shadow-sm"
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-700">Critical</span>
                </div>
                <div className="text-3xl font-bold text-red-600">{dashboardData.critical_pending}</div>
              </motion.div>
            )}

            {!dashboardData.requires_attention && (
              <motion.div 
                className="bg-white p-4 rounded-lg border shadow-sm"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center space-x-2 mb-2">
                  <AlertTriangle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-gray-700">Critical</span>
                </div>
                <div className="text-3xl font-bold text-red-600">{dashboardData.critical_pending}</div>
              </motion.div>
            )}

            <motion.div 
              className="bg-white p-4 rounded-lg border shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-600" />
                <span className="font-medium text-gray-700">High Priority</span>
              </div>
              <div className="text-3xl font-bold text-orange-600">{dashboardData.high_priority_pending}</div>
            </motion.div>

            <motion.div 
              className="bg-white p-4 rounded-lg border shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <span className="font-medium text-gray-700">Approved</span>
              </div>
              <div className="text-3xl font-bold text-green-600">{dashboardData.approved_count}</div>
            </motion.div>

            <motion.div 
              className="bg-white p-4 rounded-lg border shadow-sm"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center space-x-2 mb-2">
                <XCircle className="w-5 h-5 text-gray-600" />
                <span className="font-medium text-gray-700">Rejected</span>
              </div>
              <div className="text-3xl font-bold text-gray-600">{dashboardData.rejected_count}</div>
            </motion.div>
          </div>
        )}

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Proposals List */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Pending Proposals</h2>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {proposals.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                  <p>No pending proposals</p>
                  <p className="text-sm mt-2">Run an analysis to generate improvement proposals</p>
                </div>
              ) : (
                proposals.map((proposal) => (
                  <motion.div
                    key={proposal.id}
                    className={`border rounded-lg p-4 cursor-pointer transition-all
                      ${selectedProposal?.id === proposal.id 
                        ? 'border-purple-500 bg-purple-50' 
                        : 'border-gray-200 hover:border-purple-300 hover:shadow-md'}`}
                    onClick={() => setSelectedProposal(proposal)}
                    whileHover={{ x: 4 }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-gray-800 flex-1">{proposal.title}</h3>
                      <span className={`px-2 py-1 rounded text-xs border ${getPriorityColor(proposal.priority)}`}>
                        {proposal.priority}
                      </span>
                    </div>
                    
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{proposal.description}</p>
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-500">{proposal.category}</span>
                      <span className={`px-2 py-1 rounded border ${getRiskColor(proposal.risk_level)}`}>
                        Risk: {proposal.risk_level}
                      </span>
                      <span className="text-gray-500">{proposal.estimated_time}</span>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>

          {/* Proposal Detail */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            {selectedProposal ? (
              <div className="h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-800">{selectedProposal.title}</h2>
                  <span className={`px-3 py-1 rounded border ${getPriorityColor(selectedProposal.priority)}`}>
                    {selectedProposal.priority}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-2 flex items-center">
                      <FileText className="w-4 h-4 mr-2" />
                      Description
                    </h4>
                    <p className="text-sm text-gray-600">{selectedProposal.description}</p>
                  </div>

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Benefits
                    </h4>
                    <ul className="text-sm text-green-700 space-y-1">
                      {selectedProposal.benefits.map((benefit, index) => (
                        <li key={index} className="flex items-start">
                          <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-red-50 p-4 rounded-lg">
                    <h4 className="font-medium text-red-800 mb-2 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-2" />
                      Risks
                    </h4>
                    <ul className="text-sm text-red-700 space-y-1">
                      {selectedProposal.risks.map((risk, index) => (
                        <li key={index} className="flex items-start">
                          <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{risk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-800 mb-2 flex items-center">
                      <Shield className="w-4 h-4 mr-2" />
                      Testing Requirements
                    </h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      {selectedProposal.testing_requirements.map((req, index) => (
                        <li key={index} className="flex items-start">
                          <ChevronRight className="w-4 h-4 mr-1 mt-0.5 flex-shrink-0" />
                          <span>{req}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-purple-50 p-4 rounded-lg">
                    <h4 className="font-medium text-purple-800 mb-2 flex items-center">
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Rollback Plan
                    </h4>
                    <p className="text-sm text-purple-700">{selectedProposal.rollback_plan}</p>
                  </div>
                </div>

                <div className="flex space-x-3 pt-4 border-t mt-4">
                  <motion.button
                    onClick={() => setShowApprovalDialog(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 font-medium"
                  >
                    ✅ Approve Proposal
                  </motion.button>
                  <motion.button
                    onClick={() => setShowRejectDialog(true)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex-1 bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 font-medium"
                  >
                    ❌ Reject Proposal
                  </motion.button>
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-400">
                <div className="text-center">
                  <FileText className="w-16 h-16 mx-auto mb-4" />
                  <p>Select a proposal to view details</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Approval Dialog */}
        <AnimatePresence>
          {showApprovalDialog && selectedProposal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Confirm Approval</h3>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to approve this proposal? This will generate a Claude Code prompt for implementation.
                </p>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> The actual implementation will still require manual execution of the Claude Code prompt.
                    Review the testing requirements and rollback plan before proceeding.
                  </p>
                </div>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowApprovalDialog(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={approveProposal}
                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Approve & Generate Prompt
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Reject Dialog */}
        <AnimatePresence>
          {showRejectDialog && selectedProposal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            >
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                exit={{ scale: 0.9 }}
                className="bg-white rounded-xl p-6 max-w-md w-full"
              >
                <h3 className="text-xl font-bold text-gray-800 mb-4">Reject Proposal</h3>
                <p className="text-gray-600 mb-4">
                  Please provide a reason for rejecting this proposal:
                </p>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg mb-6"
                  rows={4}
                  placeholder="Enter rejection reason..."
                />
                <div className="flex space-x-3">
                  <button
                    onClick={() => {
                      setShowRejectDialog(false)
                      setRejectReason('')
                    }}
                    className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={rejectProposal}
                    disabled={!rejectReason}
                    className={`flex-1 px-4 py-2 rounded-lg ${
                      rejectReason
                        ? 'bg-red-600 text-white hover:bg-red-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    Reject Proposal
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}