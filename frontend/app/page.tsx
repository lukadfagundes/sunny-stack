'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { ArrowRight, Zap, Brain, Code2, Sparkles } from 'lucide-react'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
      {/* TEST BANNER - Repository Verification */}
      <div style={{
        backgroundColor: '#ff0000',
        color: '#ffffff',
        padding: '20px',
        textAlign: 'center',
        fontSize: '24px',
        fontWeight: 'bold',
        border: '5px solid #ffff00',
        margin: '20px',
        position: 'relative',
        zIndex: 9999
      }}>
        🚀 TESTING: lukadfagundes/sunny-ai-platform Repository - VERIFIED ROUTING ✅ 🚀
      </div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      
      <nav className="relative z-10 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-2"
          >
            <div className="w-10 h-10 rounded-full sunny-gradient flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-amber-900">Sunny</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <Link 
              href="/login"
              className="px-6 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors"
            >
              Get Started
            </Link>
          </motion.div>
        </div>
      </nav>
      
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center mb-20"
        >
          <h1 className="text-6xl font-bold text-amber-900 mb-6">
            Enterprise Software<br />
            <span className="sunny-gradient bg-clip-text text-transparent">
              Delivered Overnight
            </span>
          </h1>
          
          <p className="text-xl text-amber-800 mb-8 max-w-3xl mx-auto">
            One consultant. Three AI assistants. Enterprise solutions faster than traditional teams.
            Experience the future of software consulting with our AI Trinity system.
          </p>
          
          <div className="flex justify-center gap-4">
            <Link
              href="/dashboard"
              className="px-8 py-4 sunny-gradient text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 sunny-glow"
            >
              Launch Trinity Dashboard
              <ArrowRight className="w-5 h-5" />
            </Link>
            
            <Link
              href="/demo"
              className="px-8 py-4 bg-white text-amber-900 rounded-lg hover:shadow-lg transition-all border-2 border-amber-200"
            >
              Watch Demo
            </Link>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20"
        >
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 sunny-gradient rounded-lg flex items-center justify-center mb-4">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-amber-900 mb-2">Claude Web Strategy</h3>
            <p className="text-amber-700">
              Strategic planning and architecture design with Claude Web's advanced reasoning
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 sunny-gradient rounded-lg flex items-center justify-center mb-4">
              <Code2 className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-amber-900 mb-2">Claude Code Execution</h3>
            <p className="text-amber-700">
              Overnight development with real-time monitoring and automated testing
            </p>
          </div>
          
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-all">
            <div className="w-12 h-12 sunny-gradient rounded-lg flex items-center justify-center mb-4">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-xl font-bold text-amber-900 mb-2">Clean Handover</h3>
            <p className="text-amber-700">
              Complete ownership transfer with zero dependencies on our systems
            </p>
          </div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center bg-white rounded-2xl p-12 shadow-xl"
        >
          <h2 className="text-3xl font-bold text-amber-900 mb-6">
            Transform Your Development Process
          </h2>
          <p className="text-lg text-amber-700 mb-8 max-w-2xl mx-auto">
            Join the revolution in software consulting. Our AI Trinity system delivers 
            enterprise-grade solutions with unprecedented speed and quality.
          </p>
          <div className="flex justify-center gap-8 text-amber-900">
            <div>
              <div className="text-4xl font-bold sunny-gradient bg-clip-text text-transparent">10x</div>
              <div className="text-sm">Faster Delivery</div>
            </div>
            <div>
              <div className="text-4xl font-bold sunny-gradient bg-clip-text text-transparent">50%</div>
              <div className="text-sm">Cost Reduction</div>
            </div>
            <div>
              <div className="text-4xl font-bold sunny-gradient bg-clip-text text-transparent">100%</div>
              <div className="text-sm">Code Ownership</div>
            </div>
          </div>
        </motion.div>
      </main>
    </div>
  )
}