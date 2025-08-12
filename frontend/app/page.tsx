'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { Code, Server, Zap, CheckCircle, Rocket, Database, Globe, Cpu, Shield, Clock, Users, HeartHandshake } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function LandingPage() {
  const [mounted, setMounted] = useState(false)
  
  useEffect(() => {
    setMounted(true)
    console.log('🔧 [LANDING] Complete rebrand - Professional Software Development')
  }, [])

  if (!mounted) return null

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' }}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/20 via-orange-400/20 to-amber-500/20" />
        <div className="container mx-auto px-6 py-20 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-6xl md:text-8xl font-bold text-white mb-4 drop-shadow-lg">
              SUNNY STACK
            </h1>
            <h2 className="text-3xl md:text-4xl font-semibold text-white/95 mb-6">
              Professional Software Development
            </h2>
            <p className="text-xl text-white/90 max-w-3xl mx-auto mb-8">
              Custom web applications delivered fast. Modern, reliable, scalable solutions for your business needs.
            </p>
            <Link
              href="/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-lg font-semibold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Sign In
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-white/95">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              Development Services
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
              {/* Web Applications */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border-t-4 border-yellow-500"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-lg mb-6">
                  <Globe className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">🌐 Web Applications</h3>
                <p className="text-gray-600 mb-4">
                  Full-stack web development with modern frameworks
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>React/Next.js frontends</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Python/FastAPI backends</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Database design & optimization</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Cloud deployment & scaling</span>
                  </li>
                </ul>
              </motion.div>

              {/* Rapid Prototyping */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border-t-4 border-orange-500"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-orange-400 to-amber-400 rounded-lg mb-6">
                  <Zap className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">⚡ Rapid Prototyping</h3>
                <p className="text-gray-600 mb-4">
                  Fast iteration from concept to working prototype
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>MVP development</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>User interface design</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>API development</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Testing & validation</span>
                  </li>
                </ul>
              </motion.div>

              {/* System Integration */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-xl p-8 shadow-lg hover:shadow-xl transition-all border-t-4 border-amber-500"
              >
                <div className="flex items-center justify-center w-14 h-14 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-lg mb-6">
                  <Cpu className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">🔧 System Integration</h3>
                <p className="text-gray-600 mb-4">
                  Connect and optimize your existing systems
                </p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>API integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Data migration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Workflow automation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Performance optimization</span>
                  </li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="py-20 bg-gradient-to-br from-amber-50 to-yellow-50">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <h2 className="text-4xl font-bold text-center mb-12 text-gray-800">
              Why Choose Sunny Stack?
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
              {/* Fast Delivery */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.7 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mx-auto mb-4">
                  <Rocket className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">⚡ Fast Delivery</h3>
                <p className="text-gray-600">
                  Rapid development cycles with professional quality standards
                </p>
              </motion.div>

              {/* Professional Standards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-orange-400 to-amber-400 rounded-full mx-auto mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">🏢 Professional Standards</h3>
                <p className="text-gray-600">
                  Enterprise-grade code quality, security, and documentation
                </p>
              </motion.div>

              {/* Custom Solutions */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.9 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full mx-auto mb-4">
                  <Code className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">🎯 Custom Solutions</h3>
                <p className="text-gray-600">
                  Tailored development to match your specific business requirements
                </p>
              </motion.div>

              {/* Ongoing Support */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.0 }}
                className="bg-white rounded-xl p-6 shadow-lg text-center"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full mx-auto mb-4">
                  <HeartHandshake className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">🔄 Ongoing Support</h3>
                <p className="text-gray-600">
                  Maintenance, updates, and feature enhancements as you grow
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Technology Stack Section */}
      <section className="py-20 bg-white/95">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-gray-800 mb-8">
              Modern Technology Stack
            </h2>
            <p className="text-xl text-gray-600 mb-12">
              Building with the latest and most reliable technologies
            </p>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 shadow">
                <h4 className="font-semibold text-gray-800">Frontend</h4>
                <p className="text-sm text-gray-600 mt-1">React, Next.js, TypeScript</p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-amber-50 rounded-lg p-4 shadow">
                <h4 className="font-semibold text-gray-800">Backend</h4>
                <p className="text-sm text-gray-600 mt-1">FastAPI, Node.js, Python</p>
              </div>
              <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4 shadow">
                <h4 className="font-semibold text-gray-800">Database</h4>
                <p className="text-sm text-gray-600 mt-1">PostgreSQL, MongoDB, Redis</p>
              </div>
              <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-4 shadow">
                <h4 className="font-semibold text-gray-800">Cloud</h4>
                <p className="text-sm text-gray-600 mt-1">AWS, Vercel, Cloudflare</p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-br from-yellow-400 to-orange-500">
        <div className="container mx-auto px-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.0 }}
            className="max-w-2xl mx-auto text-center"
          >
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Build Something Great?
            </h2>
            <p className="text-xl text-white/90 mb-8">
              Let's discuss your project and create a custom solution that drives your business forward.
            </p>
            <Link
              href="/login"
              className="inline-block px-10 py-4 bg-white text-orange-600 text-lg font-bold rounded-lg shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-200"
            >
              Sign In to Get Started
            </Link>
            <div className="mt-8 flex justify-center space-x-8 text-white/80">
              <div className="flex items-center">
                <Clock className="w-5 h-5 mr-2" />
                <span>Fast Turnaround</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-5 h-5 mr-2" />
                <span>Secure & Reliable</span>
              </div>
              <div className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                <span>Client-Focused</span>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col items-center">
            <div className="flex items-center space-x-3 mb-4">
              <Code className="w-8 h-8 text-yellow-400" />
              <h3 className="text-2xl font-bold">Sunny Stack</h3>
            </div>
            <p className="text-gray-400 mb-2">Professional Software Development</p>
            <p className="text-gray-500 text-sm">© 2025 Sunny Stack • All rights reserved</p>
            <p className="text-gray-600 text-xs mt-4 italic">powered by Cola Records</p>
          </div>
        </div>
      </footer>
    </div>
  )
}