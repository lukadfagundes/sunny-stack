'use client'
import { useState } from 'react'
import { Copy, ExternalLink, MessageSquare, Check, Sparkles, Clipboard, ArrowRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function ClaudeWebPanel() {
  const [promptBuilder, setPromptBuilder] = useState('')
  const [conversation, setConversation] = useState('')
  const [copied, setCopied] = useState<string | null>(null)
  
  const openClaudeWeb = () => {
    window.open('https://claude.ai', '_blank')
  }
  
  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopied(id)
    setTimeout(() => setCopied(null), 2000)
  }
  
  const strategicPrompts = [
    {
      id: 'architecture',
      icon: '🏗️',
      title: 'Client Architecture Analysis',
      description: 'Get comprehensive technical architecture recommendations',
      prompt: `I need help designing a comprehensive software architecture for a client project. Here are the requirements: [paste client requirements]. 

Please provide:
1) Technical architecture recommendations with detailed component design
2) Technology stack suggestions with pros/cons analysis
3) Implementation timeline with milestones
4) Risk assessment and mitigation strategies
5) Claude Code artifacts for development

Format any code or technical specifications as artifacts that can be directly used for implementation.`
    },
    {
      id: 'proposal',
      icon: '💼',
      title: 'Proposal Generation',
      description: 'Generate professional client proposals',
      prompt: `Help me create a detailed project proposal for: [describe client project]. 

I need:
1) Executive summary with business impact and ROI projections
2) Technical approach, architecture, and implementation timeline
3) Investment structure with detailed pricing breakdown
4) Risk mitigation strategies and contingency plans
5) Success metrics, deliverables, and acceptance criteria

Make it professional and ready for a $45,000+ enterprise client.`
    },
    {
      id: 'claude-code',
      icon: '⚡',
      title: 'Claude Code Prompt Generator',
      description: 'Create comprehensive development prompts',
      prompt: `I need a comprehensive Claude Code prompt for building: [describe system]. 

Please create a detailed prompt that includes:
1) Complete technical requirements and user stories
2) Architecture specifications with component details
3) Step-by-step implementation guidelines
4) Testing requirements and test cases
5) Deployment instructions and configuration

Make it ready for overnight development with Claude Code. Include all necessary context and specifications.`
    },
    {
      id: 'debug',
      icon: '🔍',
      title: 'System Debug Analysis',
      description: 'Analyze and fix complex system issues',
      prompt: `Help me debug and fix this issue: [describe problem]. 

Context: [provide system context]
Error messages: [paste errors]
What I've tried: [list attempts]

Please provide:
1) Root cause analysis
2) Step-by-step debugging approach
3) Solution with code fixes
4) Prevention strategies
5) Claude Code prompt for implementing fixes`
    },
    {
      id: 'optimize',
      icon: '🚀',
      title: 'Performance Optimization',
      description: 'Optimize system performance and scalability',
      prompt: `I need to optimize: [describe system/component]. 

Current metrics:
- Response time: [current]
- Throughput: [current]
- Resource usage: [current]

Target improvements: [specify goals]

Please provide:
1) Performance bottleneck analysis
2) Optimization strategies with impact estimates
3) Implementation plan with code changes
4) Monitoring and measurement approach
5) Claude Code artifacts for optimization`
    }
  ]
  
  return (
    <div className="bg-white rounded-xl shadow-xl h-full flex flex-col overflow-hidden">
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Claude Web Assistant
            </h3>
            <p className="text-amber-100 text-sm mt-1">Strategic planning with real Claude</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={openClaudeWeb}
            className="text-xs text-amber-900 bg-amber-100 px-3 py-1 rounded-full font-medium hover:bg-amber-200 flex items-center gap-2"
          >
            <ExternalLink size={12} />
            Open Claude.ai
          </motion.button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {/* Workflow Guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <Sparkles className="w-4 h-4" />
            Workflow
          </h4>
          <div className="text-xs text-blue-700 space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">1.</span> Copy strategic prompt below
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">2.</span> Paste in Claude.ai (real Claude)
              <ArrowRight className="w-3 h-3" />
            </div>
            <div className="flex items-center gap-2">
              <span className="font-semibold">3.</span> Copy artifacts to Claude Code panel
            </div>
          </div>
        </div>
        
        {/* Strategic Prompt Templates */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-amber-900 mb-3 flex items-center gap-2">
            <Clipboard className="w-4 h-4" />
            Strategic Consultation Prompts
          </h4>
          
          <div className="space-y-2">
            <AnimatePresence>
              {strategicPrompts.map((prompt) => (
                <motion.button
                  key={prompt.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onClick={() => copyToClipboard(prompt.prompt, prompt.id)}
                  className="w-full text-left p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-amber-50 hover:border-amber-300 transition-all group"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{prompt.icon}</span>
                        <strong className="text-sm text-gray-900">{prompt.title}</strong>
                      </div>
                      <div className="text-gray-600 text-xs mt-1">{prompt.description}</div>
                    </div>
                    <div className="ml-2">
                      {copied === prompt.id ? (
                        <Check className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 group-hover:text-amber-600" />
                      )}
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* Custom Prompt Builder */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-amber-900 mb-3">Custom Strategic Prompt</h4>
          <textarea
            value={promptBuilder}
            onChange={(e) => setPromptBuilder(e.target.value)}
            placeholder="Build a custom strategic consultation prompt for Claude.ai..."
            className="w-full h-24 p-3 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => copyToClipboard(promptBuilder, 'custom')}
            disabled={!promptBuilder.trim()}
            className="mt-2 px-4 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {copied === 'custom' ? <Check size={14} /> : <Copy size={14} />}
            {copied === 'custom' ? 'Copied!' : 'Copy to Clipboard'}
          </motion.button>
        </div>

        {/* Conversation Tracker */}
        <div className="bg-white rounded-lg p-4 border border-gray-200">
          <h4 className="font-medium text-amber-900 mb-3">Conversation Notes</h4>
          <textarea
            value={conversation}
            onChange={(e) => setConversation(e.target.value)}
            placeholder="Track key insights from your Claude.ai conversation..."
            className="w-full h-32 p-3 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-4 border border-amber-200">
          <h4 className="font-medium text-amber-900 mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={openClaudeWeb}
              className="p-3 bg-amber-600 text-white rounded-lg text-sm hover:bg-amber-700 flex items-center justify-center gap-2"
            >
              <ExternalLink size={14} />
              Open Claude.ai
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                const prompt = "Let's continue our Sunny platform strategic planning. What should we work on next for the trinity interface?"
                copyToClipboard(prompt, 'continue')
              }}
              className="p-3 bg-gray-600 text-white rounded-lg text-sm hover:bg-gray-700 flex items-center justify-center gap-2"
            >
              {copied === 'continue' ? <Check size={14} /> : <MessageSquare size={14} />}
              Continue Session
            </motion.button>
          </div>
        </div>
      </div>
    </div>
  )
}